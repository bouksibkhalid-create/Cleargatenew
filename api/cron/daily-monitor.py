"""Daily Monitoring Cron Job — /api/cron/daily-monitor
Triggered by Vercel Cron: schedule "0 6 * * *" (6 AM UTC daily)

Re-scans all active monitored entities via dorking + OSINT.
New findings become timeline events visible in the entity profile.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from supabase import create_client


def _get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
    return create_client(url, key)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Vercel cron calls GET on schedule."""
        try:
            db = _get_supabase()

            # Fetch all active monitored entities
            resp = db.table("monitored_entities") \
                .select("*") \
                .eq("is_active", True) \
                .execute()

            monitored = resp.data or []
            if not monitored:
                return self._send_json(200, {"message": "No monitored entities", "processed": 0})

            processed = 0
            total_new = 0

            for entity in monitored:
                entity_name = entity["entity_name"]
                entity_data = entity.get("entity_data") or {}

                try:
                    new_findings = []

                    # Re-run dorking (diff mode — only returns new URLs)
                    try:
                        from backend.src.services.dorking_service import DorkingService
                        from backend.src.config.settings import Settings
                        settings = Settings()
                        dorking = DorkingService(settings)

                        import asyncio
                        loop = asyncio.new_event_loop()
                        dorking_report = loop.run_until_complete(
                            dorking.execute(entity_name, entity_data)
                        )
                        for r in dorking_report.new_results:
                            new_findings.append({
                                "category": f"dorking:{r.category}",
                                "title": r.title,
                                "summary": r.snippet,
                                "source": r.domain,
                                "url": r.url,
                                "severity": "MEDIUM" if r.is_flagged else "LOW",
                            })
                    except Exception:
                        pass

                    # Re-run OSINT collectors
                    try:
                        from backend.src.services.osint.osint_collector import OSINTCollectorService
                        osint = OSINTCollectorService(settings)

                        osint_report = loop.run_until_complete(
                            osint.collect_all(entity_name, entity_data)
                        )
                        # Count new corporate findings
                        for corp in osint_report.corporate:
                            if corp.get("created_at", "")[:10] == datetime.utcnow().strftime("%Y-%m-%d"):
                                new_findings.append({
                                    "category": "corporate",
                                    "title": f"New corporate record: {corp.get('company_name', '')}",
                                    "summary": f"Role: {corp.get('role', 'unknown')} in {corp.get('jurisdiction', '')}",
                                    "source": "OpenCorporates",
                                    "url": corp.get("source_url", ""),
                                    "severity": "LOW",
                                })
                    except Exception:
                        pass

                    # Write timeline events for new findings
                    for finding in new_findings:
                        db.table("entity_timeline_events").insert({
                            "entity_name": entity_name,
                            "event_type": "monitoring_update",
                            "event_date": datetime.utcnow().isoformat(),
                            "category": finding["category"],
                            "title": finding["title"],
                            "description": finding.get("summary", ""),
                            "source": finding.get("source", ""),
                            "source_url": finding.get("url", ""),
                            "severity": finding.get("severity", "LOW"),
                            "is_new": True,
                        }).execute()

                    # Update monitoring log
                    db.table("monitored_entities").update({
                        "last_checked_at": datetime.utcnow().isoformat(),
                        "next_check_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                        "total_updates_found": entity.get("total_updates_found", 0) + len(new_findings),
                    }).eq("entity_name", entity_name).execute()

                    processed += 1
                    total_new += len(new_findings)

                except Exception:
                    continue

            self._send_json(200, {
                "message": "Monitoring complete",
                "processed": processed,
                "total_entities": len(monitored),
                "new_findings": total_new,
            })

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status: int, body: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
