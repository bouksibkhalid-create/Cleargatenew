"""Unit tests for M5: Entity Profile Orchestrator.

All external services are mocked — no real API calls, no DB connections.
"""

import pytest
import sys
import types
from unittest.mock import AsyncMock, MagicMock, patch

# Stub out neo4j to avoid ImportError from the services import chain
neo4j_stub = types.ModuleType("neo4j")
neo4j_stub.AsyncGraphDatabase = None
neo4j_stub.AsyncDriver = None
sys.modules.setdefault("neo4j", neo4j_stub)

from src.models.adverse_media import AdverseMediaHit, AdverseMediaResponse
from src.models.ai_analysis import AIAnalysisResult
from src.models.entity_profile import (
    CollectionResults,
    EntityProfile,
    EntityProfileRequest,
    SourceItem,
)
from src.models.risk_scoring import RiskScoringInput
from src.services.entity_profile_orchestrator import EntityProfileOrchestrator


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_settings():
    s = MagicMock()
    s.ANTHROPIC_API_KEY = None  # AI disabled for speed in most tests
    s.AI_ANALYSIS_MODEL = "claude-sonnet-4-20250514"
    s.AI_ANALYSIS_MAX_TOKENS = 1024
    s.AI_ANALYSIS_TIMEOUT = 30.0
    s.ADVERSE_MEDIA_PROVIDER = "serper"
    s.SERPER_API_KEY = "test-key"
    s.GOOGLE_CSE_API_KEY = None
    s.GOOGLE_CSE_ENGINE_ID = None
    s.ADVERSE_MEDIA_QUERY_DELAY = 0.0
    s.ADVERSE_MEDIA_DEDUP_THRESHOLD = 85
    return s


@pytest.fixture
def orchestrator(mock_settings):
    """Orchestrator with all external services mocked."""
    orch = EntityProfileOrchestrator.__new__(EntityProfileOrchestrator)
    orch.settings = mock_settings
    orch.risk_scoring_service = MagicMock()
    orch.ai_analysis_service = MagicMock()
    orch.adverse_media_service = MagicMock()
    orch.opensanctions_service = MagicMock()
    orch._supabase_service = None
    orch._offshore_service = None
    return orch


@pytest.fixture
def basic_request():
    return EntityProfileRequest(
        name="Édouard Philippe",
        entity_type="individual",
        country="France",
    )


@pytest.fixture
def clean_request():
    return EntityProfileRequest(name="John Doe")


def _make_risk_assessment():
    """Fake RiskAssessment from M3."""
    mock = MagicMock()
    mock.score = 35
    mock.risk_level = "medium"
    mock.risk_color = "#F59E0B"
    mock.risk_factors = [
        "Politically Exposed Person (PEP) — Former Prime Minister of France",
        "3 medium-severity adverse media hits",
    ]
    mock.score_breakdown = {"sanctions": 0, "pep": 15, "adverse_media": 12, "offshore": 0}
    return mock


def _make_ai_result():
    """Fake AIAnalysisResult from M4."""
    return AIAnalysisResult(
        executive_summary="Édouard Philippe presents a medium risk score of 35/100.",
        key_findings=["PEP — Former Prime Minister", "3 adverse media hits"],
        recommendation="Enhanced due diligence is recommended.",
        model_used="fallback-template-v1",
        tokens_used=0,
        generation_time_ms=0,
    )


def _make_media_response():
    """Fake AdverseMediaResponse from M2."""
    return AdverseMediaResponse(
        entity_name="Édouard Philippe",
        total_hits=3,
        high_severity_count=0,
        medium_severity_count=3,
        low_severity_count=0,
        hits=[
            AdverseMediaHit(
                title="Former French PM Philippe's mayoral office searched",
                snippet="Office was searched in corruption probe.",
                url="https://reuters.com/article1",
                source_name="Reuters",
                published_date="2024-11-15",
                severity="medium",
                categories=["corruption", "investigation"],
                query_used="query1",
            ),
            AdverseMediaHit(
                title="City Hall Searched in Favoritism Case",
                snippet="Police searched the Le Havre city hall.",
                url="https://apnews.com/article2",
                source_name="AP News",
                published_date="2024-11-15",
                severity="medium",
                categories=["investigation"],
                query_used="query1",
            ),
            AdverseMediaHit(
                title="Philippe targeted by embezzlement complaint",
                snippet="A second complaint was filed.",
                url="https://lemonde.fr/article3",
                source_name="Le Monde",
                published_date="2024-12-01",
                severity="medium",
                categories=["corruption"],
                query_used="query2",
            ),
        ],
        queries_executed=["query1", "query2"],
    )


def _make_sanctions_data(is_pep=False, is_sanctioned=False):
    """Fake sanctions collection result."""
    data = {
        "opensanctions_results": [],
        "supabase_results": [],
        "is_sanctioned": is_sanctioned,
        "is_pep": is_pep,
        "sanctions_hits": 1 if is_sanctioned else 0,
        "pep_hits": 1 if is_pep else 0,
        "pep_details": "Former Prime Minister of France" if is_pep else None,
        "sanctions_lists": ["OFAC SDN"] if is_sanctioned else [],
    }
    return data


def _make_offshore_data(connections=0, is_officer=False, is_beneficiary=False):
    """Fake offshore collection result."""
    return {
        "offshore_results": [{"name": f"Entity_{i}", "node_type": "Entity"} for i in range(connections)],
        "connections_count": connections,
        "is_officer": is_officer,
        "is_beneficiary": is_beneficiary,
    }


# ---------------------------------------------------------------------------
# Tests: _extract_signals
# ---------------------------------------------------------------------------

class TestExtractSignals:
    def test_extract_signals_sanctioned(self, orchestrator, basic_request):
        collection = CollectionResults(
            sanctions=_make_sanctions_data(is_sanctioned=True),
            offshore=_make_offshore_data(),
        )
        signals = orchestrator._extract_signals(basic_request, collection)
        assert isinstance(signals, RiskScoringInput)
        assert signals.is_sanctioned is True
        assert signals.sanctions_hits == 1
        assert "OFAC SDN" in signals.sanctions_lists

    def test_extract_signals_pep(self, orchestrator, basic_request):
        collection = CollectionResults(
            sanctions=_make_sanctions_data(is_pep=True),
            offshore=_make_offshore_data(),
        )
        signals = orchestrator._extract_signals(basic_request, collection)
        assert signals.is_pep is True
        assert signals.pep_hits == 1
        assert signals.pep_details == "Former Prime Minister of France"

    def test_extract_signals_clean(self, orchestrator, clean_request):
        collection = CollectionResults(
            sanctions=_make_sanctions_data(),
            offshore=_make_offshore_data(),
        )
        signals = orchestrator._extract_signals(clean_request, collection)
        assert signals.is_sanctioned is False
        assert signals.is_pep is False
        assert signals.adverse_media_total == 0
        assert signals.offshore_connections == 0

    def test_extract_signals_with_media(self, orchestrator, basic_request):
        collection = CollectionResults(
            sanctions=_make_sanctions_data(),
            offshore=_make_offshore_data(),
            adverse_media=_make_media_response(),
        )
        signals = orchestrator._extract_signals(basic_request, collection)
        assert signals.adverse_media_total == 3
        assert signals.adverse_media_medium == 3

    def test_extract_signals_with_offshore(self, orchestrator, basic_request):
        collection = CollectionResults(
            sanctions=_make_sanctions_data(),
            offshore=_make_offshore_data(connections=3, is_officer=True),
        )
        signals = orchestrator._extract_signals(basic_request, collection)
        assert signals.offshore_connections == 3
        assert signals.offshore_is_officer is True


# ---------------------------------------------------------------------------
# Tests: _build_sources_list
# ---------------------------------------------------------------------------

class TestBuildSourcesList:
    def test_news_sources(self, orchestrator):
        collection = CollectionResults(adverse_media=_make_media_response())
        sources = orchestrator._build_sources_list(collection)
        news_sources = [s for s in sources if s.type == "news"]
        assert len(news_sources) == 3
        assert news_sources[0].source_name == "Reuters"
        assert news_sources[0].severity == "medium"

    def test_sanctions_sources(self, orchestrator):
        collection = CollectionResults(
            sanctions={
                "supabase_results": [
                    {"name": "Test", "programs": ["OFAC SDN"], "source": "OFAC"}
                ],
                "opensanctions_results": [],
            }
        )
        sources = orchestrator._build_sources_list(collection)
        sanction_sources = [s for s in sources if s.type == "sanctions"]
        assert len(sanction_sources) == 1
        assert "OFAC SDN" in sanction_sources[0].title

    def test_pep_sources(self, orchestrator):
        collection = CollectionResults(
            sanctions={
                "supabase_results": [],
                "opensanctions_results": [
                    {
                        "name": "Édouard Philippe",
                        "datasets": ["pep-database"],
                        "topics": [],
                        "properties": {},
                        "url": "https://opensanctions.org/entities/123",
                    }
                ],
            }
        )
        sources = orchestrator._build_sources_list(collection)
        pep_sources = [s for s in sources if s.type == "pep"]
        assert len(pep_sources) == 1
        assert "PEP" in pep_sources[0].title

    def test_offshore_sources(self, orchestrator):
        collection = CollectionResults(
            offshore=_make_offshore_data(connections=3),
        )
        sources = orchestrator._build_sources_list(collection)
        offshore_sources = [s for s in sources if s.type == "offshore"]
        assert len(offshore_sources) == 3
        assert offshore_sources[0].source_name == "ICIJ Offshore Leaks"

    def test_mixed_sources(self, orchestrator):
        collection = CollectionResults(
            sanctions={
                "supabase_results": [{"name": "X", "programs": ["EU"], "source": "EU"}],
                "opensanctions_results": [
                    {"name": "Y", "datasets": ["pep-db"], "topics": [], "properties": {}, "url": None}
                ],
            },
            offshore=_make_offshore_data(connections=1),
            adverse_media=_make_media_response(),
        )
        sources = orchestrator._build_sources_list(collection)
        types_found = set(s.type for s in sources)
        assert "news" in types_found
        assert "sanctions" in types_found
        assert "pep" in types_found
        assert "offshore" in types_found

    def test_empty_collection(self, orchestrator):
        collection = CollectionResults()
        sources = orchestrator._build_sources_list(collection)
        assert sources == []


# ---------------------------------------------------------------------------
# Tests: _safe_execute
# ---------------------------------------------------------------------------

class TestSafeExecute:
    @pytest.mark.asyncio
    async def test_success(self, orchestrator):
        async def ok():
            return {"data": 42}
        name, result, error = await orchestrator._safe_execute("test", ok())
        assert name == "test"
        assert result == {"data": 42}
        assert error is None

    @pytest.mark.asyncio
    async def test_failure(self, orchestrator):
        async def fail():
            raise RuntimeError("boom")
        name, result, error = await orchestrator._safe_execute("test", fail())
        assert name == "test"
        assert result is None
        assert "boom" in error


# ---------------------------------------------------------------------------
# Tests: Parallel collection
# ---------------------------------------------------------------------------

class TestParallelCollection:
    @pytest.mark.asyncio
    async def test_all_sources_called(self, orchestrator, basic_request):
        """3 mocked services → all called, results collected."""
        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data(is_pep=True))
        orchestrator._search_offshore = AsyncMock(return_value=_make_offshore_data())
        orchestrator._search_adverse_media = AsyncMock(return_value=_make_media_response())

        collection = await orchestrator._collect_data(basic_request)
        assert collection.sanctions is not None
        assert collection.offshore is not None
        assert collection.adverse_media is not None
        assert collection.errors == {}

    @pytest.mark.asyncio
    async def test_partial_failure(self, orchestrator, basic_request):
        """1 of 3 services fails → other 2 results present."""
        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data())
        orchestrator._search_offshore = AsyncMock(side_effect=RuntimeError("Neo4j down"))
        orchestrator._search_adverse_media = AsyncMock(return_value=_make_media_response())

        collection = await orchestrator._collect_data(basic_request)
        assert collection.sanctions is not None
        assert collection.offshore is None
        assert collection.adverse_media is not None
        assert "offshore" in collection.errors

    @pytest.mark.asyncio
    async def test_skip_media(self, orchestrator):
        """include_adverse_media=False → media not called."""
        request = EntityProfileRequest(name="Test", include_adverse_media=False)
        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data())
        orchestrator._search_offshore = AsyncMock(return_value=_make_offshore_data())
        orchestrator._search_adverse_media = AsyncMock()

        collection = await orchestrator._collect_data(request)
        orchestrator._search_adverse_media.assert_not_called()
        assert collection.adverse_media is None


# ---------------------------------------------------------------------------
# Tests: Complete pipeline
# ---------------------------------------------------------------------------

class TestCompletePipeline:
    @pytest.mark.asyncio
    async def test_full_profile(self, orchestrator, basic_request):
        """All services mocked → full EntityProfile returned."""
        risk = _make_risk_assessment()
        ai = _make_ai_result()

        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data(is_pep=True))
        orchestrator._search_offshore = AsyncMock(return_value=_make_offshore_data())
        orchestrator._search_adverse_media = AsyncMock(return_value=_make_media_response())
        orchestrator.risk_scoring_service.score = MagicMock(return_value=risk)
        orchestrator.ai_analysis_service.analyze = AsyncMock(return_value=ai)

        profile = await orchestrator.generate_profile(basic_request)

        assert isinstance(profile, EntityProfile)
        assert profile.entity.name == "Édouard Philippe"
        assert profile.risk_score == 35
        assert profile.risk_level == "medium"
        assert profile.is_pep is True
        assert profile.adverse_news_count == 3
        assert profile.ai_summary is not None
        assert "35/100" in profile.ai_summary
        assert len(profile.ai_key_findings) >= 2
        assert profile.check_status == "completed"
        assert profile.check_duration_ms >= 0
        assert len(profile.sources) > 0
        assert "sanctions" in profile.sources_succeeded
        assert "offshore" in profile.sources_succeeded
        assert "adverse_media" in profile.sources_succeeded

    @pytest.mark.asyncio
    async def test_skip_ai(self, orchestrator):
        """include_ai_analysis=False → ai_summary is None, faster response."""
        request = EntityProfileRequest(
            name="Quick Check",
            include_ai_analysis=False,
            include_adverse_media=False,
        )
        risk = _make_risk_assessment()
        risk.score = 0
        risk.risk_level = "low"
        risk.risk_color = "#10B981"
        risk.risk_factors = []
        risk.score_breakdown = {"sanctions": 0, "pep": 0, "adverse_media": 0, "offshore": 0}

        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data())
        orchestrator._search_offshore = AsyncMock(return_value=_make_offshore_data())
        orchestrator.risk_scoring_service.score = MagicMock(return_value=risk)

        profile = await orchestrator.generate_profile(request)

        assert profile.ai_summary is None
        assert profile.ai_key_findings == []
        assert profile.ai_recommendation is None
        assert profile.ai_model_used is None
        orchestrator.ai_analysis_service.analyze.assert_not_called()

    @pytest.mark.asyncio
    async def test_partial_failure_status(self, orchestrator, basic_request):
        """One source fails → check_status='partial'."""
        risk = _make_risk_assessment()
        risk.score = 15
        risk.risk_level = "low"
        risk.risk_color = "#10B981"
        risk.risk_factors = []
        risk.score_breakdown = {"sanctions": 0, "pep": 0, "adverse_media": 0, "offshore": 0}
        ai = _make_ai_result()

        orchestrator._search_sanctions = AsyncMock(return_value=_make_sanctions_data())
        orchestrator._search_offshore = AsyncMock(side_effect=RuntimeError("Neo4j down"))
        orchestrator._search_adverse_media = AsyncMock(return_value=_make_media_response())
        orchestrator.risk_scoring_service.score = MagicMock(return_value=risk)
        orchestrator.ai_analysis_service.analyze = AsyncMock(return_value=ai)

        profile = await orchestrator.generate_profile(basic_request)

        assert profile.check_status == "partial"
        assert "offshore" in profile.sources_failed
        assert "sanctions" in profile.sources_succeeded
        assert "adverse_media" in profile.sources_succeeded
        assert profile.offshore_connections_count == 0

    @pytest.mark.asyncio
    async def test_all_sources_fail(self, orchestrator, basic_request):
        """All data sources fail → check_status='failed', profile still returned."""
        risk = _make_risk_assessment()
        risk.score = 0
        risk.risk_level = "low"
        risk.risk_color = "#10B981"
        risk.risk_factors = []
        risk.score_breakdown = {"sanctions": 0, "pep": 0, "adverse_media": 0, "offshore": 0}
        ai = _make_ai_result()

        orchestrator._search_sanctions = AsyncMock(side_effect=RuntimeError("down"))
        orchestrator._search_offshore = AsyncMock(side_effect=RuntimeError("down"))
        orchestrator._search_adverse_media = AsyncMock(side_effect=RuntimeError("down"))
        orchestrator.risk_scoring_service.score = MagicMock(return_value=risk)
        orchestrator.ai_analysis_service.analyze = AsyncMock(return_value=ai)

        profile = await orchestrator.generate_profile(basic_request)

        assert profile.check_status == "failed"
        assert len(profile.sources_failed) == 3
        assert profile.risk_score == 0


# ---------------------------------------------------------------------------
# Tests: Request validation
# ---------------------------------------------------------------------------

class TestRequestValidation:
    def test_valid_request(self):
        r = EntityProfileRequest(name="Test Name")
        assert r.name == "Test Name"

    def test_name_stripped(self):
        r = EntityProfileRequest(name="  Test  ")
        assert r.name == "Test"

    def test_name_too_short(self):
        with pytest.raises(ValueError, match="at least 2"):
            EntityProfileRequest(name="A")

    def test_name_blank(self):
        with pytest.raises(ValueError):
            EntityProfileRequest(name="   ")

    def test_defaults(self):
        r = EntityProfileRequest(name="Test")
        assert r.entity_type == "individual"
        assert r.country is None
        assert r.aliases == []
        assert r.include_ai_analysis is True
        assert r.include_adverse_media is True
        assert r.max_adverse_media == 10


# ---------------------------------------------------------------------------
# Tests: _build_ai_input
# ---------------------------------------------------------------------------

class TestBuildAIInput:
    def test_ai_input_mapping(self, orchestrator, basic_request):
        risk = _make_risk_assessment()
        collection = CollectionResults(
            sanctions=_make_sanctions_data(is_pep=True),
            offshore=_make_offshore_data(connections=2),
            adverse_media=_make_media_response(),
        )
        signals = orchestrator._extract_signals(basic_request, collection)
        ai_input = orchestrator._build_ai_input(basic_request, signals, risk, collection)

        assert ai_input.entity_name == "Édouard Philippe"
        assert ai_input.risk_score == 35
        assert ai_input.risk_level == "medium"
        assert ai_input.is_pep is True
        assert ai_input.adverse_media_total == 3
        assert len(ai_input.adverse_media_hits) == 3
        assert ai_input.offshore_connections == 2


# ---------------------------------------------------------------------------
# Tests: _extract_media_categories
# ---------------------------------------------------------------------------

class TestExtractMediaCategories:
    def test_with_media(self, orchestrator):
        media = _make_media_response()
        categories = orchestrator._extract_media_categories(media)
        assert "corruption" in categories
        assert "investigation" in categories

    def test_without_media(self, orchestrator):
        assert orchestrator._extract_media_categories(None) == []

    def test_empty_hits(self, orchestrator):
        media = AdverseMediaResponse(entity_name="X")
        assert orchestrator._extract_media_categories(media) == []
