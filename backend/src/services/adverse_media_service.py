"""Adverse Media Service — M2: Collects and processes adverse media hits for entities.

Uses Serper.dev (default) or Google Custom Search to find compliance-relevant
news articles, then deduplicates, classifies severity, and returns structured results.
"""

import asyncio
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urlunparse

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from rapidfuzz import fuzz

from src.config.settings import Settings
from src.models.adverse_media import (
    AdverseMediaRequest,
    AdverseMediaHit,
    AdverseMediaResponse,
)
from src.utils.logger import get_logger
from src.utils.errors import APIError, APITimeoutError
from src.utils.circuit_breaker import adverse_media_breaker, CircuitBreakerError

logger = get_logger(__name__)

# Retry configuration from environment
MAX_RETRIES = int(os.getenv("API_MAX_RETRIES", "3"))
RETRY_MIN_WAIT = float(os.getenv("API_RETRY_MIN_WAIT", "1"))
RETRY_MAX_WAIT = float(os.getenv("API_RETRY_MAX_WAIT", "10"))

# Total timeout for all queries combined
TOTAL_TIMEOUT = 60.0

# ---------------------------------------------------------------------------
# Severity keyword sets (PRD §6.2)
# ---------------------------------------------------------------------------
HIGH_SEVERITY_KEYWORDS: List[str] = [
    "convicted", "indicted", "charged", "sentenced", "guilty",
    "arrested", "imprisoned", "money laundering", "terrorist financing",
    "fraud scheme", "embezzlement", "criminal",
]

MEDIUM_SEVERITY_KEYWORDS: List[str] = [
    "investigation", "probe", "searched", "allegations", "accused",
    "suspected", "corruption", "bribery", "scandal", "sanctioned",
    "fined", "penalty", "violation",
]

LOW_SEVERITY_KEYWORDS: List[str] = [
    "controversy", "criticized", "questioned", "lawsuit", "dispute",
    "regulatory", "compliance", "offshore", "tax evasion",
    "conflict of interest",
]

# ---------------------------------------------------------------------------
# Category tagging rules (PRD §6.3)
# ---------------------------------------------------------------------------
CATEGORY_RULES: Dict[str, List[str]] = {
    "corruption": ["corruption", "bribery", "embezzlement", "misappropriation", "kickback"],
    "fraud": ["fraud", "scheme", "deception", "false", "forged", "scam"],
    "money_laundering": ["money laundering", "laundering", "proceeds of crime", "illicit funds"],
    "sanctions": ["sanctions", "sanctioned", "designated", "ofac", "eu sanctions"],
    "terrorism_financing": ["terrorist financing", "terrorism", "extremism"],
    "investigation": ["investigation", "probe", "searched", "raid", "inquiry"],
    "legal_proceedings": ["charged", "indicted", "convicted", "sentenced", "trial", "prosecution", "arrested"],
    "regulatory": ["fine", "penalty", "violation", "regulatory", "compliance failure"],
    "offshore": ["offshore", "panama papers", "pandora papers", "paradise papers", "shell company", "tax haven"],
    "general_adverse": ["scandal", "controversy", "misconduct", "allegations"],
}


class AdverseMediaService:
    """Collects and processes adverse media hits for entities."""

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()

        self.provider = settings.ADVERSE_MEDIA_PROVIDER
        self.query_delay = settings.ADVERSE_MEDIA_QUERY_DELAY
        self.dedup_threshold = settings.ADVERSE_MEDIA_DEDUP_THRESHOLD
        self.timeout = 10.0

        # Provider-specific keys
        self.serper_api_key = settings.SERPER_API_KEY
        self.google_cse_api_key = settings.GOOGLE_CSE_API_KEY
        self.google_cse_engine_id = settings.GOOGLE_CSE_ENGINE_ID

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def search(self, request: AdverseMediaRequest) -> AdverseMediaResponse:
        """Main entry point. Builds queries, executes, processes, returns."""
        if not request.name.strip():
            return self._empty_response(request, error="Empty entity name")

        logger.info(
            "adverse_media_search_started",
            entity=request.name,
            entity_type=request.entity_type,
            provider=self.provider,
        )

        queries = self._build_queries(request)

        try:
            raw_results = await self._execute_searches(queries)
        except Exception as exc:
            logger.error("adverse_media_search_failed", error=str(exc))
            return self._empty_response(request, queries=queries, error=str(exc))

        deduped = self._deduplicate(raw_results)
        classified = self._classify_results(deduped)
        sorted_results = self._sort_and_limit(classified, request.max_results)

        response = self._build_response(request, sorted_results, queries)

        logger.info(
            "adverse_media_search_complete",
            entity=request.name,
            total_hits=response.total_hits,
            high=response.high_severity_count,
            medium=response.medium_severity_count,
            low=response.low_severity_count,
            queries_executed=len(queries),
        )

        return response

    # ------------------------------------------------------------------
    # Query building (PRD §5)
    # ------------------------------------------------------------------

    def _build_queries(self, request: AdverseMediaRequest) -> List[str]:
        """Generate search queries from templates."""
        name = request.name
        country = request.country or ""
        is_org = request.entity_type == "organization"

        country_suffix = f" {country}" if country else ""

        templates = [
            f'"{name}"{country_suffix} corruption OR fraud OR bribery OR embezzlement',
            f'"{name}"{country_suffix} investigation OR charged OR indicted OR convicted OR prosecution',
            f'"{name}" sanctions OR sanctioned OR "money laundering" OR "terrorist financing"',
        ]

        if is_org:
            templates.append(f'"{name}" fine OR penalty OR violation OR regulatory')
        else:
            templates.append(f'"{name}" scandal OR misconduct OR allegations OR controversy')

        templates.append(
            f'"{name}" "panama papers" OR "pandora papers" OR "paradise papers" OR offshore'
        )

        # Also run templates 1 & 2 for each alias
        for alias in request.aliases:
            alias = alias.strip()
            if not alias:
                continue
            templates.append(
                f'"{alias}"{country_suffix} corruption OR fraud OR bribery OR embezzlement'
            )
            templates.append(
                f'"{alias}"{country_suffix} investigation OR charged OR indicted OR convicted OR prosecution'
            )

        return templates

    # ------------------------------------------------------------------
    # Search execution (PRD §5.2)
    # ------------------------------------------------------------------

    async def _execute_searches(self, queries: List[str]) -> List[Dict[str, Any]]:
        """Call search API for each query sequentially with delay. Returns raw results."""
        # Check circuit breaker
        if adverse_media_breaker.current_state == "open":
            raise APIError("Adverse media service temporarily unavailable (circuit open)")

        all_results: List[Dict[str, Any]] = []
        failed_count = 0
        last_error: Optional[str] = None
        start = asyncio.get_event_loop().time()

        for query in queries:
            # Respect total timeout
            elapsed = asyncio.get_event_loop().time() - start
            if elapsed > TOTAL_TIMEOUT:
                logger.warning("adverse_media_total_timeout", elapsed=elapsed)
                break

            try:
                results = await self._call_provider(query)
                # Tag each result with the query that produced it
                for r in results:
                    r["_query_used"] = query
                all_results.extend(results)
            except Exception as exc:
                failed_count += 1
                last_error = str(exc)
                logger.warning(
                    "adverse_media_query_failed",
                    query=query,
                    error=last_error,
                )
                # Record failure on breaker but continue with remaining queries
                try:
                    adverse_media_breaker.call(lambda: (_ for _ in ()).throw(exc))
                except (CircuitBreakerError, Exception):
                    pass

            # Delay between queries to respect rate limits
            await asyncio.sleep(self.query_delay)

        # If every single query failed, raise so the caller can set the error field
        if failed_count == len(queries):
            raise APIError(f"All {failed_count} queries failed. Last error: {last_error}")

        logger.info("adverse_media_raw_results", count=len(all_results))
        return all_results

    async def _call_provider(self, query: str) -> List[Dict[str, Any]]:
        """Dispatch to the configured search provider."""
        if self.provider == "google_cse":
            return await self._call_google_cse(query)
        return await self._call_serper(query)

    # ------------------------------------------------------------------
    # Serper.dev integration (PRD §7.3)
    # ------------------------------------------------------------------

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True,
    )
    async def _call_serper(self, query: str) -> List[Dict[str, Any]]:
        """
        POST https://google.serper.dev/search
        Headers: X-API-KEY: {key}
        Body: { "q": query, "num": 10 }
        """
        if not self.serper_api_key:
            raise APIError("SERPER_API_KEY not configured")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": self.serper_api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 10},
            )
            response.raise_for_status()
            data = response.json()

            # Normalize Serper response to common shape
            raw = data.get("organic", [])
            return [
                {
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "url": item.get("link", ""),
                    "source_name": item.get("source", self._extract_domain(item.get("link", ""))),
                    "published_date": item.get("date"),
                }
                for item in raw
            ]

    # ------------------------------------------------------------------
    # Google Custom Search integration (PRD §7.4)
    # ------------------------------------------------------------------

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True,
    )
    async def _call_google_cse(self, query: str) -> List[Dict[str, Any]]:
        """
        GET https://www.googleapis.com/customsearch/v1
        Params: key, cx, q, num
        """
        if not self.google_cse_api_key or not self.google_cse_engine_id:
            raise APIError("GOOGLE_CSE_API_KEY / GOOGLE_CSE_ENGINE_ID not configured")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": self.google_cse_api_key,
                    "cx": self.google_cse_engine_id,
                    "q": query,
                    "num": 10,
                },
            )
            response.raise_for_status()
            data = response.json()

            raw = data.get("items", [])
            return [
                {
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "url": item.get("link", ""),
                    "source_name": item.get("displayLink", self._extract_domain(item.get("link", ""))),
                    "published_date": None,
                }
                for item in raw
            ]

    # ------------------------------------------------------------------
    # Deduplication (PRD §6.1)
    # ------------------------------------------------------------------

    def _deduplicate(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate articles by URL and title similarity."""
        seen_urls: set = set()
        unique: List[Dict[str, Any]] = []

        for item in results:
            norm_url = self._normalize_url(item.get("url", ""))

            # Exact URL match
            if norm_url in seen_urls:
                continue

            # Fuzzy title match against already-accepted items
            title = item.get("title", "")
            is_dup = False
            for idx, existing in enumerate(unique):
                similarity = fuzz.token_sort_ratio(title, existing.get("title", ""))
                if similarity > self.dedup_threshold:
                    # Keep the version with the longer snippet
                    if len(item.get("snippet", "")) > len(existing.get("snippet", "")):
                        unique[idx] = item
                    is_dup = True
                    break

            if not is_dup:
                seen_urls.add(norm_url)
                unique.append(item)

        logger.info(
            "adverse_media_dedup",
            before=len(results),
            after=len(unique),
        )
        return unique

    # ------------------------------------------------------------------
    # Classification (PRD §6.2 & §6.3)
    # ------------------------------------------------------------------

    def _classify_results(self, results: List[Dict[str, Any]]) -> List[AdverseMediaHit]:
        """Assign severity and categories to each result."""
        hits: List[AdverseMediaHit] = []

        for item in results:
            text = f"{item.get('title', '')} {item.get('snippet', '')}".lower()
            severity = self._score_severity(text)
            categories = self._tag_categories(text)

            hits.append(
                AdverseMediaHit(
                    title=item.get("title", ""),
                    snippet=item.get("snippet", ""),
                    url=item.get("url", ""),
                    source_name=item.get("source_name", ""),
                    published_date=item.get("published_date"),
                    severity=severity,
                    categories=categories,
                    query_used=item.get("_query_used", ""),
                )
            )

        return hits

    def _score_severity(self, text: str) -> str:
        """Return 'high', 'medium', or 'low' based on keyword presence."""
        for kw in HIGH_SEVERITY_KEYWORDS:
            if kw in text:
                return "high"
        for kw in MEDIUM_SEVERITY_KEYWORDS:
            if kw in text:
                return "medium"
        for kw in LOW_SEVERITY_KEYWORDS:
            if kw in text:
                return "low"
        # Default: still came from an adverse-media query
        return "low"

    def _tag_categories(self, text: str) -> List[str]:
        """Tag an article with one or more compliance categories."""
        cats: List[str] = []
        for category, keywords in CATEGORY_RULES.items():
            if any(kw in text for kw in keywords):
                cats.append(category)
        return cats if cats else ["general_adverse"]

    # ------------------------------------------------------------------
    # Sort & limit (PRD §6 step 5)
    # ------------------------------------------------------------------

    def _sort_and_limit(
        self, hits: List[AdverseMediaHit], max_results: int
    ) -> List[AdverseMediaHit]:
        """Sort by severity desc, then by date desc. Limit to max_results."""
        severity_order = {"high": 0, "medium": 1, "low": 2}

        def sort_key(h: AdverseMediaHit):
            sev = severity_order.get(h.severity, 3)
            # Newer dates first; missing dates sort last
            date = h.published_date or ""
            return (sev, "" if date else "z", date)

        # For date: we want descending, so reverse the string comparison
        hits_sorted = sorted(hits, key=sort_key)
        return hits_sorted[:max_results]

    # ------------------------------------------------------------------
    # Response building
    # ------------------------------------------------------------------

    def _build_response(
        self,
        request: AdverseMediaRequest,
        hits: List[AdverseMediaHit],
        queries: List[str],
    ) -> AdverseMediaResponse:
        """Package into final response model."""
        high = sum(1 for h in hits if h.severity == "high")
        medium = sum(1 for h in hits if h.severity == "medium")
        low = sum(1 for h in hits if h.severity == "low")

        return AdverseMediaResponse(
            entity_name=request.name,
            total_hits=len(hits),
            high_severity_count=high,
            medium_severity_count=medium,
            low_severity_count=low,
            hits=hits,
            queries_executed=queries,
            search_provider=self.provider,
            search_timestamp=datetime.utcnow().isoformat(),
        )

    def _empty_response(
        self,
        request: AdverseMediaRequest,
        queries: Optional[List[str]] = None,
        error: Optional[str] = None,
    ) -> AdverseMediaResponse:
        """Return an empty but valid response (graceful failure)."""
        return AdverseMediaResponse(
            entity_name=request.name,
            total_hits=0,
            hits=[],
            queries_executed=queries or [],
            search_provider=self.provider,
            search_timestamp=datetime.utcnow().isoformat(),
            error=error,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_url(url: str) -> str:
        """Strip query parameters and trailing slashes for dedup comparison."""
        try:
            parsed = urlparse(url)
            clean = urlunparse((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", "", ""))
            return clean.lower()
        except Exception:
            return url.lower().rstrip("/")

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract human-readable domain from a URL."""
        try:
            host = urlparse(url).netloc
            # Remove www. prefix
            if host.startswith("www."):
                host = host[4:]
            return host
        except Exception:
            return ""
