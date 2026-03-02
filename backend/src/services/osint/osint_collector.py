"""OSINT Collector Service — orchestrates all collectors in parallel, stores to Supabase."""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

CACHE_TTL_DAYS = 90


class OSINTReport:
    """Aggregated results from all OSINT collectors."""

    def __init__(self, entity_name: str = ""):
        self.entity_name = entity_name
        self.corporate: List[Dict] = []
        self.court_records: List[Dict] = []
        self.gov_filings: List[Dict] = []
        self.social_profiles: List[Dict] = []
        self.succeeded: List[str] = []
        self.failed: List[str] = []
        self.total_findings: int = 0
        self.flagged_findings: int = 0
        self.from_cache: bool = False

    def add(self, name: str, results: list):
        dicts = [r.to_dict() if hasattr(r, "to_dict") else r for r in results]
        if name == "corporate":
            self.corporate = dicts
        elif name == "court":
            self.court_records = dicts
        elif name == "gov_filings":
            self.gov_filings = dicts
        elif name == "social":
            self.social_profiles = dicts
        self.total_findings += len(dicts)


class OSINTCollectorService:
    """Orchestrates all OSINT collectors in parallel."""

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.settings = settings
        self._supabase = None

    def _get_supabase(self):
        if self._supabase is None:
            from src.services.supabase_client import get_supabase_client
            self._supabase = get_supabase_client()
        return self._supabase

    async def collect_all(self, entity_name: str, entity_data: Optional[Dict] = None) -> OSINTReport:
        """Run all collectors in parallel, store results, return report."""
        entity_data = entity_data or {}
        report = OSINTReport(entity_name=entity_name)

        # Check cache
        cached = await self._check_cache(entity_name)
        if cached:
            logger.info("osint_cache_hit", entity=entity_name, age_days=cached.get("age_days", 0))
            report.from_cache = True
            report.corporate = cached.get("corporate", [])
            report.court_records = cached.get("court_records", [])
            report.gov_filings = cached.get("gov_filings", [])
            report.social_profiles = cached.get("social_profiles", [])
            report.total_findings = (
                len(report.corporate) + len(report.court_records)
                + len(report.gov_filings) + len(report.social_profiles)
            )
            return report

        # Lazy import collectors to avoid circular imports
        from src.services.osint.corporate_collector import CorporateCollector
        from src.services.osint.court_collector import CourtRecordCollector
        from src.services.osint.gov_filing_collector import GovFilingCollector
        from src.services.osint.social_collector import SocialProfileCollector

        collectors = {
            "corporate": CorporateCollector(self.settings),
            "court": CourtRecordCollector(self.settings),
            "gov_filings": GovFilingCollector(self.settings),
            "social": SocialProfileCollector(self.settings),
        }

        # Create collection log
        log_id = await self._create_log(entity_name)

        # Run all in parallel
        tasks = {
            name: collector.collect(entity_name, entity_data)
            for name, collector in collectors.items()
        }

        raw_results = await asyncio.gather(
            *tasks.values(), return_exceptions=True
        )

        for name, result in zip(tasks.keys(), raw_results):
            if isinstance(result, Exception):
                report.failed.append(name)
                logger.warning("osint_collector_failed", collector=name, error=str(result))
            else:
                report.succeeded.append(name)
                report.add(name, result)
                await self._store(name, entity_name, result)

        # Update log
        await self._update_log(log_id, report)

        return report

    # ------------------------------------------------------------------
    # Cache
    # ------------------------------------------------------------------

    async def _check_cache(self, entity_name: str) -> Optional[Dict]:
        """Check if recent OSINT data exists for this entity."""
        try:
            db = self._get_supabase()
            resp = db.table("osint_collection_log") \
                .select("*") \
                .eq("entity_name", entity_name) \
                .eq("status", "completed") \
                .order("completed_at", desc=True) \
                .limit(1) \
                .execute()

            rows = resp.data or []
            if not rows:
                return None

            completed = rows[0].get("completed_at")
            if not completed:
                return None

            completed_dt = datetime.fromisoformat(completed.replace("Z", "+00:00").replace("+00:00", ""))
            age_days = (datetime.utcnow() - completed_dt).days
            if age_days >= CACHE_TTL_DAYS:
                return None

            # Fetch cached data from individual tables
            corporate = db.table("osint_corporate").select("*").eq("entity_name", entity_name).execute()
            court = db.table("osint_court_records").select("*").eq("entity_name", entity_name).execute()
            gov = db.table("osint_gov_filings").select("*").eq("entity_name", entity_name).execute()
            social = db.table("osint_social_profiles").select("*").eq("entity_name", entity_name).execute()

            return {
                "age_days": age_days,
                "corporate": corporate.data or [],
                "court_records": court.data or [],
                "gov_filings": gov.data or [],
                "social_profiles": social.data or [],
            }
        except Exception as e:
            logger.warning("osint_cache_check_failed", error=str(e))
            return None

    # ------------------------------------------------------------------
    # Storage
    # ------------------------------------------------------------------

    async def _create_log(self, entity_name: str) -> Optional[str]:
        try:
            db = self._get_supabase()
            resp = db.table("osint_collection_log").insert({
                "entity_name": entity_name,
                "status": "running",
            }).execute()
            rows = resp.data or []
            return rows[0]["id"] if rows else None
        except Exception as e:
            logger.warning("osint_create_log_failed", error=str(e))
            return None

    async def _update_log(self, log_id: Optional[str], report: OSINTReport):
        if not log_id:
            return
        try:
            db = self._get_supabase()
            db.table("osint_collection_log").update({
                "completed_at": datetime.utcnow().isoformat(),
                "sources_succeeded": report.succeeded,
                "sources_failed": report.failed,
                "total_findings": report.total_findings,
                "flagged_findings": report.flagged_findings,
                "status": "completed",
            }).eq("id", log_id).execute()
        except Exception as e:
            logger.warning("osint_update_log_failed", error=str(e))

    async def _store(self, collector_name: str, entity_name: str, results: list):
        """Store collector results into their respective Supabase tables."""
        if not results:
            return

        table_map = {
            "corporate": "osint_corporate",
            "court": "osint_court_records",
            "gov_filings": "osint_gov_filings",
            "social": "osint_social_profiles",
        }
        table = table_map.get(collector_name)
        if not table:
            return

        try:
            db = self._get_supabase()
            rows = [r.to_dict() if hasattr(r, "to_dict") else r for r in results]
            # Remove None values and raw_data for storage
            clean_rows = []
            for row in rows:
                clean = {k: v for k, v in row.items() if v is not None}
                if "raw_data" in clean and isinstance(clean["raw_data"], dict):
                    import json
                    clean["raw_data"] = json.dumps(clean["raw_data"])
                clean_rows.append(clean)

            if clean_rows:
                db.table(table).upsert(clean_rows, on_conflict="entity_name,company_name,source" if table == "osint_corporate" else "").execute()
                logger.info("osint_stored", table=table, entity=entity_name, count=len(clean_rows))
        except Exception as e:
            logger.warning("osint_store_failed", table=table, error=str(e))
