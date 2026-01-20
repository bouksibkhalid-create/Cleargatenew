from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
            body = json.loads(body_str)
            
            query = body.get('query', 'Unknown')
            
            # Mock entity matching the query
            mock_entity = {
                "id": "demo-1",
                "name": query,
                "schema": "Person",
                "aliases": [f"{query} (Demo)"],
                "birth_date": None,
                "death_date": None,
                "nationalities": ["Demo Country"],
                "countries": ["Demo Country"],
                "is_sanctioned": True,
                "sanction_programs": [{
                    "program": "Demo Sanctions Program",
                    "authority": "Demo Authority",
                    "start_date": "2024-01-01",
                    "reason": "Demo purposes - This is mock data"
                }],
                "datasets": ["demo"],
                "properties": {
                    "description": f"Demo entity for {query}. This is mock data for testing purposes."
                },
                "first_seen": "2024-01-01",
                "last_seen": "2024-01-20",
                "url": "https://demo.com",
                "match_score": 100,
                "source": "opensanctions"
            }
            
            # Response matching frontend SearchResponse interface
            response = {
                "query": query,
                "search_type": body.get('search_type', 'exact'),
                "results_by_source": {
                    "opensanctions": {
                        "found": True,
                        "count": 1,
                        "sanctioned_count": 1,
                        "error": None,
                        "results": [mock_entity]
                    },
                    "sanctions_io": {
                        "found": False,
                        "count": 0,
                        "sanctioned_count": 0,
                        "error": "Demo mode - API not configured",
                        "results": []
                    },
                    "offshore_leaks": {
                        "found": False,
                        "count": 0,
                        "sanctioned_count": 0,
                        "error": "Demo mode - API not configured",
                        "results": []
                    }
                },
                "all_results": [mock_entity],
                "total_results": 1,
                "total_sanctioned": 1,
                "offshore_connections_found": False,
                "sources_searched": body.get('sources', ["opensanctions", "sanctions_io", "offshore_leaks"]),
                "sources_succeeded": ["opensanctions"],
                "sources_failed": ["sanctions_io", "offshore_leaks"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "fuzzy_threshold": body.get('fuzzy_threshold', 80)
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                "error": "InternalError",
                "message": str(e),
                "details": str(type(e).__name__),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_GET(self):
        self.do_POST()
