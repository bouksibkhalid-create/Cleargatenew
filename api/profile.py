"""POST /api/profile — Generate a complete entity intelligence profile."""

import json
import asyncio
import os
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler

# Add backend to path (same as existing endpoints)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from src.config.settings import Settings
from src.services.entity_profile_orchestrator import EntityProfileOrchestrator
from src.models.entity_profile import EntityProfileRequest


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            # Parse request
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8')
            body = json.loads(body_str) if body_str else {}

            # Validate
            request = EntityProfileRequest(**body)

            # Execute pipeline
            settings = Settings()
            orchestrator = EntityProfileOrchestrator(settings)

            # Run async pipeline
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                profile = loop.run_until_complete(
                    orchestrator.generate_profile(request)
                )
            finally:
                loop.close()

            # Return response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(
                json.dumps(profile.dict(), default=str).encode('utf-8')
            )

        except (ValueError, TypeError) as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "ValidationError",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode('utf-8'))

        except Exception as e:
            import traceback
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InternalError",
                "message": str(e),
                "traceback": traceback.format_exc(),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode('utf-8'))
