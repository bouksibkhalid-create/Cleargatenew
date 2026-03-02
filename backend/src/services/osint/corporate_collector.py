"""Corporate Collector — queries OpenCorporates API for company roles and registrations."""

import asyncio
from typing import Any, Dict, List, Optional

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

OPENCORP_BASE = "https://api.opencorporates.com/v0.4"


class CorporateRecord:
    def __init__(self, **kwargs):
        self.entity_name: str = kwargs.get("entity_name", "")
        self.company_name: str = kwargs.get("company_name", "")
        self.role: str = kwargs.get("role", "")
        self.jurisdiction: str = kwargs.get("jurisdiction", "")
        self.registration_number: str = kwargs.get("registration_number", "")
        self.registration_date: Optional[str] = kwargs.get("registration_date")
        self.status: str = kwargs.get("status", "unknown")
        self.paid_up_capital: Optional[str] = kwargs.get("paid_up_capital")
        self.source: str = kwargs.get("source", "opencorporates")
        self.source_url: Optional[str] = kwargs.get("source_url")
        self.raw_data: Optional[Dict] = kwargs.get("raw_data")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_name": self.entity_name,
            "company_name": self.company_name,
            "role": self.role,
            "jurisdiction": self.jurisdiction,
            "registration_number": self.registration_number,
            "registration_date": self.registration_date,
            "status": self.status,
            "paid_up_capital": self.paid_up_capital,
            "source": self.source,
            "source_url": self.source_url,
            "raw_data": self.raw_data,
        }


class CorporateCollector:
    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.OPENCORPORATES_API_KEY

    async def collect(self, entity_name: str, entity_data: Optional[Dict] = None) -> List[CorporateRecord]:
        entity_data = entity_data or {}
        results: List[CorporateRecord] = []

        try:
            # Search as officer (person → company roles)
            officers = await self._search_officers(entity_name)
            for officer in officers:
                company = officer.get("company", {})
                results.append(CorporateRecord(
                    entity_name=entity_name,
                    company_name=company.get("name", "Unknown"),
                    role=officer.get("position", "officer"),
                    jurisdiction=company.get("jurisdiction_code", ""),
                    registration_number=company.get("company_number", ""),
                    status=company.get("current_status", "unknown"),
                    source="opencorporates",
                    source_url=officer.get("opencorporates_url", ""),
                    raw_data=officer,
                ))

            # Search as company (if entity is an organization)
            if entity_data.get("entity_type") == "organization":
                companies = await self._search_companies(entity_name)
                for company in companies:
                    results.append(CorporateRecord(
                        entity_name=entity_name,
                        company_name=company.get("name", "Unknown"),
                        role="subject_entity",
                        jurisdiction=company.get("jurisdiction_code", ""),
                        registration_number=company.get("company_number", ""),
                        registration_date=company.get("incorporation_date"),
                        status=company.get("current_status", "unknown"),
                        paid_up_capital=str(company.get("share_capital")) if company.get("share_capital") else None,
                        source="opencorporates",
                        source_url=company.get("opencorporates_url", ""),
                        raw_data=company,
                    ))

        except Exception as e:
            logger.warning("corporate_collector_failed", entity=entity_name, error=str(e))

        return results

    async def _search_officers(self, name: str) -> List[Dict]:
        params = {"q": name, "per_page": 10}
        if self.api_key:
            params["api_token"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"{OPENCORP_BASE}/officers/search", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    officers_wrapper = data.get("results", {}).get("officers", [])
                    return [o.get("officer", o) for o in officers_wrapper]
        except Exception as e:
            logger.warning("opencorporates_officers_search_failed", error=str(e))
        return []

    async def _search_companies(self, name: str) -> List[Dict]:
        params = {"q": name, "per_page": 10}
        if self.api_key:
            params["api_token"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"{OPENCORP_BASE}/companies/search", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    companies_wrapper = data.get("results", {}).get("companies", [])
                    return [c.get("company", c) for c in companies_wrapper]
        except Exception as e:
            logger.warning("opencorporates_companies_search_failed", error=str(e))
        return []
