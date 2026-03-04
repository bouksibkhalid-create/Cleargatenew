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
import uuid
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

                entity_type = body.get("entity_type", "individual")

                try:
                    from src.config.settings import Settings
                    from src.services.entity_profile_orchestrator import EntityProfileOrchestrator
                    from src.models.entity_profile import EntityProfileRequest

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

                except Exception as pipeline_err:
                    # Orchestrator failed — build a minimal valid profile
                    # so the PDF can still be generated with basic info
                    print(f"[REPORT] Orchestrator failed: {pipeline_err}")
                    print(f"[REPORT] Falling back to minimal profile for: {query}")

                    # Try to get sanctions data from Supabase directly
                    sanctions_results = []
                    is_sanctioned = False
                    sanctions_lists = []
                    try:
                        from supabase import create_client
                        supabase_url = os.getenv('SUPABASE_URL')
                        supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                        if supabase_url and supabase_key:
                            sb = create_client(supabase_url, supabase_key)
                            resp = sb.rpc('search_sanctions', {
                                'search_query': query,
                                'similarity_threshold': 0.5,
                                'result_limit': 10,
                            }).execute()
                            for r in (resp.data or []):
                                sanctions_results.append(r)
                                is_sanctioned = True
                                sanctions_lists.extend(r.get('programs', []))
                    except Exception:
                        pass

                    check_id = str(uuid.uuid4())
                    profile_data = {
                        "entity": {
                            "name": query,
                            "entity_type": entity_type,
                            "country": None,
                            "aliases": [],
                        },
                        "risk_score": 75 if is_sanctioned else 0,
                        "risk_level": "high" if is_sanctioned else "low",
                        "risk_color": "#EF4444" if is_sanctioned else "#10B981",
                        "risk_factors": ["Sanctioned entity" if is_sanctioned else "No sanctions found"],
                        "score_breakdown": {},
                        "sanctions_hits": len(sanctions_results),
                        "pep_hits": 0,
                        "adverse_news_count": 0,
                        "offshore_connections_count": 0,
                        "sanctions_results": sanctions_results,
                        "sanctions_lists_matched": list(set(sanctions_lists)),
                        "is_sanctioned": is_sanctioned,
                        "is_pep": False,
                        "sources": [],
                        "adverse_media_hits": [],
                        "offshore_results": [],
                        "dorking_results": [],
                        "osint_corporate": [],
                        "osint_court_records": [],
                        "osint_gov_filings": [],
                        "osint_social_profiles": [],
                        "check_id": check_id,
                        "check_status": "partial",
                        "check_created_at": datetime.utcnow().isoformat() + "Z",
                        "check_duration_ms": 0,
                        "sources_succeeded": [],
                        "sources_failed": ["pipeline"],
                    }

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
