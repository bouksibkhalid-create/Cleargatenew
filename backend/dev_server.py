"""
Simple development server for testing backend functions locally.
Runs the search function directly without Netlify.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import sys
import os
import logging
from dotenv import load_dotenv

# Load environment variables BEFORE importing handler
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import the search handler
from netlify.functions.search import handler as search_handler
from netlify.functions.connections import handler as connections_handler

class DevServerHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        # Parse URL and query parameters
        parsed_path = urlparse(self.path)
        
        # Handle search endpoint with GET
        if parsed_path.path == '/api/search':
            # Get query parameters
            params = parse_qs(parsed_path.query)
            query = params.get('q', [''])[0]  # Frontend sends 'q'
            
            if not query:
                self.send_error(400, "Missing query parameter 'q'")
                return
            
            # Create event object for Netlify function (expects 'query')
            event = {
                'httpMethod': 'GET',
                'headers': dict(self.headers),
                'queryStringParameters': {'query': query},  # Map 'q' to 'query'
                'path': self.path
            }
            
            # Call the handler
            try:
                response = handler(event, {})
                
                # Send response
                self.send_response(response['statusCode'])
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response['body'].encode('utf-8'))
            except Exception as e:
                logger.error(f"Search error: {e}", exc_info=True)
                self.send_error(500, f"Search failed: {str(e)}")
        else:
            self.send_error(404, "Endpoint not found")
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/search' or self.path == '/.netlify/functions/search':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            
            # Create event object for Netlify function
            event = {
                'httpMethod': 'POST',
                'headers': dict(self.headers),
                'body': body,
                'path': self.path
            }
            
            # Call the handler
            response = search_handler(event, {})
            
            # Send response
            self.send_response(response['statusCode'])
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response['body'].encode('utf-8'))
        elif self.path == '/api/connections' or self.path == '/.netlify/functions/connections':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            
            # Create event object for Netlify function
            event = {
                'httpMethod': 'POST',
                'headers': dict(self.headers),
                'body': body,
                'path': self.path
            }
            
            # Call the connections handler
            try:
                response = connections_handler(event, {})
                
                # Send response
                self.send_response(response['statusCode'])
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response['body'].encode('utf-8'))
            except Exception as e:
                logger.error(f"Connections error: {e}", exc_info=True)
                self.send_error(500, f"Connections failed: {str(e)}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    port = 8889
    server = HTTPServer(('localhost', port), DevServerHandler)
    print(f"✓ Backend dev server running on http://localhost:{port}")
    print(f"✓ Search endpoint: http://localhost:{port}/api/search")
    print(f"✓ Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
