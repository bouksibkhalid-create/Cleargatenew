"""Unit tests for M4: AI Analysis Service.

All tests use mocked API responses — no real Claude calls.
"""

import json
import pytest
import sys
import types
from unittest.mock import AsyncMock, patch, MagicMock

# Stub out neo4j to avoid ImportError from the services import chain
neo4j_stub = types.ModuleType("neo4j")
neo4j_stub.AsyncGraphDatabase = None
neo4j_stub.AsyncDriver = None
sys.modules.setdefault("neo4j", neo4j_stub)

from src.models.ai_analysis import AIAnalysisInput, AIAnalysisResult
from src.services.ai_analysis_service import AIAnalysisService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def settings_with_key():
    """Settings mock with API key configured."""
    s = MagicMock()
    s.ANTHROPIC_API_KEY = "test-anthropic-key"
    s.AI_ANALYSIS_MODEL = "claude-sonnet-4-20250514"
    s.AI_ANALYSIS_MAX_TOKENS = 1024
    s.AI_ANALYSIS_TIMEOUT = 30.0
    return s


@pytest.fixture
def settings_no_key():
    """Settings mock with no API key (disabled)."""
    s = MagicMock()
    s.ANTHROPIC_API_KEY = None
    s.AI_ANALYSIS_MODEL = "claude-sonnet-4-20250514"
    s.AI_ANALYSIS_MAX_TOKENS = 1024
    s.AI_ANALYSIS_TIMEOUT = 30.0
    return s


@pytest.fixture
def service(settings_with_key):
    return AIAnalysisService(settings=settings_with_key)


@pytest.fixture
def disabled_service(settings_no_key):
    return AIAnalysisService(settings=settings_no_key)


@pytest.fixture
def philippe_input():
    """Édouard Philippe-like input for testing."""
    return AIAnalysisInput(
        entity_name="Édouard Philippe",
        entity_type="individual",
        country="France",
        risk_score=35,
        risk_level="medium",
        risk_factors=[
            "Politically Exposed Person (PEP) — Former Prime Minister of France",
            "3 medium-severity adverse media hits",
        ],
        score_breakdown={"sanctions": 0, "pep": 15, "adverse_media": 12, "offshore": 0},
        is_pep=True,
        pep_hits=1,
        pep_details="Former Prime Minister of France",
        adverse_media_total=3,
        adverse_media_medium=3,
        adverse_media_hits=[
            {
                "title": "Former French PM Philippe's mayoral office searched in corruption probe",
                "snippet": "Former French Prime Minister Edouard Philippe's office was searched...",
                "source_name": "Reuters",
                "published_date": "2024-11-15",
                "severity": "medium",
                "categories": ["corruption", "investigation"],
            },
            {
                "title": "Former French PM's City Hall Searched in Favoritism Case",
                "snippet": "Police searched the Le Havre city hall run by former French PM...",
                "source_name": "AP News",
                "published_date": "2024-11-15",
                "severity": "medium",
                "categories": ["investigation"],
            },
            {
                "title": "Édouard Philippe targeted by a new complaint for embezzlement",
                "snippet": "A second complaint was filed against Édouard Philippe...",
                "source_name": "Le Monde",
                "published_date": "2024-12-01",
                "severity": "medium",
                "categories": ["corruption"],
            },
        ],
    )


@pytest.fixture
def sanctioned_input():
    return AIAnalysisInput(
        entity_name="Sanctioned Corp",
        entity_type="organization",
        risk_score=75,
        risk_level="critical",
        risk_factors=[
            "Active match on 2 sanctions list(s): OFAC SDN, EU Consolidated",
            "2 high-severity adverse media hits involving fraud",
        ],
        score_breakdown={"sanctions": 45, "pep": 0, "adverse_media": 20, "offshore": 10},
        is_sanctioned=True,
        sanctions_hits=2,
        sanctions_lists=["OFAC SDN", "EU Consolidated"],
        adverse_media_total=2,
        adverse_media_high=2,
        offshore_connections=3,
        offshore_is_officer=True,
    )


@pytest.fixture
def clean_input():
    return AIAnalysisInput(
        entity_name="Clean Person",
        entity_type="individual",
        risk_score=0,
        risk_level="low",
    )


# Mock Claude response (valid JSON)
MOCK_CLAUDE_RESPONSE = {
    "executive_summary": (
        "Édouard Philippe, a former Prime Minister of France, presents a medium risk score of 35/100. "
        "He is classified as a Politically Exposed Person (PEP) due to his significant political roles "
        "but has no hits on sanctions lists. However, he has three instances of negative news associated "
        "with allegations of corruption and financial misconduct, including a preliminary investigation "
        "involving influence peddling and misappropriation of public funds. Philippe has publicly committed "
        "to cooperating with ongoing investigations. These factors require ongoing monitoring in accordance "
        "with compliance protocols."
    ),
    "key_findings": [
        "No matches found on any active sanctions lists (OFAC, EU, UN).",
        "Classified as Politically Exposed Person — Former Prime Minister of France.",
        "Three medium-severity adverse media hits related to corruption investigations.",
        "Mayoral office in Le Havre searched as part of corruption probe (Reuters, Nov 2024).",
        "No offshore connections identified in ICIJ database.",
    ],
    "recommendation": "Enhanced due diligence is recommended given the PEP status and adverse media findings.",
}


def _make_httpx_response(json_body, status_code=200):
    """Create a mock httpx.Response."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.raise_for_status = MagicMock()
    if status_code >= 400:
        mock_resp.raise_for_status.side_effect = Exception(f"HTTP {status_code}")
    mock_resp.json.return_value = json_body
    return mock_resp


# ---------------------------------------------------------------------------
# Tests: _build_system_prompt
# ---------------------------------------------------------------------------

class TestBuildSystemPrompt:
    def test_system_prompt_content(self, service):
        prompt = service._build_system_prompt()
        assert isinstance(prompt, str)
        assert len(prompt) > 100
        assert "KYC/AML" in prompt
        assert "JSON" in prompt
        assert "executive_summary" in prompt
        assert "key_findings" in prompt
        assert "recommendation" in prompt


# ---------------------------------------------------------------------------
# Tests: _build_user_prompt
# ---------------------------------------------------------------------------

class TestBuildUserPrompt:
    def test_individual_prompt(self, service, philippe_input):
        prompt = service._build_user_prompt(philippe_input)
        assert "Édouard Philippe" in prompt
        assert "35/100" in prompt
        assert "medium" in prompt
        assert "ENTITY INFORMATION" in prompt
        assert "RISK ASSESSMENT" in prompt
        assert "SANCTIONS SCREENING" in prompt
        assert "PEP STATUS" in prompt
        assert "ADVERSE MEDIA" in prompt
        assert "OFFSHORE CONNECTIONS" in prompt

    def test_organization_prompt(self, service, sanctioned_input):
        prompt = service._build_user_prompt(sanctioned_input)
        assert "Sanctioned Corp" in prompt
        assert "organization" in prompt
        assert "OFAC SDN" in prompt

    def test_prompt_with_media_articles(self, service, philippe_input):
        prompt = service._build_user_prompt(philippe_input)
        assert "Reuters" in prompt
        assert "corruption probe" in prompt
        assert "[MEDIUM]" in prompt

    def test_clean_entity_prompt(self, service, clean_input):
        prompt = service._build_user_prompt(clean_input)
        assert "Clean Person" in prompt
        assert "0/100" in prompt
        assert "None" in prompt  # sanctions lists, PEP details


# ---------------------------------------------------------------------------
# Tests: _parse_response
# ---------------------------------------------------------------------------

class TestParseResponse:
    def test_parse_clean_json(self, service):
        text = json.dumps(MOCK_CLAUDE_RESPONSE)
        parsed = service._parse_response(text)
        assert parsed["executive_summary"] == MOCK_CLAUDE_RESPONSE["executive_summary"]
        assert parsed["key_findings"] == MOCK_CLAUDE_RESPONSE["key_findings"]

    def test_parse_fenced_json(self, service):
        text = "```json\n" + json.dumps(MOCK_CLAUDE_RESPONSE) + "\n```"
        parsed = service._parse_response(text)
        assert parsed["executive_summary"] == MOCK_CLAUDE_RESPONSE["executive_summary"]

    def test_parse_json_with_preamble(self, service):
        text = "Here is the analysis:\n" + json.dumps(MOCK_CLAUDE_RESPONSE)
        parsed = service._parse_response(text)
        assert parsed["executive_summary"] == MOCK_CLAUDE_RESPONSE["executive_summary"]

    def test_parse_fenced_no_lang(self, service):
        text = "```\n" + json.dumps(MOCK_CLAUDE_RESPONSE) + "\n```"
        parsed = service._parse_response(text)
        assert parsed["executive_summary"] == MOCK_CLAUDE_RESPONSE["executive_summary"]

    def test_parse_invalid_json(self, service):
        with pytest.raises(ValueError, match="Could not parse"):
            service._parse_response("This is not JSON at all, no braces here")


# ---------------------------------------------------------------------------
# Tests: _validate_parsed
# ---------------------------------------------------------------------------

class TestValidateParsed:
    def test_valid_response(self, service):
        result = service._validate_parsed(MOCK_CLAUDE_RESPONSE)
        assert result == MOCK_CLAUDE_RESPONSE

    def test_missing_summary(self, service):
        with pytest.raises(ValueError, match="executive_summary"):
            service._validate_parsed({"key_findings": ["a"], "recommendation": "b"})

    def test_missing_findings(self, service):
        with pytest.raises(ValueError, match="key_findings"):
            service._validate_parsed({"executive_summary": "a" * 60, "recommendation": "b"})

    def test_summary_too_short(self, service):
        with pytest.raises(ValueError, match="too short"):
            service._validate_parsed({
                "executive_summary": "Short.",
                "key_findings": ["a"],
                "recommendation": "b",
            })

    def test_empty_findings(self, service):
        with pytest.raises(ValueError, match="No findings"):
            service._validate_parsed({
                "executive_summary": "a" * 60,
                "key_findings": [],
                "recommendation": "b",
            })


# ---------------------------------------------------------------------------
# Tests: _fallback
# ---------------------------------------------------------------------------

class TestFallback:
    def test_fallback_sanctioned_entity(self, service, sanctioned_input):
        result = service._fallback(sanctioned_input)
        assert isinstance(result, AIAnalysisResult)
        assert "Sanctioned Corp" in result.executive_summary
        assert "OFAC SDN" in result.executive_summary
        assert "escalation" in result.recommendation.lower()
        assert result.model_used == "fallback-template-v1"
        assert result.tokens_used == 0

    def test_fallback_pep_entity(self, service, philippe_input):
        result = service._fallback(philippe_input)
        assert "Politically Exposed Person" in result.executive_summary
        assert "Former Prime Minister of France" in result.executive_summary
        assert "enhanced due diligence" in result.recommendation.lower()

    def test_fallback_clean_entity(self, service, clean_input):
        result = service._fallback(clean_input)
        assert "No matches" in result.executive_summary
        assert "standard monitoring" in result.recommendation.lower()
        assert result.key_findings == ["No significant risk indicators identified."]

    def test_fallback_with_offshore(self, service):
        inp = AIAnalysisInput(
            entity_name="Offshore Person",
            risk_score=20,
            risk_level="medium",
            offshore_connections=5,
        )
        result = service._fallback(inp)
        assert "5 connection(s)" in result.executive_summary
        assert "ICIJ" in result.executive_summary

    def test_fallback_with_media(self, service):
        inp = AIAnalysisInput(
            entity_name="Media Person",
            risk_score=30,
            risk_level="medium",
            adverse_media_total=4,
            adverse_media_high=1,
            adverse_media_medium=2,
            adverse_media_low=1,
        )
        result = service._fallback(inp)
        assert "4 adverse media" in result.executive_summary
        assert "1 high severity" in result.executive_summary


# ---------------------------------------------------------------------------
# Tests: disabled service
# ---------------------------------------------------------------------------

class TestDisabledService:
    @pytest.mark.asyncio
    async def test_disabled_returns_fallback_immediately(self, disabled_service, philippe_input):
        """When api_key is None, analyze() returns fallback immediately, no API call."""
        result = await disabled_service.analyze(philippe_input)
        assert isinstance(result, AIAnalysisResult)
        assert result.model_used == "fallback-template-v1"
        assert result.error is None
        assert "Édouard Philippe" in result.executive_summary


# ---------------------------------------------------------------------------
# Tests: full pipeline with mocked Claude API
# ---------------------------------------------------------------------------

class TestFullPipeline:
    @pytest.mark.asyncio
    async def test_successful_claude_call(self, service, philippe_input):
        """Mocked Claude API returns valid JSON → parsed into AIAnalysisResult."""
        mock_api_response = {
            "content": [{"text": json.dumps(MOCK_CLAUDE_RESPONSE)}],
            "usage": {"input_tokens": 800, "output_tokens": 400},
        }

        mock_resp = _make_httpx_response(mock_api_response)

        async def mock_post(*args, **kwargs):
            return mock_resp

        mock_client = MagicMock()
        mock_client.post = mock_post
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("src.services.ai_analysis_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.analyze(philippe_input)

        assert isinstance(result, AIAnalysisResult)
        assert result.error is None
        assert "Philippe" in result.executive_summary
        assert len(result.key_findings) >= 3
        assert result.model_used == "claude-sonnet-4-20250514"
        assert result.tokens_used == 1200
        assert result.generation_time_ms >= 0

    @pytest.mark.asyncio
    async def test_api_failure_uses_fallback(self, service, philippe_input):
        """When _call_claude raises, analyze() returns fallback with error field."""
        async def mock_fail(*args, **kwargs):
            raise Exception("API down")

        with patch.object(service, "_call_claude", side_effect=mock_fail):
            result = await service.analyze(philippe_input)

        assert isinstance(result, AIAnalysisResult)
        assert result.model_used == "fallback-template-v1"
        assert result.error is not None
        assert "API down" in result.error
        assert "Édouard Philippe" in result.executive_summary

    @pytest.mark.asyncio
    async def test_malformed_claude_response_uses_fallback(self, service, philippe_input):
        """Claude returns non-JSON → parse fails → fallback."""
        mock_api_response = {
            "content": [{"text": "I cannot generate that analysis."}],
            "usage": {"input_tokens": 500, "output_tokens": 20},
        }

        mock_resp = _make_httpx_response(mock_api_response)

        async def mock_post(*args, **kwargs):
            return mock_resp

        mock_client = MagicMock()
        mock_client.post = mock_post
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("src.services.ai_analysis_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.analyze(philippe_input)

        assert isinstance(result, AIAnalysisResult)
        assert result.error is not None
        assert result.model_used == "fallback-template-v1"


# ---------------------------------------------------------------------------
# Tests: format helpers
# ---------------------------------------------------------------------------

class TestFormatHelpers:
    def test_format_risk_factors_empty(self, service):
        assert service._format_risk_factors([]) == "  None"

    def test_format_risk_factors_populated(self, service):
        factors = ["Factor A", "Factor B"]
        result = service._format_risk_factors(factors)
        assert "  - Factor A" in result
        assert "  - Factor B" in result

    def test_format_media_articles_empty(self, service):
        assert service._format_media_articles([]) == "  None"

    def test_format_media_articles_formatted(self, service):
        hits = [
            {
                "title": "Test Article",
                "snippet": "A test snippet.",
                "source_name": "Reuters",
                "published_date": "2024-11-15",
                "severity": "high",
            },
        ]
        result = service._format_media_articles(hits)
        assert "[HIGH]" in result
        assert "Test Article" in result
        assert "Reuters" in result
        assert "A test snippet." in result

    def test_format_media_articles_limits(self, service):
        hits = [
            {"title": f"Article {i}", "snippet": "S", "source_name": "X", "severity": "low"}
            for i in range(20)
        ]
        result = service._format_media_articles(hits, limit=5)
        # Should only include 5 articles
        assert result.count("[LOW]") == 5

    def test_format_media_sorts_by_severity(self, service):
        hits = [
            {"title": "Low article", "snippet": "", "source_name": "X", "severity": "low"},
            {"title": "High article", "snippet": "", "source_name": "X", "severity": "high"},
            {"title": "Medium article", "snippet": "", "source_name": "X", "severity": "medium"},
        ]
        result = service._format_media_articles(hits)
        high_pos = result.index("[HIGH]")
        medium_pos = result.index("[MEDIUM]")
        low_pos = result.index("[LOW]")
        assert high_pos < medium_pos < low_pos
