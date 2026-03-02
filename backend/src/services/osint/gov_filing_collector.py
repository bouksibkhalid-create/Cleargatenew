"""Government Filing Collector — finds regulatory filings via Serper site-scoped queries."""

from typing import Any, Dict, List, Optional

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

SERPER_URL = "https://google.serper.dev/search"


class GovFiling:
    def __init__(self, **kwargs):
        self.entity_name: str = kwargs.get("entity_name", "")
        self.filing_type: Optional[str] = kwargs.get("filing_type")
        self.filing_title: str = kwargs.get("filing_title", "")
        self.filing_date: Optional[str] = kwargs.get("filing_date")
        self.regulator: Optional[str] = kwargs.get("regulator")
        self.document_url: Optional[str] = kwargs.get("document_url")
        self.summary: str = kwargs.get("summary", "")
        self.is_adverse: bool = kwargs.get("is_adverse", False)
        self.source: str = kwargs.get("source", "serper")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_name": self.entity_name,
            "filing_type": self.filing_type,
            "filing_title": self.filing_title,
            "filing_date": self.filing_date,
            "regulator": self.regulator,
            "document_url": self.document_url,
            "summary": self.summary,
            "is_adverse": self.is_adverse,
            "source": self.source,
        }


class GovFilingCollector:
    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.SERPER_API_KEY

    async def collect(self, entity_name: str, entity_data: Optional[Dict] = None) -> List[GovFiling]:
        if not self.api_key:
            return []

        queries = [
            (f'"{entity_name}" site:sec.gov', "SEC"),
            (f'"{entity_name}" (regulatory OR enforcement OR fine OR penalty) site:gov', "Government"),
            (f'"{entity_name}" (disclosure OR filing) site:europa.eu', "EU Regulator"),
        ]

        results: List[GovFiling] = []
        for q, regulator in queries:
            try:
                raw = await self._serper_search(q)
                for item in raw.get("organic", []):
                    text = (item.get("title", "") + " " + item.get("snippet", "")).lower()
                    adverse_kw = {"enforcement", "fine", "penalty", "violation", "sanction", "cease", "desist", "fraud"}
                    is_adverse = any(kw in text for kw in adverse_kw)

                    results.append(GovFiling(
                        entity_name=entity_name,
                        filing_type=self._detect_type(item),
                        filing_title=item.get("title", ""),
                        filing_date=item.get("date"),
                        regulator=regulator,
                        document_url=item.get("link", ""),
                        summary=item.get("snippet", ""),
                        is_adverse=is_adverse,
                        source="serper",
                    ))
            except Exception as e:
                logger.warning("gov_filing_query_failed", query=q, error=str(e))

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

    def _detect_type(self, item: Dict) -> str:
        text = (item.get("title", "") + " " + item.get("snippet", "")).lower()
        if "10-k" in text or "annual report" in text:
            return "Annual Filing"
        if "10-q" in text or "quarterly" in text:
            return "Quarterly Filing"
        if "enforcement" in text or "action" in text:
            return "Enforcement Action"
        if "proxy" in text or "def 14a" in text:
            return "Proxy Statement"
        return "Regulatory Filing"

    def _deduplicate(self, records: List[GovFiling]) -> List[GovFiling]:
        seen: set = set()
        unique: List[GovFiling] = []
        for r in records:
            key = (r.document_url or r.filing_title).lower()
            if key not in seen:
                seen.add(key)
                unique.append(r)
        return unique
