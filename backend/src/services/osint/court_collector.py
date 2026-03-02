"""Court Record Collector — finds court cases via Serper site-scoped queries."""

import re
from typing import Any, Dict, List, Optional

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

SERPER_URL = "https://google.serper.dev/search"


class CourtRecord:
    def __init__(self, **kwargs):
        self.entity_name: str = kwargs.get("entity_name", "")
        self.case_title: str = kwargs.get("case_title", "")
        self.case_number: Optional[str] = kwargs.get("case_number")
        self.court_name: Optional[str] = kwargs.get("court_name")
        self.jurisdiction: Optional[str] = kwargs.get("jurisdiction")
        self.role: Optional[str] = kwargs.get("role")
        self.date_filed: Optional[str] = kwargs.get("date_filed")
        self.date_decided: Optional[str] = kwargs.get("date_decided")
        self.outcome: Optional[str] = kwargs.get("outcome")
        self.summary: str = kwargs.get("summary", "")
        self.source: str = kwargs.get("source", "serper")
        self.source_url: Optional[str] = kwargs.get("source_url")
        self.severity: str = kwargs.get("severity", "MEDIUM")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_name": self.entity_name,
            "case_title": self.case_title,
            "case_number": self.case_number,
            "court_name": self.court_name,
            "jurisdiction": self.jurisdiction,
            "role": self.role,
            "date_filed": self.date_filed,
            "date_decided": self.date_decided,
            "outcome": self.outcome,
            "summary": self.summary,
            "source": self.source,
            "source_url": self.source_url,
            "severity": self.severity,
        }


class CourtRecordCollector:
    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.SERPER_API_KEY

    async def collect(self, entity_name: str, entity_data: Optional[Dict] = None) -> List[CourtRecord]:
        if not self.api_key:
            return []

        queries = [
            f'"{entity_name}" site:courtlistener.com',
            f'"{entity_name}" site:justia.com',
            f'"{entity_name}" (plaintiff OR defendant) court case',
        ]

        results: List[CourtRecord] = []
        for q in queries:
            try:
                raw = await self._serper_search(q)
                for item in raw.get("organic", []):
                    results.append(CourtRecord(
                        entity_name=entity_name,
                        case_title=item.get("title", ""),
                        court_name=self._extract_court(item),
                        summary=item.get("snippet", ""),
                        source_url=item.get("link", ""),
                        date_filed=self._extract_date(item),
                        source="serper",
                        severity=self._assess_severity(item),
                    ))
            except Exception as e:
                logger.warning("court_collector_query_failed", query=q, error=str(e))

        return self._deduplicate(results)

    async def _serper_search(self, query: str) -> Dict:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                SERPER_URL,
                headers={"X-API-KEY": self.api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 10},
            )
            resp.raise_for_status()
            return resp.json()

    def _extract_court(self, item: Dict) -> Optional[str]:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        text = title + " " + snippet
        # Try to find court names
        patterns = [
            r"(Supreme Court|District Court|Circuit Court|High Court|Court of Appeals?|Tribunal)",
            r"(U\.S\. (?:District|Circuit|Supreme))",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(0)
        return None

    def _extract_date(self, item: Dict) -> Optional[str]:
        return item.get("date")

    def _assess_severity(self, item: Dict) -> str:
        text = (item.get("title", "") + " " + item.get("snippet", "")).lower()
        high_kw = {"criminal", "fraud", "felony", "indicted", "convicted", "money laundering"}
        med_kw = {"lawsuit", "plaintiff", "defendant", "complaint", "violation"}
        if any(kw in text for kw in high_kw):
            return "HIGH"
        if any(kw in text for kw in med_kw):
            return "MEDIUM"
        return "LOW"

    def _deduplicate(self, records: List[CourtRecord]) -> List[CourtRecord]:
        seen: set = set()
        unique: List[CourtRecord] = []
        for r in records:
            key = (r.source_url or r.case_title).lower()
            if key not in seen:
                seen.add(key)
                unique.append(r)
        return unique
