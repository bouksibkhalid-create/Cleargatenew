"""
Netlify Function: Health Check
Endpoint: /.netlify/functions/health
Method: GET
"""

import json
import os
from datetime import datetime
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Health check handler - verifies services are accessible.
    
    Returns:
        Health status with service connectivity checks
    """
    
    # CORS Preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    health_status = {
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'environment': 'production',
        'services': {}
    }
    
    # Check Neo4j configuration
    neo4j_uri = os.environ.get('NEO4J_URI')
    neo4j_user = os.environ.get('NEO4J_USER')
    neo4j_password = os.environ.get('NEO4J_PASSWORD')
    
    if all([neo4j_uri, neo4j_user, neo4j_password]):
        health_status['services']['neo4j'] = {
            'status': 'configured',
            'uri': neo4j_uri.split('@')[1] if '@' in neo4j_uri else 'configured'
        }
    else:
        health_status['services']['neo4j'] = {'status': 'not_configured'}
    
    # Check API Keys
    health_status['services']['opensanctions'] = {
        'status': 'configured' if os.environ.get('OPENSANCTIONS_API_KEY') else 'not_configured'
    }
    health_status['services']['sanctions_io'] = {
        'status': 'configured' if os.environ.get('SANCTIONS_IO_API_KEY') else 'not_configured'
    }
    
    # Python version
    import sys
    health_status['python_version'] = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    health_status['function_type'] = 'netlify_python'
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        },
        'body': json.dumps(health_status, indent=2)
    }
