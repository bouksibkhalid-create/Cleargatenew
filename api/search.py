from http.server import BaseHTTPRequestHandler
import json
import asyncio
import os
import sys
from urllib.parse import urlparse, parse_qs

# Add the backend directory to sys.path so 'src' can be imported
# Vercel places the function in /var/task/api/search.py (or similiar)
# Repo root is likely ..
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(root_path, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Also add root just in case
if root_path not in sys.path:
    sys.path.append(root_path)

from dotenv import load_dotenv
load_dotenv()

# Import original logic (adapted imports)
# We assume src is in backend/src, so 'from src...' works if backend is in path
# Global error capture
INIT_ERROR = None

try:
    from src.models.requests import SearchRequest
    from src.models.responses import ErrorResponse
    from src.utils.logger import get_logger
    from pydantic import ValidationError
    
    from src.services.opensanctions_service import OpenSanctionsService
    from src.services.sanctions_io_service import SanctionsIoService
    from src.services.offshore_service import OffshoreLeaksService
    from src.services.aggregator import ResultAggregator
    from src.services.data_sources.local_search_service import get_local_sanctions_service
    from src.models.responses import SanctionProgram, OpenSanctionsEntity
    from src.utils.decorators import cached, rate_limit
    
    logger = get_logger(__name__)

except Exception as e:
    import traceback
    INIT_ERROR = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "type": "ImportError"
    }
    # Define dummy logger to avoid NameError later if used in global scope (though we should avoid using it if INIT_ERROR)
    class DummyLogger:
        def info(self, *args, **kwargs): pass
        def error(self, *args, **kwargs): pass
        def warning(self, *args, **kwargs): pass
    logger = DummyLogger()

# --- Re-implementing helper functions from original search.py ---

def search_local_sanctions(query: str, limit: int = 50):
    from src.models.responses import SanctionProgram
    
    def convert_to_entity(result: dict) -> OpenSanctionsEntity:
        sanction_programs = []
        for prog in result.get('programs', []):
            sanction_programs.append(SanctionProgram(
                program=prog,
                authority=result.get('source', 'Unknown'),
                start_date=result.get('date_added') or result.get('dateAdded'),
                reason=None
            ))
        
        entity_type = result.get('entity_type', result.get('type', 'person'))
        schema_map = {
            'person': 'Person',
            'company': 'Company', 
            'organization': 'Organization',
            'vessel': 'Vessel',
            'aircraft': 'Aircraft',
        }
        entity_schema = schema_map.get(entity_type, 'LegalEntity')
        
        birth_dates = result.get('birth_dates', result.get('birthDates', []))
        birth_date = birth_dates[0] if birth_dates else None
        
        match_score = result.get('matchScore', result.get('match_score', 1.0))
        if isinstance(match_score, float) and match_score <= 1.0:
            match_score = int(match_score * 100)
        
        return OpenSanctionsEntity(
            id=result.get('source_id', result.get('id', '')),
            name=result.get('name', 'Unknown'),
            schema=entity_schema,
            countries=result.get('nationalities', []),
            aliases=result.get('aliases', []),
            birth_date=birth_date,
            nationalities=result.get('nationalities', []),
            sanction_programs=sanction_programs,
            is_sanctioned=True,
            match_score=int(match_score),
            url=result.get('source_url', result.get('sourceUrl', 'https://sanctionssearch.ofac.treas.gov/')),
            datasets=[result.get('source', 'Local')],
            source="opensanctions",
        )
    
    try:
        from src.services.data_sources.supabase_search_service import get_supabase_search_service
        supabase_service = get_supabase_search_service()
        results = supabase_service.search(query=query, limit=limit)
        
        if results:
            entities = [convert_to_entity(r) for r in results]
            logger.info("supabase_sanctions_search_success", query=query, results_count=len(entities))
            return (entities, None)
        logger.info("supabase_no_results_fallback_to_local", query=query)
    except Exception as e:
        logger.warning("supabase_search_failed_fallback_to_local", query=query, error=str(e))
    
    try:
        local_service = get_local_sanctions_service()
        results = local_service.search(query=query, limit=limit)
        entities = [convert_to_entity(r) for r in results]
        logger.info("local_sanctions_search_success", query=query, results_count=len(entities))
        return (entities, None)
    except Exception as e:
        logger.error("local_sanctions_search_error", query=query, error=str(e))
        return ([], f"Sanctions search error: {str(e)}")

async def search_source(service, query, search_type, limit, source_name):
    from src.utils.errors import APIError, APITimeoutError
    try:
        if source_name == "sanctions_io" and hasattr(service, 'search'):
            results = await service.search(query=query, fuzzy=(search_type == "fuzzy"), limit=limit)
        else:
            results = await service.search(query=query, limit=limit)
        return (results, None)
    except APITimeoutError as e:
        logger.warning(f"{source_name}_timeout", query=query, error=str(e))
        return ([], "Request timed out")
    except APIError as e:
        logger.warning(f"{source_name}_error", query=query, error=str(e))
        return ([], str(e.message) if hasattr(e, 'message') else str(e))
    except Exception as e:
        logger.error(f"{source_name}_unexpected_error", query=query, error=str(e))
        return ([], f"Unexpected error: {str(e)}")

async def perform_search(request: SearchRequest):
    opensanctions_service = OpenSanctionsService()
    sanctions_io_service = SanctionsIoService()
    aggregator = ResultAggregator(fuzzy_threshold=request.fuzzy_threshold)
    
    try:
        tasks = []
        task_sources = []
        
        if "opensanctions" in request.sources:
            tasks.append(search_source(opensanctions_service, request.query, request.search_type, request.limit, "opensanctions"))
            task_sources.append("opensanctions")
        
        if "sanctions_io" in request.sources:
            tasks.append(search_source(sanctions_io_service, request.query, request.search_type, request.limit, "sanctions_io"))
            task_sources.append("sanctions_io")
            
        offshore_service = None
        offshore_leaks_results = []
        offshore_leaks_error = None
        
        if "offshore_leaks" in request.sources:
            try:
                offshore_service = OffshoreLeaksService()
                offshore_leaks_results = await offshore_service.search(query=request.query, limit=request.limit)
                task_sources.append("offshore_leaks")
            except Exception as e:
                offshore_leaks_error = str(e)
                task_sources.append("offshore_leaks")
        
        results = await asyncio.gather(*tasks)
        
        opensanctions_results = []
        opensanctions_error = None
        sanctions_io_results = []
        sanctions_io_error = None
        
        for i, (task_results, error) in enumerate(results):
            source = task_sources[i]
            if source == "opensanctions":
                opensanctions_results = task_results
                opensanctions_error = error
            elif source == "sanctions_io":
                sanctions_io_results = task_results
                sanctions_io_error = error
        
        local_results, local_error = search_local_sanctions(request.query, request.limit)
        if local_results:
             if opensanctions_error and not opensanctions_results:
                opensanctions_results = local_results
                opensanctions_error = None
             else:
                existing_names = {e.name.lower() for e in opensanctions_results}
                for local_entity in local_results:
                    if local_entity.name.lower() not in existing_names:
                        opensanctions_results.append(local_entity)
                        existing_names.add(local_entity.name.lower())

        response = aggregator.aggregate(
            query=request.query,
            search_type=request.search_type,
            opensanctions_results=opensanctions_results,
            sanctions_io_results=sanctions_io_results,
            opensanctions_error=opensanctions_error,
            sanctions_io_error=sanctions_io_error,
            offshore_leaks_results=offshore_leaks_results,
            offshore_leaks_error=offshore_leaks_error,
            sources_requested=request.sources
        )
        return response
        
    finally:
        await opensanctions_service.close()
        await sanctions_io_service.close()
        if offshore_service:
            await offshore_service.client.close()

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        self.handle_request('POST')

    def do_GET(self):
        self.handle_request('GET')

    def handle_request(self, method):
        # Check for initialization errors first
        if INIT_ERROR:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InitializationError",
                "message": "Function failed to initialize",
                "details": INIT_ERROR
            }).encode('utf-8'))
            return

        try:
            body = {}
            if method == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                body_str = self.rfile.read(content_length).decode('utf-8')
                if body_str:
                    body = json.loads(body_str)
            else:
                # Parse query params
                parsed = urlparse(self.path)
                params = parse_qs(parsed.query)
                # parse_qs returns lists, flatten them
                body = {k: v[0] for k, v in params.items()}

            request = SearchRequest(**body)
            response = asyncio.run(perform_search(request))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.model_dump_json().encode('utf-8'))

        except ValidationError as e:
            import traceback
            traceback.print_exc()
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(ErrorResponse(error="ValidationError", message="Invalid request", details=json.dumps(e.errors())).model_dump_json().encode('utf-8'))
        except Exception as e:
            import traceback
            traceback_str = traceback.format_exc()
            print(f"ERROR: {str(e)}\n{traceback_str}")
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            # Return the traceback in the response for easier debugging
            self.wfile.write(json.dumps({
                "error": "InternalError", 
                "message": str(e),
                "traceback": traceback_str
            }).encode('utf-8'))
