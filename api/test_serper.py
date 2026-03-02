"""Diagnostic endpoint: minimal Serper API test to debug 403 Forbidden."""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Add backend to path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(root_path, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if root_path not in sys.path:
    sys.path.append(root_path)

try:
    import httpx
except ImportError:
    httpx = None


def mask_key(key: str) -> str:
    """Show first 4 and last 4 chars, mask the rest."""
    if not key:
        return "(empty)"
    if len(key) <= 8:
        return key[:2] + "***" + key[-2:]
    return key[:4] + "***" + key[-4:]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Gather all possible env var names
        env_names = [
            "SERPER_API_KEY",
            "Serp_Api_Key",
            "SERP_API_KEY",
            "serper_api_key",
        ]

        diagnostics = {}
        raw_key = None

        for name in env_names:
            val = os.environ.get(name)
            if val is not None:
                diagnostics[name] = {
                    "found": True,
                    "length": len(val),
                    "masked": mask_key(val),
                    "has_whitespace": val != val.strip(),
                    "has_quotes": val.startswith('"') or val.startswith("'"),
                    "repr": repr(val[:6]) + "..." if len(val) > 6 else repr(val),
                }
                if raw_key is None:
                    raw_key = val.strip().strip("'\"")
            else:
                diagnostics[name] = {"found": False}

        # 2. Also check via Settings
        settings_key = None
        try:
            from src.config.settings import Settings
            s = Settings()
            settings_key = s.SERPER_API_KEY
            diagnostics["settings_object"] = {
                "found": settings_key is not None,
                "length": len(settings_key) if settings_key else 0,
                "masked": mask_key(settings_key) if settings_key else "(None)",
            }
        except Exception as e:
            diagnostics["settings_object"] = {"error": str(e)}

        # Use settings key if available
        test_key = settings_key or raw_key

        # 3. Make a minimal test request to SerpApi
        serper_result = {}
        if httpx and test_key:
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.get(
                        "https://serpapi.com/search",
                        params={
                            "api_key": test_key,
                            "engine": "google",
                            "q": "test",
                            "num": 1,
                        },
                    )
                    serper_result = {
                        "status_code": resp.status_code,
                        "reason": resp.reason_phrase,
                        "response_body": resp.text[:500],
                    }
            except Exception as e:
                serper_result = {"error": str(e)}
        elif not httpx:
            serper_result = {"error": "httpx not available"}
        else:
            serper_result = {"error": "No API key found to test with"}

        # 4. Return diagnostics
        result = {
            "env_vars": diagnostics,
            "serper_test": serper_result,
            "test_key_used_length": len(test_key) if test_key else 0,
            "test_key_used_masked": mask_key(test_key) if test_key else "(None)",
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(json.dumps(result, indent=2).encode("utf-8"))
