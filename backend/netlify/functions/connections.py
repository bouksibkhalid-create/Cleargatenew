"""Netlify Function for graph connections endpoint"""

import json
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables
load_dotenv()

from src.services.graph_service import GraphService
from src.services.offshore_service import OffshoreLeaksService
from src.models.graph_models import ConnectionRequest, ConnectionResponse
from src.utils.logger import get_logger
from src.utils.errors import APIError
from src.utils.decorators import cached, rate_limit
from pydantic import ValidationError

logger = get_logger(__name__)


async def get_connections(request: ConnectionRequest) -> ConnectionResponse:
    """
    Get graph connections for a node
    
    Args:
        request: Validated connection request
        
    Returns:
        Connection response with graph data
    """
    graph_service = GraphService()
    offshore_service = OffshoreLeaksService()
    
    # Get node details
    node = await offshore_service.get_by_id(request.node_id)
    
    if not node:
        raise APIError(f"Node with ID {request.node_id} not found", status_code=404)
    
    # Get connections graph
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


@rate_limit
@cached(ttl_seconds=3600)  # 1 hour cache for graph structure
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Netlify Function handler for connections endpoint
    
    Args:
        event: Lambda event object
        context: Lambda context object
        
    Returns:
        HTTP response dict
    """
    # CORS headers
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    # Handle OPTIONS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    try:
        # Parse request
        body = json.loads(event.get("body", "{}"))
        request = ConnectionRequest(**body)
        
        logger.info(
            "connections_request_received",
            node_id=request.node_id,
            depth=request.depth,
            max_nodes=request.max_nodes
        )
        
        # Get connections
        response = asyncio.run(get_connections(request))
        
        logger.info(
            "connections_request_success",
            node_id=request.node_id,
            node_count=response.graph.node_count,
            edge_count=response.graph.edge_count
        )
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": response.model_dump_json()
        }
        
    except ValidationError as e:
        logger.warning(
            "connections_validation_error",
            errors=e.errors()
        )
        
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({
                "error": "ValidationError",
                "message": "Invalid request parameters",
                "details": e.errors()
            })
        }
        
    except APIError as e:
        logger.error(
            "connections_api_error",
            error=str(e),
            status_code=getattr(e, 'status_code', 500)
        )
        
        return {
            "statusCode": getattr(e, 'status_code', 500),
            "headers": headers,
            "body": json.dumps({
                "error": "APIError",
                "message": str(e)
            })
        }
        
    except Exception as e:
        logger.error(
            "connections_unexpected_error",
            error=str(e),
            error_type=type(e).__name__
        )
        
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "error": "InternalError",
                "message": "An unexpected error occurred"
            })
        }
