"""F1 — Google Dorking Service: generates targeted search queries, executes via Serper.dev,
stores results in Supabase, and scores relevance via Claude AI.

Integrated into M5 orchestrator pipeline — runs automatically on every search.
"""

import asyncio
import json
import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from src.config.settings import Settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

SERPER_URL = "https://google.serper.dev/search"
CACHE_TTL_DAYS = 90


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

class DorkQuery:
    """A single dork query with its category and priority."""
    def __init__(self, query_string: str, category: str, priority: str = "HIGH"):
        self.query_string = query_string
        self.category = category
        self.priority = priority


class DorkResult:
    """A single parsed result from a dork query."""
    def __init__(
        self,
        title: str = "",
        url: str = "",
        snippet: str = "",
        domain: str = "",
        position: int = 0,
        category: str = "",
        query_used: str = "",
        date_published: Optional[str] = None,
        relevance_score: float = 0.0,
        is_flagged: bool = False,
        flag_reason: str = "",
    ):
        self.title = title
        self.url = url
        self.snippet = snippet
        self.domain = domain
        self.position = position
        self.category = category
        self.query_used = query_used
        self.date_published = date_published
        self.relevance_score = relevance_score
        self.is_flagged = is_flagged
        self.flag_reason = flag_reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "domain": self.domain,
            "position": self.position,
            "category": self.category,
            "query_used": self.query_used,
            "date_published": self.date_published,
            "relevance_score": self.relevance_score,
            "is_flagged": self.is_flagged,
            "flag_reason": self.flag_reason,
        }


class DorkingReport:
    """Aggregated results from a dorking execution."""
    def __init__(
        self,
        results: Optional[List[DorkResult]] = None,
        new_results: Optional[List[DorkResult]] = None,
        cached_results: Optional[List[Dict]] = None,
        from_cache: bool = False,
        queries_executed: int = 0,
        total_results: int = 0,
        flagged_count: int = 0,
    ):
        self.results = results or []
        self.new_results = new_results or []
        self.cached_results = cached_results or []
        self.from_cache = from_cache
        self.queries_executed = queries_executed
        self.total_results = total_results
        self.flagged_count = flagged_count

    def all_results_dicts(self) -> List[Dict]:
        """Return all results (new + cached) as dicts."""
        out = [r.to_dict() for r in self.results]
        out.extend([r.to_dict() for r in self.new_results])
        out.extend(self.cached_results)
        return out


# ---------------------------------------------------------------------------
# DorkingService
# ---------------------------------------------------------------------------

class DorkingService:
    """Generates and executes Google dork queries via Serper.dev API."""

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()
        self.api_key = settings.SERPER_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self._supabase = None

    def _get_supabase(self):
        if self._supabase is None:
            from src.services.supabase_client import get_supabase_client
            self._supabase = get_supabase_client()
        return self._supabase

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def execute(self, entity_name: str, entity_data: Optional[Dict] = None) -> DorkingReport:
        """Main entry: check cache, generate queries, execute, score, store."""
        entity_data = entity_data or {}

        if not self.api_key:
            logger.warning("dorking_skipped", reason="SERPER_API_KEY not configured")
            return DorkingReport()

        try:
            # 1. Check cache
            cached = await self._get_cached(entity_name)
            if cached is not None and cached["age_days"] < CACHE_TTL_DAYS:
                logger.info("dorking_cache_hit", entity=entity_name, age_days=cached["age_days"])
                # Diff search: re-run queries, only store new URLs
                new_results = await self._diff_search(entity_name, entity_data, cached["existing_urls"])
                if new_results:
                    scored = await self._ai_score(entity_name, new_results)
                    await self._store_results(entity_name, scored)
                    return DorkingReport(
                        cached_results=cached["results"],
                        new_results=scored,
                        from_cache=True,
                        total_results=len(cached["results"]) + len(scored),
                        flagged_count=sum(1 for r in scored if r.is_flagged),
                    )
                return DorkingReport(
                    cached_results=cached["results"],
                    from_cache=True,
                    total_results=len(cached["results"]),
                )

            # 2. Full execution (first-time search)
            queries = self._generate_queries(entity_name, entity_data)
            all_results: List[DorkResult] = []

            for query in queries:
                try:
                    raw = await self._call_serper(query)
                    parsed = self._parse_results(raw, query)
                    all_results.extend(parsed)
                except Exception as e:
                    logger.warning("dorking_query_failed", query=query.category, error=str(e))
                await asyncio.sleep(0.3)  # Rate limit

            unique = self._deduplicate(all_results)
            scored = await self._ai_score(entity_name, unique)
            await self._store_results(entity_name, scored)

            return DorkingReport(
                results=scored,
                from_cache=False,
                queries_executed=len(queries),
                total_results=len(scored),
                flagged_count=sum(1 for r in scored if r.is_flagged),
            )

        except Exception as e:
            logger.error("dorking_execute_failed", entity=entity_name, error=str(e))
            return DorkingReport()

    # ------------------------------------------------------------------
    # Query generation (10 categories per PRD §3.3)
    # ------------------------------------------------------------------

    def _generate_queries(self, entity_name: str, entity_data: Dict) -> List[DorkQuery]:
        """Generate 10 dork queries from entity name + aliases + context."""
        name = entity_name
        aliases = entity_data.get("aliases", [])
        country = entity_data.get("country", "")

        queries = [
            DorkQuery(
                f'"{name}" (sanctions OR SDN OR OFAC) filetype:pdf',
                "sanctions_documents", "HIGH"
            ),
            DorkQuery(
                f'"{name}" (director OR shareholder) site:opencorporates.com OR site:sec.gov',
                "corporate_filings", "HIGH"
            ),
            DorkQuery(
                f'"{name}" (plaintiff OR defendant OR litigation) site:courtlistener.com OR site:justia.com',
                "court_records", "HIGH"
            ),
            DorkQuery(
                f'"{name}" (corruption OR fraud OR investigation) site:reuters.com OR site:bbc.com',
                "news_investigations", "HIGH"
            ),
            DorkQuery(
                f'"{name}" site:icij.org OR "panama papers" OR "paradise papers"',
                "leaked_documents", "HIGH"
            ),
            DorkQuery(
                f'"{name}" (contract OR procurement) site:usaspending.gov OR site:ted.europa.eu',
                "government_contracts", "MEDIUM"
            ),
            DorkQuery(
                f'"{name}" (property OR "land registry")',
                "property_records", "MEDIUM"
            ),
            DorkQuery(
                f'"{name}" site:linkedin.com OR site:twitter.com',
                "social_media", "MEDIUM"
            ),
            DorkQuery(
                f'"{name}" site:scholar.google.com OR site:researchgate.net',
                "academic_professional", "LOW"
            ),
        ]

        # Category 10: Alias expansion (only if aliases exist)
        if aliases:
            alias_parts = " OR ".join(f'"{a}"' for a in aliases[:3])
            queries.append(DorkQuery(
                f'{alias_parts} (sanctions OR wanted)',
                "alias_expansion", "HIGH"
            ))

        return queries

    # ------------------------------------------------------------------
    # Serper.dev API call
    # ------------------------------------------------------------------

    async def _call_serper(self, query: DorkQuery) -> Dict:
        """Execute a single Serper.dev search."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                SERPER_URL,
                headers={
                    "X-API-KEY": self.api_key,
                    "Content-Type": "application/json",
                },
                json={"q": query.query_string, "num": 10},
            )
            resp.raise_for_status()
            return resp.json()

    # ------------------------------------------------------------------
    # Parse results
    # ------------------------------------------------------------------

    def _parse_results(self, raw: Dict, query: DorkQuery) -> List[DorkResult]:
        """Parse Serper.dev response into DorkResult objects."""
        results: List[DorkResult] = []

        for item in raw.get("organic", []):
            url = item.get("link", "")
            if not url:
                continue
            domain = urlparse(url).netloc
            results.append(DorkResult(
                title=item.get("title", ""),
                url=url,
                snippet=item.get("snippet", ""),
                domain=domain,
                position=item.get("position", 0),
                category=query.category,
                query_used=query.query_string,
                date_published=item.get("date"),
            ))

        return results

    # ------------------------------------------------------------------
    # Deduplication
    # ------------------------------------------------------------------

    def _deduplicate(self, results: List[DorkResult]) -> List[DorkResult]:
        """Remove duplicate URLs, keeping the first occurrence."""
        seen: set = set()
        unique: List[DorkResult] = []
        for r in results:
            normalized = r.url.rstrip("/").lower()
            if normalized not in seen:
                seen.add(normalized)
                unique.append(r)
        return unique

    # ------------------------------------------------------------------
    # AI relevance scoring via Claude
    # ------------------------------------------------------------------

    async def _ai_score(self, entity_name: str, results: List[DorkResult]) -> List[DorkResult]:
        """Batch-score results for relevance using Claude API."""
        if not self.anthropic_key or not results:
            # No AI available — use heuristic scoring
            return self._heuristic_score(entity_name, results)

        try:
            items = [
                {"title": r.title, "url": r.url, "snippet": r.snippet, "category": r.category}
                for r in results[:30]  # Cap at 30 to avoid token limits
            ]

            prompt = f"""Entity under investigation: {entity_name}

Score each search result for relevance to a due diligence investigation.
Return a JSON array (same order as input). For each result provide:
- relevance_score: 0.0 to 1.0 (1.0 = directly relevant to entity's risk profile)
- is_flagged: true if this is a significant finding worth highlighting
- flag_reason: 1 sentence explaining why (only if flagged, else empty string)

Results to score:
{json.dumps(items, indent=2)}

Respond ONLY with valid JSON array. No other text."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 2048,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()

            text = data.get("content", [{}])[0].get("text", "")
            # Extract JSON array from response
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                scores = json.loads(match.group())
                for i, score_data in enumerate(scores):
                    if i < len(results):
                        results[i].relevance_score = float(score_data.get("relevance_score", 0))
                        results[i].is_flagged = bool(score_data.get("is_flagged", False))
                        results[i].flag_reason = score_data.get("flag_reason", "")

        except Exception as e:
            logger.warning("dorking_ai_score_failed", error=str(e))
            return self._heuristic_score(entity_name, results)

        return results

    def _heuristic_score(self, entity_name: str, results: List[DorkResult]) -> List[DorkResult]:
        """Fallback scoring based on category priority and keyword matching."""
        high_cats = {"sanctions_documents", "court_records", "leaked_documents", "news_investigations", "alias_expansion"}
        high_keywords = {"sanctions", "fraud", "corruption", "indicted", "convicted", "investigation", "panama", "offshore"}

        name_lower = entity_name.lower()
        for r in results:
            score = 0.3  # Base
            text = (r.title + " " + r.snippet).lower()

            if name_lower in text:
                score += 0.3
            if r.category in high_cats:
                score += 0.2
            if any(kw in text for kw in high_keywords):
                score += 0.2
                r.is_flagged = True
                r.flag_reason = "Contains high-priority compliance keywords"

            r.relevance_score = min(score, 1.0)

        return results

    # ------------------------------------------------------------------
    # Cache operations
    # ------------------------------------------------------------------

    async def _get_cached(self, entity_name: str) -> Optional[Dict]:
        """Check if we have cached dorking results for this entity."""
        try:
            db = self._get_supabase()
            resp = db.table("dorking_results") \
                .select("*") \
                .eq("entity_name", entity_name) \
                .order("created_at", desc=True) \
                .execute()

            rows = resp.data or []
            if not rows:
                return None

            oldest = min(r["created_at"] for r in rows)
            age = (datetime.utcnow() - datetime.fromisoformat(oldest.replace("Z", "+00:00").replace("+00:00", ""))).days
            existing_urls = {r["url"] for r in rows}

            return {
                "results": rows,
                "age_days": age,
                "existing_urls": existing_urls,
            }
        except Exception as e:
            logger.warning("dorking_cache_check_failed", error=str(e))
            return None

    async def _diff_search(self, entity_name: str, entity_data: Dict, existing_urls: set) -> List[DorkResult]:
        """Re-run queries, return only URLs not already in DB."""
        queries = self._generate_queries(entity_name, entity_data)
        new_results: List[DorkResult] = []

        for query in queries:
            try:
                raw = await self._call_serper(query)
                for item in self._parse_results(raw, query):
                    if item.url.rstrip("/").lower() not in {u.rstrip("/").lower() for u in existing_urls}:
                        new_results.append(item)
            except Exception:
                pass
            await asyncio.sleep(0.3)

        return self._deduplicate(new_results)

    async def _store_results(self, entity_name: str, results: List[DorkResult]):
        """Store dorking results in Supabase (upsert by entity_name + url)."""
        if not results:
            return
        try:
            db = self._get_supabase()
            rows = []
            for r in results:
                rows.append({
                    "entity_name": entity_name,
                    "category": r.category,
                    "query_used": r.query_used,
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet[:500] if r.snippet else None,
                    "domain": r.domain,
                    "position": r.position,
                    "date_published": r.date_published,
                    "relevance_score": r.relevance_score,
                    "is_flagged": r.is_flagged,
                    "flag_reason": r.flag_reason,
                    "updated_at": datetime.utcnow().isoformat(),
                })

            db.table("dorking_results").upsert(
                rows,
                on_conflict="entity_name,url",
            ).execute()
            logger.info("dorking_results_stored", entity=entity_name, count=len(rows))
        except Exception as e:
            logger.warning("dorking_store_failed", error=str(e))
