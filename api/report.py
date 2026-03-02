"""POST /api/report — Generate a PDF intelligence report for an entity.

Accepts either:
  1. A full profile object in the request body (pre-fetched from M5)
  2. A query + entity_type to fetch the profile first, then generate the report

Returns: application/pdf binary.
"""

import json
import asyncio
import os
import sys
import traceback
from datetime import datetime
from http.server import BaseHTTPRequestHandler

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from src.services.report.report_generator import generate_pdf


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

            language = body.get("language", "fr")
            client_name = body.get("client_name", "")
            classification = body.get("classification", "CONFIDENTIEL")

            # Option A: Full profile provided in body
            profile_data = body.get("profile")

            if not profile_data:
                # Option B: Fetch profile via M5 pipeline
                query = body.get("query", "").strip()
                if not query:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "error": "ValidationError",
                        "message": "Either 'profile' or 'query' must be provided.",
                    }).encode('utf-8'))
                    return

                from src.config.settings import Settings
                from src.services.entity_profile_orchestrator import EntityProfileOrchestrator
                from src.models.entity_profile import EntityProfileRequest

                entity_type = body.get("entity_type", "individual")
                request = EntityProfileRequest(
                    name=query,
                    entity_type=entity_type,
                    include_ai_analysis=True,
                    include_adverse_media=True,
                )

                settings = Settings()
                orchestrator = EntityProfileOrchestrator(settings)

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    profile_obj = loop.run_until_complete(
                        orchestrator.generate_profile(request)
                    )
                finally:
                    loop.close()

                profile_data = profile_obj.dict() if hasattr(profile_obj, 'dict') else profile_obj.model_dump()

            # Generate PDF
            pdf_bytes = generate_pdf(
                profile=profile_data,
                language=language,
                client_name=client_name,
                classification=classification,
            )

            # Build filename
            entity_name = profile_data.get("entity", {}).get("name", "Entity") if isinstance(profile_data, dict) else "Entity"
            safe_name = entity_name.replace(" ", "_").replace("/", "_")[:40]
            date_str = datetime.utcnow().strftime("%Y-%m-%d")
            filename = f"ClearGate_Report_{safe_name}_{date_str}.pdf"

            # Return PDF
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Expose-Headers', 'Content-Disposition')
            self.end_headers()
            self.wfile.write(pdf_bytes)

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
