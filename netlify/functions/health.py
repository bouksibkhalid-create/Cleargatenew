import os
import sys

# Add the backend directory to sys.path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_path not in sys.path:
    sys.path.insert(0, root_path)
import json
import asyncio
from datetime import datetime
from src.utils.neo4j_client import get_neo4j_client
from src.utils.logger import get_logger

logger = get_logger(__name__)

async def check_neo4j_health() -> dict:
    """Check Neo4j database health"""
    try:
        client = get_neo4j_client()
        await client.connect()
        
        # Simple connectivity test
        records = await client.execute_read("RETURN 1 as test")
        
        if records and records[0].get("test") == 1:
            return {"status": "healthy", "message": "Connected"}
        else:
            return {"status": "unhealthy", "message": "Invalid response"}
            
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return {"status": "unhealthy", "message": str(e)}

def handler(event, context):
    """
    Health check endpoint
    
    Returns system health status
    """
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {}
    }
    
    # Check Neo4j
    try:
        neo4j_health = asyncio.run(check_neo4j_health())
        health_status["services"]["neo4j"] = neo4j_health
        
        if neo4j_health["status"] != "healthy":
            health_status["status"] = "degraded"
            
    except Exception as e:
        health_status["services"]["neo4j"] = {
            "status": "unhealthy",
            "message": str(e)
        }
        health_status["status"] = "degraded"
    
    # Overall status
    status_code = 200 if health_status["status"] == "healthy" else 503
    
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        },
        "body": json.dumps(health_status)
    }
