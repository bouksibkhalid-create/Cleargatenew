"""
Local development server for testing Netlify Python functions

This server mimics Netlify's function environment for local testing.
Run with: python3 dev_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import function handlers
from netlify.functions.search import handler as search_handler
from netlify.functions.connections import handler as connections_handler
from netlify.functions.health import handler as health_handler

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def netlify_event_from_flask(flask_request):
    """Convert Flask request to Netlify event format"""
    return {
        'httpMethod': flask_request.method,
        'headers':dict(flask_request.headers),
        'body': flask_request.get_data(as_text=True) if flask_request.data else None,
        'queryStringParameters': dict(flask_request.args),
    }

def flask_response_from_netlify(netlify_response):
    """Convert Netlify response to Flask response"""
    response = jsonify(json.loads(netlify_response['body']))
    response.status_code = netlify_response['statusCode']
    for key, value in netlify_response.get('headers', {}).items():
        response.headers[key] = value
    return response

@app.route('/api/search', methods=['POST', 'OPTIONS'])
def search():
    event = netlify_event_from_flask(request)
    result = search_handler(event, None)
    return flask_response_from_netlify(result)

@app.route('/api/connections', methods=['POST', 'OPTIONS'])
def connections():
    event = netlify_event_from_flask(request)
    result = connections_handler(event, None)
    return flask_response_from_netlify(result)

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    event = netlify_event_from_flask(request)
    result = health_handler(event, None)
    return flask_response_from_netlify(result)

if __name__ == '__main__':
    print("🚀 Local development server starting on http://localhost:8888")
    print("📝 Endpoints:")
    print("   POST http://localhost:8888/api/search")
    print("   POST http://localhost:8888/api/connections")
    print("   GET  http://localhost:8888/api/health")
    print("\n⚡ Hot reload enabled - edit Python files and refresh\n")
    
    app.run(host='0.0.0.0', port=8888, debug=True)
