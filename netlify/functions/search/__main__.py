"""
Netlify Function: Search Handler
Simplified version adapted from backend/netlify/functions/search.py
Endpoint: /.net lify/functions/search
Method: POST
"""

import json
import os
import sys
from typing import Dict, Any

# Add shared modules to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

try:
    from models.requests import SearchRequest
    from models.responses import SearchResponse
    from services.opensanctions_service import OpenSanctionsService
    from services.aggregator import ResultAggregator
    HAS_IMPORTS = True
except ImportError as e:
    HAS_IMPORTS = False
    IMPORT_ERROR = str(e)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Netlify Function handler for multi-source sanctions search.
    """
   
    # CORS Preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }
    
    # Check if imports worked
    if not HAS_IMPORTS:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Import error',
                'details': IMPORT_ERROR,
                'path': sys.path
            })
        }
    
    # Parse Request
    try:
        body_str = event.get('body', '{}')
        body_dict = json.loads(body_str) if body_str else {}
        
        search_request = SearchRequest(**body_dict)
        
    except json.JSONDecodeError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON', 'details': str(e)})
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request', 'details': str(e)})
        }
    
    # For now, return a simple response to test the function works
    # TODO: Implement full search logic once basic deployment works
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'query': search_request.query,
            'search_type': search_request.search_type,
            'sources': search_request.sources,
            'message': '🎉 Python function is working! Full search coming next.',
            'total_results': 0,
            'results_by_source': {}
        })
    }
