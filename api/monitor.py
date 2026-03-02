"""Monitor API — /api/monitor
Handles add, remove, and status operations for entity monitoring.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from supabase import create_client


def _get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
    return create_client(url, key)


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, body: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length)) if content_length else {}

            path = self.path.rstrip("/")
            db = _get_supabase()

            if path.endswith("/add"):
                return self._add_monitor(db, body)
            elif path.endswith("/remove"):
                return self._remove_monitor(db, body)
            elif path.endswith("/status"):
                return self._check_status(db, body)
            else:
                self._send_json(404, {"error": "Unknown endpoint"})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_GET(self):
        try:
            db = _get_supabase()
            path = self.path.rstrip("/")

            if path.endswith("/list"):
                resp = db.table("monitored_entities") \
                    .select("*") \
                    .eq("is_active", True) \
                    .order("created_at", desc=True) \
                    .execute()
                self._send_json(200, {"monitored": resp.data or []})
            else:
                # Check status via query param
                from urllib.parse import urlparse, parse_qs
                params = parse_qs(urlparse(self.path).query)
                entity_name = params.get("entity_name", [None])[0]
                if entity_name:
                    resp = db.table("monitored_entities") \
                        .select("*") \
                        .eq("entity_name", entity_name) \
                        .eq("is_active", True) \
                        .execute()
                    is_monitored = bool(resp.data)
                    self._send_json(200, {"is_monitored": is_monitored, "data": resp.data[0] if resp.data else None})
                else:
                    self._send_json(400, {"error": "entity_name query param required"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _add_monitor(self, db, body: dict):
        entity_name = body.get("entity_name", "").strip()
        if not entity_name:
            return self._send_json(400, {"error": "entity_name required"})

        from datetime import datetime, timedelta
        now = datetime.utcnow().isoformat()
        next_check = (datetime.utcnow() + timedelta(days=1)).isoformat()

        db.table("monitored_entities").upsert({
            "entity_name": entity_name,
            "entity_data": body.get("entity_data"),
            "is_active": True,
            "last_checked_at": now,
            "next_check_at": next_check,
        }, on_conflict="entity_name").execute()

        self._send_json(200, {"status": "monitoring_enabled", "entity_name": entity_name})

    def _remove_monitor(self, db, body: dict):
        entity_name = body.get("entity_name", "").strip()
        if not entity_name:
            return self._send_json(400, {"error": "entity_name required"})

        db.table("monitored_entities") \
            .update({"is_active": False}) \
            .eq("entity_name", entity_name) \
            .execute()

        self._send_json(200, {"status": "monitoring_disabled", "entity_name": entity_name})

    def _check_status(self, db, body: dict):
        entity_name = body.get("entity_name", "").strip()
        if not entity_name:
            return self._send_json(400, {"error": "entity_name required"})

        resp = db.table("monitored_entities") \
            .select("*") \
            .eq("entity_name", entity_name) \
            .eq("is_active", True) \
            .execute()

        is_monitored = bool(resp.data)
        self._send_json(200, {
            "is_monitored": is_monitored,
            "data": resp.data[0] if resp.data else None,
        })
