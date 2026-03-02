"""Social Profile Collector — finds social media profiles via Serper site-scoped queries."""

from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

SERPER_URL = "https://google.serper.dev/search"

PLATFORM_SITES = {
    "linkedin": "site:linkedin.com/in",
    "twitter": "site:twitter.com OR site:x.com",
    "crunchbase": "site:crunchbase.com/person",
}


class SocialProfile:
    def __init__(self, **kwargs):
        self.entity_name: str = kwargs.get("entity_name", "")
        self.platform: str = kwargs.get("platform", "")
        self.profile_url: Optional[str] = kwargs.get("profile_url")
        self.display_name: str = kwargs.get("display_name", "")
        self.bio: str = kwargs.get("bio", "")
        self.followers_count: Optional[int] = kwargs.get("followers_count")
        self.is_verified: bool = kwargs.get("is_verified", False)
        self.source: str = kwargs.get("source", "serper")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_name": self.entity_name,
            "platform": self.platform,
            "profile_url": self.profile_url,
            "display_name": self.display_name,
            "bio": self.bio,
            "followers_count": self.followers_count,
            "is_verified": self.is_verified,
            "source": self.source,
        }


class SocialProfileCollector:
    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.SERPER_API_KEY

    async def collect(self, entity_name: str, entity_data: Optional[Dict] = None) -> List[SocialProfile]:
        if not self.api_key:
            return []

        results: List[SocialProfile] = []
        for platform, site_query in PLATFORM_SITES.items():
            try:
                query = f'"{entity_name}" {site_query}'
                raw = await self._serper_search(query)
                for item in raw.get("organic", []):
                    link = item.get("link", "")
                    if not link:
                        continue
                    results.append(SocialProfile(
                        entity_name=entity_name,
                        platform=platform,
                        profile_url=link,
                        display_name=item.get("title", ""),
                        bio=item.get("snippet", ""),
                        source="serper",
                    ))
            except Exception as e:
                logger.warning("social_collector_query_failed", platform=platform, error=str(e))

        return self._deduplicate(results)

    async def _serper_search(self, query: str) -> Dict:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                SERPER_URL,
                headers={"X-API-KEY": self.api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 5},
            )
            resp.raise_for_status()
            return resp.json()

    def _deduplicate(self, profiles: List[SocialProfile]) -> List[SocialProfile]:
        seen: set = set()
        unique: List[SocialProfile] = []
        for p in profiles:
            key = (p.platform, (p.profile_url or "").lower())
            if key not in seen:
                seen.add(key)
                unique.append(p)
        return unique
