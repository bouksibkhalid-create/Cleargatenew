"""
Netlify Function: Connections Handler  
Endpoint: /.netlify/functions/connections
Method: POST
"""

import json
import os
import sys
from typing import Dict, Any

# Add shared modules to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

from dotenv import load_dotenv
load_dotenv()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Netlify Function handler for graph connections.
    """
    
    # CORS Preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }
    
    # Parse Request
    try:
        body_str = event.get('body', '{}')
        body_dict = json.loads(body_str) if body_str else {}
        
        node_id = body_dict.get('node_id')
        depth = body_dict.get('depth', 2)
        max_nodes = body_dict.get('max_nodes', 50)
        
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request', 'details': str(e)})
        }
    
    # For now, return a simple response
    # TODO: Implement Neo4j graph query once basic deployment works
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'node_id': node_id,
            'depth': depth,
            'message': '🎉 Connections function is working!',
            'nodes': [],
            'edges': []
        })
    }
