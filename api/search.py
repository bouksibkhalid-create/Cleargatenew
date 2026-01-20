from http.server import BaseHTTPRequestHandler
import json
import asyncio
import os
import sys
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# Add the backend directory to sys.path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(root_path, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if root_path not in sys.path:
    sys.path.append(root_path)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

# Import dependencies
INIT_ERROR = None
try:
    from src.models.requests import SearchRequest
    from src.services.data_sources.supabase_search_service import get_supabase_search_service
    from src.services.offshore_service import OffshoreLeaksService
    from src.models.responses import SanctionProgram, OpenSanctionsEntity
    from src.utils.logger import get_logger
    from pydantic import ValidationError
    
    logger = get_logger(__name__)
except Exception as e:
    import traceback
    INIT_ERROR = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "type": type(e).__name__
    }

def convert_supabase_to_entity(result: dict) -> dict:
    """Convert Supabase result to OpenSanctions entity format"""
    sanction_programs = []
    for prog in result.get('programs', []):
        sanction_programs.append({
            "program": prog,
            "authority": result.get('source', 'Unknown'),
            "start_date": result.get('date_added') or result.get('dateAdded'),
            "reason": None
        })
    
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
    
    return {
        "id": result.get('source_id', result.get('id', '')),
        "name": result.get('name', 'Unknown'),
        "schema": entity_schema,
        "countries": result.get('nationalities', []),
        "aliases": result.get('aliases', []),
        "birth_date": birth_date,
        "death_date": None,
        "nationalities": result.get('nationalities', []),
        "is_sanctioned": True,
        "sanction_programs": sanction_programs,
        "datasets": [result.get('source', 'Supabase')],
        "properties": {
            "description": f"Sanctioned entity from {result.get('source', 'database')}"
        },
        "first_seen": result.get('date_added'),
        "last_seen": None,
        "url": result.get('source_url', result.get('sourceUrl', 'https://supabase.co')),
        "match_score": int(match_score),
        "source": "opensanctions"
    }

async def perform_search(request):
    """Perform search using Supabase and Neo4j only"""
    
    # Search Supabase for sanctions data
    supabase_results = []
    supabase_error = None
    
    try:
        supabase_service = get_supabase_search_service()
        results = supabase_service.search(query=request.query, limit=request.limit)
        
        if results:
            supabase_results = [convert_supabase_to_entity(r) for r in results]
            logger.info("supabase_search_success", query=request.query, count=len(supabase_results))
    except Exception as e:
        supabase_error = f"Supabase search failed: {str(e)}"
        logger.error("supabase_search_error", query=request.query, error=str(e))
    
    # Search Neo4j for offshore/intelligence data
    offshore_results = []
    offshore_error = None
    
    if "offshore_leaks" in request.sources:
        try:
            offshore_service = OffshoreLeaksService()
            offshore_results = await offshore_service.search(query=request.query, limit=request.limit)
            await offshore_service.client.close()
            logger.info("offshore_search_success", query=request.query, count=len(offshore_results))
        except Exception as e:
            offshore_error = f"Offshore search failed: {str(e)}"
            logger.error("offshore_search_error", query=request.query, error=str(e))
    
    # Build response matching frontend expectations
    total_sanctioned = len([r for r in supabase_results if r.get('is_sanctioned')])
    
    response = {
        "query": request.query,
        "search_type": request.search_type,
        "results_by_source": {
            "opensanctions": {
                "found": len(supabase_results) > 0,
                "count": len(supabase_results),
                "sanctioned_count": total_sanctioned,
                "error": supabase_error,
                "results": supabase_results
            },
            "sanctions_io": {
                "found": False,
                "count": 0,
                "sanctioned_count": 0,
                "error": "Not configured - using Supabase instead",
                "results": []
            },
            "offshore_leaks": {
                "found": len(offshore_results) > 0,
                "count": len(offshore_results),
                "sanctioned_count": 0,
                "error": offshore_error,
                "results": offshore_results
            }
        },
        "all_results": supabase_results + offshore_results,
        "total_results": len(supabase_results) + len(offshore_results),
        "total_sanctioned": total_sanctioned,
        "offshore_connections_found": len(offshore_results) > 0,
        "sources_searched": request.sources,
        "sources_succeeded": [s for s in ["opensanctions", "offshore_leaks"] if (s == "opensanctions" and not supabase_error) or (s == "offshore_leaks" and not offshore_error)],
        "sources_failed": [s for s in ["opensanctions", "offshore_leaks"] if (s == "opensanctions" and supabase_error) or (s == "offshore_leaks" and offshore_error)],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "fuzzy_threshold": request.fuzzy_threshold
    }
    
    return response

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
        # Check if initialization failed
        if INIT_ERROR:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InitializationError",
                "message": "Failed to initialize backend modules",
                "details": INIT_ERROR,
                "timestamp": datetime.utcnow().isoformat() + "Z"
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
                parsed = urlparse(self.path)
                params = parse_qs(parsed.query)
                body = {k: v[0] for k, v in params.items()}

            # Validate and create request
            request = SearchRequest(**body)
            
            # Perform search
            response = asyncio.run(perform_search(request))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

        except ValidationError as e:
            import traceback
            traceback.print_exc()
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "ValidationError",
                "message": "Invalid request parameters",
                "details": e.errors(),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode('utf-8'))
            
        except Exception as e:
            import traceback
            traceback_str = traceback.format_exc()
            print(f"ERROR: {str(e)}\n{traceback_str}")
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InternalError", 
                "message": str(e),
                "traceback": traceback_str,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode('utf-8'))
