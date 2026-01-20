from http.server import BaseHTTPRequestHandler
import json

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
            
            # Ultra-simple mock response
            response = {
                "query": query,
                "search_type": "exact",
                "total_results": 1,
                "opensanctions_results": [{
                    "id": "demo-1",
                    "name": query,
                    "schema": "Person",
                    "aliases": [],
                    "birth_date": None,
                    "nationalities": ["Demo"],
                    "countries": ["Demo"],
                    "is_sanctioned": True,
                    "sanction_programs": [{
                        "program": "Demo Program",
                        "authority": "Demo Authority",
                        "start_date": "2024-01-01",
                        "reason": "Demo purposes"
                    }],
                    "datasets": ["demo"],
                    "url": "https://demo.com",
                    "match_score": 100,
                    "source": "demo"
                }],
                "sanctions_io_results": [],
                "offshore_leaks_results": [],
                "opensanctions_error": None,
                "sanctions_io_error": None,
                "offshore_leaks_error": None,
                "sources_requested": ["opensanctions"]
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
                "type": type(e).__name__
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_GET(self):
        self.do_POST()
