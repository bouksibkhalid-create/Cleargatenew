"""Entity Profile Orchestrator — M5: Coordinates all services into a single pipeline.

Runs sanctions, offshore, and adverse media searches in parallel, feeds results
through risk scoring (M3) and AI analysis (M4), and assembles a complete
EntityProfile response.
"""

import asyncio
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from src.config.settings import Settings
from src.models.adverse_media import AdverseMediaRequest, AdverseMediaResponse
from src.models.ai_analysis import AIAnalysisInput
from src.models.entity_profile import (
    CollectionResults,
    EntityInfo,
    EntityProfile,
    EntityProfileRequest,
    SourceItem,
)
from src.models.risk_scoring import RiskScoringInput
from src.services.adverse_media_service import AdverseMediaService
from src.services.ai_analysis_service import AIAnalysisService
from src.services.fuzzy_matcher import FuzzyMatcher
from src.services.opensanctions_service import OpenSanctionsService
from src.services.risk_scoring_service import RiskScoringService
from src.utils.logger import get_logger

logger = get_logger(__name__)


class EntityProfileOrchestrator:
    """Coordinates all services to produce a complete entity profile."""

    def __init__(self, settings: Optional[Settings] = None):
        if settings is None:
            settings = Settings()

        self.settings = settings

        # Services that take Settings
        self.adverse_media_service = AdverseMediaService(settings)
        self.ai_analysis_service = AIAnalysisService(settings)

        # Services that use env vars / their own config
        self.opensanctions_service = OpenSanctionsService()

        # Pure-computation services (no config needed)
        self.risk_scoring_service = RiskScoringService()

        # Supabase and Offshore are initialised lazily in their search methods
        # to avoid import errors when neo4j/supabase are not installed.
        self._supabase_service = None
        self._offshore_service = None

        # F1/F2: Dorking + OSINT (lazy to avoid import issues)
        self._dorking_service = None
        self._osint_service = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_profile(
        self, request: EntityProfileRequest
    ) -> EntityProfile:
        """Main entry point. Runs the full intelligence pipeline."""
        check_id = str(uuid.uuid4())
        start_time = time.time()

        # Step 1: Parallel data collection
        collection = await self._collect_data(request)

        # Step 2: Extract signals from raw results
        signals = self._extract_signals(request, collection)

        # Step 3: Risk scoring (synchronous, fast)
        risk_assessment = self.risk_scoring_service.score(signals)

        # Step 4: AI analysis (async, optional)
        ai_result = None
        if request.include_ai_analysis:
            ai_input = self._build_ai_input(
                request, signals, risk_assessment, collection
            )
            ai_result = await self.ai_analysis_service.analyze(ai_input)

        # Step 4b: OSINT Synthesis for non-sanctioned entities
        osint_synthesis = None
        if not signals.is_sanctioned:
            osint_synthesis = await self._run_osint_synthesis(
                request, collection
            )

        # Step 5: Build source items list
        sources = self._build_sources_list(collection)

        # Step 6: Assemble final profile
        duration_ms = int((time.time() - start_time) * 1000)
        return self._assemble_profile(
            request=request,
            check_id=check_id,
            risk_assessment=risk_assessment,
            ai_result=ai_result,
            collection=collection,
            signals=signals,
            sources=sources,
            duration_ms=duration_ms,
            osint_synthesis=osint_synthesis,
        )

    # ------------------------------------------------------------------
    # Step 1: Parallel data collection
    # ------------------------------------------------------------------

    async def _collect_data(
        self, request: EntityProfileRequest
    ) -> CollectionResults:
        """Run all data source queries in parallel."""
        tasks: Dict[str, Any] = {
            "sanctions": self._search_sanctions(request),
            "offshore": self._search_offshore(request),
            "dorking": self._run_dorking(request),
            "osint": self._run_osint(request),
        }
        if request.include_adverse_media:
            tasks["adverse_media"] = self._search_adverse_media(request)

        gathered = await asyncio.gather(
            *[
                self._safe_execute(name, coro)
                for name, coro in tasks.items()
            ],
            return_exceptions=False,
        )

        results: Dict[str, Any] = {}
        errors: Dict[str, str] = {}
        for name, result, error in gathered:
            results[name] = result
            if error:
                errors[name] = error

        # Detect graceful failures (e.g., missing API key returns empty response with error field)
        media_result = results.get("adverse_media")
        if media_result and hasattr(media_result, "error") and media_result.error:
            errors.setdefault("adverse_media", media_result.error)

        return CollectionResults(
            sanctions=results.get("sanctions"),
            offshore=results.get("offshore"),
            adverse_media=results.get("adverse_media"),
            dorking=results.get("dorking"),
            osint=results.get("osint"),
            errors=errors,
        )

    async def _safe_execute(
        self, name: str, coro
    ) -> Tuple[str, Any, Optional[str]]:
        """Execute a coroutine safely, capturing errors instead of raising."""
        try:
            result = await coro
            return (name, result, None)
        except Exception as exc:
            print(f"[PIPELINE ERROR] {name}: {exc}")
            logger.error(
                "data_collection_failed",
                source=name,
                error=str(exc),
            )
            return (name, None, str(exc))

    # ------------------------------------------------------------------
    # Source-specific search methods
    # ------------------------------------------------------------------

    async def _search_sanctions(self, request: EntityProfileRequest) -> Dict:
        """Search OpenSanctions for sanctions and PEP data.

        Uses FuzzyMatcher to filter out false-positive results whose names
        do not genuinely match the queried entity (e.g. "Zunyi WEI" should
        NOT match "David Beckham").
        """
        matcher = FuzzyMatcher(threshold=75)
        results: Dict[str, Any] = {
            "opensanctions_results": [],
            "supabase_results": [],
            "is_sanctioned": False,
            "is_pep": False,
            "sanctions_hits": 0,
            "pep_hits": 0,
            "pep_details": None,
            "sanctions_lists": [],
        }

        # --- Supabase search (sync wrapper) ---
        try:
            supabase_results = await self._search_supabase(request.name)
            if supabase_results:
                # Filter by name similarity to avoid false positives
                verified = []
                for r in supabase_results:
                    candidate_name = (
                        r.get("name") or r.get("full_name") or ""
                    )
                    is_match, score = matcher.is_match(
                        request.name, candidate_name
                    )
                    if is_match:
                        verified.append(r)
                        results["is_sanctioned"] = True
                        results["sanctions_hits"] += 1
                        programs = (
                            r.get("programs")
                            or r.get("sanction_lists")
                            or []
                        )
                        results["sanctions_lists"].extend(programs)
                    else:
                        logger.info(
                            "supabase_false_positive_filtered",
                            query=request.name,
                            candidate=candidate_name,
                            score=score,
                        )
                results["supabase_results"] = verified
        except Exception as exc:
            logger.warning("supabase_search_failed", error=str(exc))

        # --- OpenSanctions search ---
        try:
            os_entities = await self.opensanctions_service.search(
                request.name, limit=10
            )
            if os_entities:
                # Filter by name similarity
                verified_entities = []
                for entity in os_entities:
                    is_match, score = matcher.is_match(
                        request.name, entity.name
                    )
                    if not is_match:
                        logger.info(
                            "opensanctions_false_positive_filtered",
                            query=request.name,
                            candidate=entity.name,
                            score=score,
                        )
                        continue
                    verified_entities.append(entity)

                # Convert verified entities to dicts for storage
                raw_list = [
                    e.model_dump(by_alias=True) if hasattr(e, "model_dump") else (e.dict(by_alias=True) if hasattr(e, "dict") else e)
                    for e in verified_entities
                ]
                results["opensanctions_results"] = raw_list

                for entity in verified_entities:
                    topics = entity.properties.get("topics", []) or []
                    datasets = entity.datasets or []

                    # PEP detection
                    if any(
                        "pep" in str(t).lower()
                        for t in topics + datasets
                    ):
                        results["is_pep"] = True
                        results["pep_hits"] += 1
                        results["pep_details"] = (
                            entity.properties.get("position", [None])[0]
                            if entity.properties.get("position")
                            else entity.name
                        )

                    # Sanctions detection
                    if any(
                        "sanction" in str(t).lower() for t in topics
                    ):
                        results["is_sanctioned"] = True
                        results["sanctions_hits"] += 1
                        programs = entity.properties.get("program", [])
                        results["sanctions_lists"].extend(programs)
        except Exception as exc:
            logger.warning("opensanctions_search_failed", error=str(exc))

        # Deduplicate sanctions lists
        results["sanctions_lists"] = list(set(results["sanctions_lists"]))
        return results

    async def _search_supabase(self, name: str) -> List[Dict]:
        """Search Supabase sanctions DB (sync service wrapped for async)."""
        if self._supabase_service is None:
            try:
                from src.services.data_sources.supabase_search_service import (
                    SupabaseSearchService,
                )
                self._supabase_service = SupabaseSearchService()
            except Exception as exc:
                logger.warning("supabase_init_failed", error=str(exc))
                return []

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._supabase_service.search, name
        )

    async def _search_offshore(self, request: EntityProfileRequest) -> Dict:
        """Search Neo4j for offshore leaks connections."""
        results: Dict[str, Any] = {
            "offshore_results": [],
            "connections_count": 0,
            "is_officer": False,
            "is_beneficiary": False,
        }

        try:
            if self._offshore_service is None:
                from src.services.offshore_service import OffshoreLeaksService
                self._offshore_service = OffshoreLeaksService()

            entities = await self._offshore_service.search(
                request.name, limit=10
            )
            if entities:
                raw_list = [
                    e.model_dump() if hasattr(e, "model_dump") else (e.dict() if hasattr(e, "dict") else e) for e in entities
                ]
                results["offshore_results"] = raw_list
                results["connections_count"] = len(entities)

                for entity in entities:
                    node_type = (
                        entity.node_type if hasattr(entity, "node_type") else ""
                    ).lower()
                    if node_type == "officer":
                        results["is_officer"] = True

                    connections = (
                        entity.connections
                        if hasattr(entity, "connections")
                        else []
                    )
                    for conn in connections:
                        rel_type = (
                            conn.relationship
                            if hasattr(conn, "relationship")
                            else ""
                        ).upper()
                        if rel_type in (
                            "BENEFICIAL_OWNER",
                            "BENEFICIARY_OF",
                        ):
                            results["is_beneficiary"] = True
                        if rel_type in ("OFFICER_OF", "DIRECTOR_OF"):
                            results["is_officer"] = True
        except Exception as exc:
            logger.warning("offshore_search_failed", error=str(exc))

        return results

    async def _search_adverse_media(
        self, request: EntityProfileRequest
    ) -> Optional[AdverseMediaResponse]:
        """Search for adverse media using M2 service."""
        media_request = AdverseMediaRequest(
            name=request.name,
            entity_type=request.entity_type,
            country=request.country,
            aliases=request.aliases,
            max_results=request.max_adverse_media,
        )
        return await self.adverse_media_service.search(media_request)

    async def _run_dorking(self, request: EntityProfileRequest):
        """F1: Run Google dorking queries via Serper.dev."""
        try:
            if self._dorking_service is None:
                from src.services.dorking_service import DorkingService
                self._dorking_service = DorkingService(self.settings)

            entity_data = {
                "entity_type": request.entity_type,
                "country": request.country,
                "aliases": request.aliases,
            }
            return await self._dorking_service.execute(
                request.name, entity_data
            )
        except Exception as exc:
            logger.warning("dorking_failed", error=str(exc))
            return None

    async def _run_osint(self, request: EntityProfileRequest):
        """F2: Run OSINT collectors in parallel."""
        try:
            if self._osint_service is None:
                from src.services.osint.osint_collector import OSINTCollectorService
                self._osint_service = OSINTCollectorService(self.settings)

            entity_data = {
                "entity_type": request.entity_type,
                "country": request.country,
                "aliases": request.aliases,
            }
            return await self._osint_service.collect_all(
                request.name, entity_data
            )
        except Exception as exc:
            logger.warning("osint_failed", error=str(exc))
            return None

    async def _run_osint_synthesis(
        self,
        request: EntityProfileRequest,
        collection: CollectionResults,
    ):
        """For non-sanctioned entities: scrape dorking URLs → Claude synthesis."""
        try:
            from src.services.scraping_service import ScrapingService
            from src.services.osint_synthesis_service import OSINTSynthesisService

            # Gather dorking URLs
            dorking_urls: List[Dict] = []
            if collection.dorking and hasattr(collection.dorking, "all_results_dicts"):
                for r in collection.dorking.all_results_dicts():
                    dorking_urls.append({
                        "url": r.get("url", ""),
                        "snippet": r.get("snippet", ""),
                        "title": r.get("title", ""),
                    })

            if not dorking_urls:
                logger.info("osint_synthesis_skipped", reason="no dorking URLs")
                # Still return a synthesis with no-sources fallback
                synth = OSINTSynthesisService(self.settings)
                return await synth.synthesize(
                    entity_name=request.name,
                    entity_type=request.entity_type,
                    country=request.country or "",
                    scraped_context="",
                    source_count=0,
                    lang=request.lang,
                )

            # Scrape top 10 URLs
            scraper = ScrapingService()
            pages = await scraper.scrape_urls(dorking_urls, max_urls=10)
            context = scraper.build_context(pages)

            # Synthesize via Claude
            synth = OSINTSynthesisService(self.settings)
            result = await synth.synthesize(
                entity_name=request.name,
                entity_type=request.entity_type,
                country=request.country or "",
                scraped_context=context,
                source_count=len(pages),
                lang=request.lang,
            )

            # Attach source metadata
            result.sources_investigated = [p.to_dict() for p in pages]
            return result

        except Exception as exc:
            logger.error("osint_synthesis_pipeline_failed", error=str(exc))
            return None

    # ------------------------------------------------------------------
    # Step 2: Signal extraction
    # ------------------------------------------------------------------

    def _extract_signals(
        self,
        request: EntityProfileRequest,
        collection: CollectionResults,
    ) -> RiskScoringInput:
        """Extract scoring signals from raw collection results."""
        sanctions_data = collection.sanctions or {}
        offshore_data = collection.offshore or {}
        media_data = collection.adverse_media  # AdverseMediaResponse or None

        return RiskScoringInput(
            entity_name=request.name,
            entity_type=request.entity_type,
            # Sanctions
            is_sanctioned=sanctions_data.get("is_sanctioned", False),
            sanctions_hits=sanctions_data.get("sanctions_hits", 0),
            sanctions_lists=sanctions_data.get("sanctions_lists", []),
            # PEP
            is_pep=sanctions_data.get("is_pep", False),
            pep_hits=sanctions_data.get("pep_hits", 0),
            pep_details=sanctions_data.get("pep_details"),
            # Adverse media
            adverse_media_total=media_data.total_hits if media_data else 0,
            adverse_media_high=media_data.high_severity_count if media_data else 0,
            adverse_media_medium=media_data.medium_severity_count if media_data else 0,
            adverse_media_low=media_data.low_severity_count if media_data else 0,
            adverse_media_categories=self._extract_media_categories(media_data),
            # Offshore
            offshore_connections=offshore_data.get("connections_count", 0),
            offshore_is_officer=offshore_data.get("is_officer", False),
            offshore_is_beneficiary=offshore_data.get("is_beneficiary", False),
        )

    def _extract_media_categories(
        self, media_data: Optional[AdverseMediaResponse]
    ) -> List[str]:
        """Extract unique categories from all media hits."""
        if not media_data or not media_data.hits:
            return []
        categories: List[str] = []
        for hit in media_data.hits:
            categories.extend(hit.categories)
        return list(set(categories))

    # ------------------------------------------------------------------
    # Step 4: Build AI input
    # ------------------------------------------------------------------

    def _build_ai_input(
        self,
        request: EntityProfileRequest,
        signals: RiskScoringInput,
        risk_assessment,
        collection: CollectionResults,
    ) -> AIAnalysisInput:
        """Map all data into AIAnalysisInput for M4."""
        media_hits_dicts: List[Dict] = []
        if collection.adverse_media and collection.adverse_media.hits:
            for hit in collection.adverse_media.hits:
                media_hits_dicts.append(
                    hit.model_dump() if hasattr(hit, "model_dump") else (hit.dict() if hasattr(hit, "dict") else hit)
                )

        return AIAnalysisInput(
            entity_name=request.name,
            entity_type=request.entity_type,
            country=request.country,
            risk_score=risk_assessment.score,
            risk_level=risk_assessment.risk_level,
            risk_factors=risk_assessment.risk_factors,
            score_breakdown=risk_assessment.score_breakdown,
            is_sanctioned=signals.is_sanctioned,
            sanctions_hits=signals.sanctions_hits,
            sanctions_lists=signals.sanctions_lists,
            is_pep=signals.is_pep,
            pep_hits=signals.pep_hits,
            pep_details=signals.pep_details,
            adverse_media_total=signals.adverse_media_total,
            adverse_media_high=signals.adverse_media_high,
            adverse_media_medium=signals.adverse_media_medium,
            adverse_media_low=signals.adverse_media_low,
            adverse_media_hits=media_hits_dicts,
            offshore_connections=signals.offshore_connections,
            offshore_is_officer=signals.offshore_is_officer,
            offshore_is_beneficiary=signals.offshore_is_beneficiary,
        )

    # ------------------------------------------------------------------
    # Step 5: Build sources list
    # ------------------------------------------------------------------

    def _build_sources_list(
        self, collection: CollectionResults
    ) -> List[SourceItem]:
        """Build the Sources & References list from all results."""
        sources: List[SourceItem] = []

        # Adverse media → "news" items
        if collection.adverse_media and collection.adverse_media.hits:
            for hit in collection.adverse_media.hits:
                sources.append(
                    SourceItem(
                        type="news",
                        title=hit.title,
                        snippet=hit.snippet,
                        url=hit.url,
                        source_name=hit.source_name,
                        published_date=hit.published_date,
                        severity=hit.severity,
                    )
                )

        # Sanctions matches → "sanctions" items
        sanctions_data = collection.sanctions or {}
        for result in sanctions_data.get("supabase_results", []):
            name = (
                result.get("name")
                or result.get("full_name")
                or "Sanctions Match"
            )
            programs = (
                result.get("programs")
                or result.get("sanction_lists")
                or []
            )
            sources.append(
                SourceItem(
                    type="sanctions",
                    title=(
                        f"Sanctions List: {', '.join(programs)}"
                        if programs
                        else "Sanctions List Match"
                    ),
                    source_name=result.get("source", "Sanctions Database"),
                    url=result.get("source_url"),
                )
            )

        # PEP matches → "pep" items from OpenSanctions
        for result in sanctions_data.get("opensanctions_results", []):
            topics = result.get("topics", []) or []
            datasets = result.get("datasets", []) or []
            props = result.get("properties", {}) or {}
            all_tags = topics + datasets + props.get("topics", [])
            if any("pep" in str(t).lower() for t in all_tags):
                caption = result.get("name") or result.get("caption", "PEP Match")
                sources.append(
                    SourceItem(
                        type="pep",
                        title=f"Sanctions List: PEP",
                        source_name="OpenSanctions",
                        url=result.get("url"),
                    )
                )

        # Offshore matches → "offshore" items
        offshore_data = collection.offshore or {}
        for result in offshore_data.get("offshore_results", [])[:5]:
            sources.append(
                SourceItem(
                    type="offshore",
                    title=result.get("name", "Offshore Entity"),
                    snippet=(
                        f"{result.get('node_type', 'Entity')} — "
                        f"{result.get('jurisdiction', 'Unknown jurisdiction')}"
                    ),
                    source_name="ICIJ Offshore Leaks",
                )
            )

        return sources

    # ------------------------------------------------------------------
    # Step 6: Assemble final profile
    # ------------------------------------------------------------------

    def _assemble_profile(
        self,
        request: EntityProfileRequest,
        check_id: str,
        risk_assessment,
        ai_result,
        collection: CollectionResults,
        signals: RiskScoringInput,
        sources: List[SourceItem],
        duration_ms: int,
        osint_synthesis=None,
    ) -> EntityProfile:
        """Package everything into the final EntityProfile."""
        sanctions_data = collection.sanctions or {}
        offshore_data = collection.offshore or {}

        # Determine check status
        sources_succeeded: List[str] = []
        sources_failed: List[str] = []
        for source_name in ["sanctions", "offshore", "adverse_media"]:
            if source_name == "adverse_media" and not request.include_adverse_media:
                continue
            if source_name in collection.errors:
                sources_failed.append(source_name)
            else:
                sources_succeeded.append(source_name)

        if not sources_succeeded:
            check_status = "failed"
        elif sources_failed:
            check_status = "partial"
        else:
            check_status = "completed"

        # Serialize adverse media hits
        media_hits_dicts: List[Dict] = []
        if collection.adverse_media and collection.adverse_media.hits:
            for hit in collection.adverse_media.hits:
                media_hits_dicts.append(
                    hit.model_dump() if hasattr(hit, "model_dump") else (hit.dict() if hasattr(hit, "dict") else hit)
                )

        return EntityProfile(
            # Entity
            entity=EntityInfo(
                name=request.name,
                entity_type=request.entity_type,
                country=request.country,
                aliases=request.aliases,
            ),
            # Risk
            risk_score=risk_assessment.score,
            risk_level=risk_assessment.risk_level,
            risk_color=risk_assessment.risk_color,
            risk_factors=risk_assessment.risk_factors,
            score_breakdown=risk_assessment.score_breakdown,
            # Hit counts
            sanctions_hits=sanctions_data.get("sanctions_hits", 0),
            pep_hits=sanctions_data.get("pep_hits", 0),
            adverse_news_count=(
                collection.adverse_media.total_hits
                if collection.adverse_media
                else 0
            ),
            offshore_connections_count=offshore_data.get(
                "connections_count", 0
            ),
            # AI analysis
            ai_summary=(
                ai_result.executive_summary if ai_result else None
            ),
            ai_key_findings=(
                ai_result.key_findings if ai_result else []
            ),
            ai_recommendation=(
                ai_result.recommendation if ai_result else None
            ),
            ai_model_used=(
                ai_result.model_used if ai_result else None
            ),
            ai_generation_time_ms=(
                ai_result.generation_time_ms if ai_result else None
            ),
            # Sources
            sources=sources,
            # Sanctions detail
            sanctions_results=(
                sanctions_data.get("supabase_results", [])
                + sanctions_data.get("opensanctions_results", [])
            ),
            sanctions_lists_matched=sanctions_data.get(
                "sanctions_lists", []
            ),
            is_sanctioned=sanctions_data.get("is_sanctioned", False),
            is_pep=sanctions_data.get("is_pep", False),
            pep_details=sanctions_data.get("pep_details"),
            # Adverse media detail
            adverse_media_hits=media_hits_dicts,
            adverse_media_high=(
                collection.adverse_media.high_severity_count
                if collection.adverse_media
                else 0
            ),
            adverse_media_medium=(
                collection.adverse_media.medium_severity_count
                if collection.adverse_media
                else 0
            ),
            adverse_media_low=(
                collection.adverse_media.low_severity_count
                if collection.adverse_media
                else 0
            ),
            # Offshore detail
            offshore_results=offshore_data.get("offshore_results", []),
            offshore_is_officer=offshore_data.get("is_officer", False),
            offshore_is_beneficiary=offshore_data.get(
                "is_beneficiary", False
            ),
            # Dorking results (F1)
            dorking_results=(
                collection.dorking.all_results_dicts()
                if collection.dorking and hasattr(collection.dorking, "all_results_dicts")
                else []
            ),
            dorking_flagged_count=(
                collection.dorking.flagged_count
                if collection.dorking and hasattr(collection.dorking, "flagged_count")
                else 0
            ),
            # OSINT data (F2)
            osint_corporate=(
                collection.osint.corporate if collection.osint else []
            ),
            osint_court_records=(
                collection.osint.court_records if collection.osint else []
            ),
            osint_gov_filings=(
                collection.osint.gov_filings if collection.osint else []
            ),
            osint_social_profiles=(
                collection.osint.social_profiles if collection.osint else []
            ),
            # OSINT Synthesis (for non-sanctioned entities)
            osint_biography=(
                osint_synthesis.biography if osint_synthesis else None
            ),
            osint_adverse_summary=(
                osint_synthesis.adverse_summary if osint_synthesis else None
            ),
            osint_risk_assessment=(
                osint_synthesis.risk_assessment if osint_synthesis else None
            ),
            osint_risk_rationale=(
                osint_synthesis.risk_rationale if osint_synthesis else None
            ),
            osint_sources_investigated=(
                getattr(osint_synthesis, "sources_investigated", [])
                if osint_synthesis else []
            ),
            osint_synthesis_model=(
                osint_synthesis.model_used if osint_synthesis else None
            ),
            osint_synthesis_error=(
                osint_synthesis.error if osint_synthesis else None
            ),
            # Check metadata
            check_id=check_id,
            check_status=check_status,
            check_created_at=datetime.utcnow().isoformat() + "Z",
            check_duration_ms=duration_ms,
            sources_succeeded=sources_succeeded,
            sources_failed=sources_failed,
        )
