from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

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

            query = body.get('query', '')
            
            # Return mock data for demonstration
            mock_response = {
                "query": query,
                "search_type": body.get('search_type', 'exact'),
                "total_results": 3,
                "opensanctions_results": [
                    {
                        "id": "Q7747",
                        "name": query if query else "Vladimir Putin",
                        "schema": "Person",
                        "aliases": ["Vladimir Vladimirovich Putin", "Владимир Путин"],
                        "birth_date": "1952-10-07",
                        "nationalities": ["Russia"],
                        "countries": ["Russia"],
                        "is_sanctioned": True,
                        "sanction_programs": [
                            {
                                "program": "EU Sanctions",
                                "authority": "European Union",
                                "start_date": "2022-02-25",
                                "reason": "Actions undermining Ukraine's sovereignty"
                            },
                            {
                                "program": "US OFAC SDN",
                                "authority": "United States",
                                "start_date": "2022-02-24",
                                "reason": "Russian aggression against Ukraine"
                            }
                        ],
                        "datasets": ["eu_fsf", "us_ofac_sdn"],
                        "url": "https://www.opensanctions.org/entities/Q7747/",
                        "match_score": 100,
                        "source": "opensanctions"
                    }
                ],
                "sanctions_io_results": [],
                "offshore_leaks_results": [],
                "opensanctions_error": None,
                "sanctions_io_error": "Demo mode - API not configured",
                "offshore_leaks_error": "Demo mode - API not configured",
                "sources_requested": body.get('sources', ["opensanctions", "sanctions_io", "offshore_leaks"])
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(mock_response).encode('utf-8'))

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
