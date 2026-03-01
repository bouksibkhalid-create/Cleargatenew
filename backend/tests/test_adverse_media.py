"""Unit tests for M2: Adverse Media Service.

All tests use mocked API responses — no real network calls.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

import sys
import types

# Stub out neo4j to avoid ImportError from the offshore_service import chain
neo4j_stub = types.ModuleType("neo4j")
neo4j_stub.AsyncGraphDatabase = None
neo4j_stub.AsyncDriver = None
sys.modules.setdefault("neo4j", neo4j_stub)

from src.models.adverse_media import (
    AdverseMediaRequest,
    AdverseMediaHit,
    AdverseMediaResponse,
)
from src.services.adverse_media_service import AdverseMediaService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def settings():
    """Minimal settings mock for adverse media service."""
    s = MagicMock()
    s.SERPER_API_KEY = "test-key"
    s.GOOGLE_CSE_API_KEY = None
    s.GOOGLE_CSE_ENGINE_ID = None
    s.ADVERSE_MEDIA_PROVIDER = "serper"
    s.ADVERSE_MEDIA_MAX_QUERIES = 5
    s.ADVERSE_MEDIA_QUERY_DELAY = 0.0  # no delay in tests
    s.ADVERSE_MEDIA_DEDUP_THRESHOLD = 85
    return s


@pytest.fixture
def service(settings):
    return AdverseMediaService(settings=settings)


@pytest.fixture
def sample_request():
    return AdverseMediaRequest(
        name="Édouard Philippe",
        entity_type="individual",
        country="France",
    )


@pytest.fixture
def org_request():
    return AdverseMediaRequest(
        name="Wirecard",
        entity_type="organization",
    )


@pytest.fixture
def alias_request():
    return AdverseMediaRequest(
        name="Vladimir Putin",
        entity_type="individual",
        country="Russia",
        aliases=["Vladimir Vladimirovich Putin"],
    )


# Simulated Serper responses
SERPER_RESULTS_CORRUPTION = [
    {
        "title": "Édouard Philippe investigated for corruption in Le Havre",
        "snippet": "French prosecutors have launched an investigation into former PM Édouard Philippe over corruption allegations related to public contracts.",
        "link": "https://www.reuters.com/article/france-philippe-corruption",
        "source": "Reuters",
        "date": "2025-11-15",
    },
    {
        "title": "Philippe faces bribery probe linked to construction deals",
        "snippet": "The national financial prosecutor's office is probing bribery allegations against Édouard Philippe.",
        "link": "https://www.lemonde.fr/philippe-bribery",
        "source": "Le Monde",
        "date": "2025-10-20",
    },
]

SERPER_RESULTS_INVESTIGATION = [
    {
        "title": "Édouard Philippe investigated for corruption in Le Havre",  # duplicate title
        "snippet": "Prosecutors probe.",  # shorter snippet — should be dropped in dedup
        "link": "https://www.reuters.com/article/france-philippe-corruption",  # exact URL dup
        "source": "Reuters",
        "date": "2025-11-15",
    },
    {
        "title": "Philippe charged with misuse of public funds",
        "snippet": "Édouard Philippe has been formally charged with misuse of public funds in a case dating back to 2019.",
        "link": "https://www.france24.com/philippe-charged",
        "source": "France 24",
        "date": "2025-12-01",
    },
]

SERPER_RESULTS_EMPTY = []


# ---------------------------------------------------------------------------
# Tests: _build_queries
# ---------------------------------------------------------------------------

class TestBuildQueries:
    def test_individual_queries_count(self, service, sample_request):
        queries = service._build_queries(sample_request)
        assert len(queries) == 5

    def test_individual_queries_contain_name(self, service, sample_request):
        queries = service._build_queries(sample_request)
        for q in queries:
            assert '"Édouard Philippe"' in q

    def test_individual_queries_country_appended(self, service, sample_request):
        queries = service._build_queries(sample_request)
        # Queries 1 and 2 should include France
        assert "France" in queries[0]
        assert "France" in queries[1]

    def test_organization_uses_regulatory_template(self, service, org_request):
        queries = service._build_queries(org_request)
        regulatory_query = queries[3]
        assert "fine OR penalty OR violation OR regulatory" in regulatory_query
        assert "scandal" not in regulatory_query

    def test_individual_uses_scandal_template(self, service, sample_request):
        queries = service._build_queries(sample_request)
        scandal_query = queries[3]
        assert "scandal OR misconduct" in scandal_query

    def test_aliases_generate_extra_queries(self, service, alias_request):
        queries = service._build_queries(alias_request)
        # 5 base + 2 per alias = 7
        assert len(queries) == 7
        assert any('"Vladimir Vladimirovich Putin"' in q for q in queries)

    def test_no_country_no_suffix(self, service):
        req = AdverseMediaRequest(name="Test Person")
        queries = service._build_queries(req)
        # First query should not have trailing space before keywords
        assert queries[0].startswith('"Test Person" corruption')


# ---------------------------------------------------------------------------
# Tests: _deduplicate
# ---------------------------------------------------------------------------

class TestDeduplicate:
    def test_exact_url_dedup(self, service):
        results = [
            {"title": "Article A", "snippet": "Long snippet here", "url": "https://example.com/a"},
            {"title": "Article B", "snippet": "Another", "url": "https://example.com/a"},
        ]
        deduped = service._deduplicate(results)
        assert len(deduped) == 1

    def test_url_normalization_strips_query_params(self, service):
        results = [
            {"title": "Article A", "snippet": "Snippet", "url": "https://example.com/a?ref=twitter"},
            {"title": "Article A copy", "snippet": "Snippet", "url": "https://example.com/a"},
        ]
        deduped = service._deduplicate(results)
        assert len(deduped) == 1

    def test_fuzzy_title_dedup_keeps_longer_snippet(self, service):
        results = [
            {"title": "Philippe investigated for corruption", "snippet": "Short.", "url": "https://a.com/1"},
            {"title": "Philippe investigated for corruption in Le Havre", "snippet": "Much longer and detailed snippet about the investigation.", "url": "https://b.com/2"},
        ]
        deduped = service._deduplicate(results)
        assert len(deduped) == 1
        assert "Much longer" in deduped[0]["snippet"]

    def test_different_articles_kept(self, service):
        results = [
            {"title": "Philippe corruption probe", "snippet": "A", "url": "https://a.com/1"},
            {"title": "Wirecard fraud scandal", "snippet": "B", "url": "https://b.com/2"},
        ]
        deduped = service._deduplicate(results)
        assert len(deduped) == 2


# ---------------------------------------------------------------------------
# Tests: _classify_results / severity
# ---------------------------------------------------------------------------

class TestClassification:
    def test_high_severity_convicted(self, service):
        results = [{"title": "CEO convicted of fraud", "snippet": "Sentenced to 10 years.", "url": "https://x.com/1", "source_name": "BBC", "_query_used": "q1"}]
        hits = service._classify_results(results)
        assert hits[0].severity == "high"

    def test_medium_severity_investigation(self, service):
        results = [{"title": "Investigation into bribery allegations", "snippet": "Prosecutors opened a probe.", "url": "https://x.com/2", "source_name": "BBC", "_query_used": "q1"}]
        hits = service._classify_results(results)
        assert hits[0].severity == "medium"

    def test_low_severity_controversy(self, service):
        results = [{"title": "Controversy over tax policies", "snippet": "Critics questioned the approach.", "url": "https://x.com/3", "source_name": "BBC", "_query_used": "q1"}]
        hits = service._classify_results(results)
        assert hits[0].severity == "low"

    def test_default_low_severity(self, service):
        results = [{"title": "Random news article", "snippet": "Nothing notable here.", "url": "https://x.com/4", "source_name": "BBC", "_query_used": "q1"}]
        hits = service._classify_results(results)
        assert hits[0].severity == "low"

    def test_high_overrides_medium(self, service):
        results = [{"title": "Investigation leads to conviction", "snippet": "He was convicted.", "url": "https://x.com/5", "source_name": "BBC", "_query_used": "q1"}]
        hits = service._classify_results(results)
        assert hits[0].severity == "high"


# ---------------------------------------------------------------------------
# Tests: category tagging
# ---------------------------------------------------------------------------

class TestCategoryTagging:
    def test_corruption_category(self, service):
        results = [{"title": "Corruption scandal", "snippet": "Bribery ring exposed.", "url": "https://x.com/1", "source_name": "X", "_query_used": "q"}]
        hits = service._classify_results(results)
        assert "corruption" in hits[0].categories

    def test_multiple_categories(self, service):
        results = [{"title": "Money laundering investigation", "snippet": "Probe into laundering of proceeds of crime.", "url": "https://x.com/1", "source_name": "X", "_query_used": "q"}]
        hits = service._classify_results(results)
        cats = hits[0].categories
        assert "money_laundering" in cats
        assert "investigation" in cats

    def test_offshore_category(self, service):
        results = [{"title": "Named in Panama Papers", "snippet": "Links to shell company in tax haven.", "url": "https://x.com/1", "source_name": "X", "_query_used": "q"}]
        hits = service._classify_results(results)
        assert "offshore" in hits[0].categories

    def test_default_general_adverse(self, service):
        results = [{"title": "Nothing matching", "snippet": "Completely unrelated text.", "url": "https://x.com/1", "source_name": "X", "_query_used": "q"}]
        hits = service._classify_results(results)
        assert hits[0].categories == ["general_adverse"]


# ---------------------------------------------------------------------------
# Tests: _sort_and_limit
# ---------------------------------------------------------------------------

class TestSortAndLimit:
    def test_sort_by_severity(self, service):
        hits = [
            AdverseMediaHit(title="Low", snippet="", url="a", source_name="", severity="low", categories=[], query_used="q"),
            AdverseMediaHit(title="High", snippet="", url="b", source_name="", severity="high", categories=[], query_used="q"),
            AdverseMediaHit(title="Medium", snippet="", url="c", source_name="", severity="medium", categories=[], query_used="q"),
        ]
        sorted_hits = service._sort_and_limit(hits, 10)
        assert sorted_hits[0].severity == "high"
        assert sorted_hits[1].severity == "medium"
        assert sorted_hits[2].severity == "low"

    def test_limit_respected(self, service):
        hits = [
            AdverseMediaHit(title=f"Hit {i}", snippet="", url=f"u{i}", source_name="", severity="low", categories=[], query_used="q")
            for i in range(20)
        ]
        sorted_hits = service._sort_and_limit(hits, 5)
        assert len(sorted_hits) == 5


# ---------------------------------------------------------------------------
# Tests: full pipeline with mocked API
# ---------------------------------------------------------------------------

class TestFullPipeline:
    @pytest.mark.asyncio
    async def test_search_returns_valid_response(self, service, sample_request):
        """Full pipeline with mocked Serper calls."""
        call_count = 0

        async def mock_serper(query):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return SERPER_RESULTS_CORRUPTION
            elif call_count == 2:
                return SERPER_RESULTS_INVESTIGATION
            return SERPER_RESULTS_EMPTY

        with patch.object(service, "_call_serper", side_effect=mock_serper):
            response = await service.search(sample_request)

        assert isinstance(response, AdverseMediaResponse)
        assert response.entity_name == "Édouard Philippe"
        assert response.total_hits > 0
        assert response.error is None
        assert response.search_provider == "serper"
        assert len(response.queries_executed) == 5
        # Should have deduplicated the Reuters duplicate
        urls = [h.url for h in response.hits]
        assert len(urls) == len(set(urls))

    @pytest.mark.asyncio
    async def test_search_empty_name_returns_error(self, service):
        req = AdverseMediaRequest(name=" ")
        response = await service.search(req)
        assert response.total_hits == 0
        assert response.error is not None

    @pytest.mark.asyncio
    async def test_search_api_failure_returns_error_response(self, service, sample_request):
        """Service should never crash the caller."""
        async def mock_fail(query):
            raise Exception("API down")

        with patch.object(service, "_call_serper", side_effect=mock_fail):
            response = await service.search(sample_request)

        assert isinstance(response, AdverseMediaResponse)
        assert response.total_hits == 0
        assert response.error is not None
        assert "API down" in response.error

    @pytest.mark.asyncio
    async def test_severity_counts_correct(self, service, sample_request):
        async def mock_serper(query):
            return [
                {"title": "Convicted of fraud", "snippet": "Sentenced.", "url": "https://a.com/1", "source_name": "A", "published_date": "2025-01-01"},
                {"title": "Investigation opened", "snippet": "Probe.", "url": "https://b.com/2", "source_name": "B", "published_date": "2025-02-01"},
                {"title": "Controversy over policy", "snippet": "Questioned.", "url": "https://c.com/3", "source_name": "C", "published_date": "2025-03-01"},
            ]

        # Only return results on the first call to avoid duplicates
        call_count = 0
        async def mock_once(query):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return await mock_serper(query)
            return []

        with patch.object(service, "_call_serper", side_effect=mock_once):
            response = await service.search(sample_request)

        assert response.high_severity_count >= 1
        assert response.medium_severity_count >= 1
        assert response.low_severity_count >= 1


# ---------------------------------------------------------------------------
# Tests: helpers
# ---------------------------------------------------------------------------

class TestHelpers:
    def test_normalize_url_strips_query_params(self):
        assert AdverseMediaService._normalize_url("https://example.com/a?ref=tw") == "https://example.com/a"

    def test_normalize_url_strips_trailing_slash(self):
        assert AdverseMediaService._normalize_url("https://example.com/a/") == "https://example.com/a"

    def test_extract_domain(self):
        assert AdverseMediaService._extract_domain("https://www.reuters.com/article/x") == "reuters.com"

    def test_extract_domain_no_www(self):
        assert AdverseMediaService._extract_domain("https://bbc.co.uk/news") == "bbc.co.uk"
