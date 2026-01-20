from http.server import BaseHTTPRequestHandler
import json
import asyncio
import os
import sys
from urllib.parse import urlparse, parse_qs

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

# Import dependencies - but catch errors gracefully
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
    from src.utils.errors import APIError, APITimeoutError
    
    logger = get_logger(__name__)
except Exception as e:
    import traceback
    INIT_ERROR = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "type": type(e).__name__
    }

async def search_source(service, query, search_type, limit, source_name):
    """Search a single source"""
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

async def perform_search(request):
    """Perform search across all sources"""
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
        # Check if initialization failed
        if INIT_ERROR:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InitializationError",
                "message": "Failed to initialize backend modules",
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
            self.wfile.write(response.model_dump_json().encode('utf-8'))

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
                "details": e.errors()
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
                "traceback": traceback_str
            }).encode('utf-8'))
