from http.server import BaseHTTPRequestHandler
import json
import asyncio
import os
import sys
from datetime import datetime

# Add the backend directory to sys.path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(root_path, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if root_path not in sys.path:
    sys.path.append(root_path)

try:
    from src.utils.neo4j_client import get_neo4j_client
    from src.utils.logger import get_logger
except ImportError:
    pass

logger = get_logger(__name__)

async def check_neo4j_health() -> dict:
    try:
        client = get_neo4j_client()
        await client.connect()
        records = await client.execute_read("RETURN 1 as test")
        if records and records[0].get("test") == 1:
            return {"status": "healthy", "message": "Connected"}
        else:
            return {"status": "unhealthy", "message": "Invalid response"}
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return {"status": "unhealthy", "message": str(e)}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "services": {}
        }
        
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
        
        status_code = 200 if health_status["status"] == "healthy" else 503
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json.dumps(health_status).encode('utf-8'))
