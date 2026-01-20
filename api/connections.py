from http.server import BaseHTTPRequestHandler
import json
import asyncio
import os
import sys

# Add the backend directory to sys.path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(root_path, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if root_path not in sys.path:
    sys.path.append(root_path)

from dotenv import load_dotenv
load_dotenv()

try:
    from src.services.graph_service import GraphService
    from src.services.offshore_service import OffshoreLeaksService
    from src.models.graph_models import ConnectionRequest, ConnectionResponse
    from src.utils.logger import get_logger
    from src.utils.errors import APIError
    from pydantic import ValidationError
except ImportError:
    pass

logger = get_logger(__name__)

async def get_connections(request: ConnectionRequest) -> ConnectionResponse:
    graph_service = GraphService()
    offshore_service = OffshoreLeaksService()
    
    node = await offshore_service.get_by_id(request.node_id)
    if not node:
        raise APIError(f"Node with ID {request.node_id} not found", status_code=404)
    
    graph = await graph_service.get_connections(
        node_id=request.node_id,
        depth=request.depth,
        max_nodes=request.max_nodes
    )
    
    return ConnectionResponse(
        node_id=request.node_id,
        node_name=node.name,
        graph=graph
    )

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8')
            body = json.loads(body_str) if body_str else {}
            
            request = ConnectionRequest(**body)
            response = asyncio.run(get_connections(request))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.model_dump_json().encode('utf-8'))
            
        except ValidationError as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "ValidationError",
                "message": "Invalid request parameters",
                "details": e.errors() # pydantic errors are list of dicts
            }).encode('utf-8'))
            
        except APIError as e:
            self.send_response(getattr(e, 'status_code', 500))
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "APIError",
                "message": str(e)
            }).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InternalError",
                "message": str(e)
            }).encode('utf-8'))
