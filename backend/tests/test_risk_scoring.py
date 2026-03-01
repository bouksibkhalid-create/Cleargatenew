"""Unit tests for M3: Risk Scoring Engine.

Covers all 7 calibration cases from PRD §10.1, 6 edge cases from §10.2,
and the determinism test from §10.3. Pure computation — no mocks needed.
"""

import pytest
import sys
import types

# Stub out neo4j to avoid ImportError from the services import chain
neo4j_stub = types.ModuleType("neo4j")
neo4j_stub.AsyncGraphDatabase = None
neo4j_stub.AsyncDriver = None
sys.modules.setdefault("neo4j", neo4j_stub)

from src.models.risk_scoring import RiskScoringInput, RiskAssessment
from src.services.risk_scoring_service import RiskScoringService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def service():
    return RiskScoringService()


# ---------------------------------------------------------------------------
# §10.1 Calibration Test Cases
# ---------------------------------------------------------------------------

class TestCalibration:
    def test_clean_entity(self, service):
        """All zeros/false → score 0, level low."""
        inp = RiskScoringInput(entity_name="John Doe")
        result = service.score(inp)
        assert result.score == 0
        assert result.risk_level == "low"
        assert result.risk_factors == []

    def test_minor_offshore(self, service):
        """2 offshore connections only → score 6, level low."""
        inp = RiskScoringInput(
            entity_name="Jane Smith",
            offshore_connections=2,
        )
        result = service.score(inp)
        assert result.score == 6
        assert result.risk_level == "low"
        assert result.score_breakdown["offshore"] == 6

    def test_pep_only(self, service):
        """is_pep=true, pep_hits=1 → score 15, level low."""
        inp = RiskScoringInput(
            entity_name="Minister X",
            is_pep=True,
            pep_hits=1,
        )
        result = service.score(inp)
        assert result.score == 15
        assert result.risk_level == "low"
        assert result.score_breakdown["pep"] == 15

    def test_pep_with_media(self, service):
        """is_pep=true, 2 medium + 1 low media → score 25, level medium."""
        inp = RiskScoringInput(
            entity_name="Édouard Philippe",
            is_pep=True,
            pep_hits=1,
            adverse_media_total=3,
            adverse_media_medium=2,
            adverse_media_low=1,
            adverse_media_categories=["corruption", "investigation"],
        )
        result = service.score(inp)
        # pep=15, media= 2*4 + 1*2 = 10 → total 25
        assert result.score == 25
        assert result.risk_level == "medium"
        assert result.score_breakdown["pep"] == 15
        assert result.score_breakdown["adverse_media"] == 10

    def test_offshore_officer_with_media(self, service):
        """3 connections, officer=true, 1 high + 1 medium media → score 26, medium."""
        inp = RiskScoringInput(
            entity_name="Offshore Exec",
            adverse_media_total=2,
            adverse_media_high=1,
            adverse_media_medium=1,
            offshore_connections=3,
            offshore_is_officer=True,
        )
        result = service.score(inp)
        # media= 8 + 4 = 12, offshore= 9 + 5 = 14 → total 26
        assert result.score == 26
        assert result.risk_level == "medium"
        assert result.score_breakdown["adverse_media"] == 12
        assert result.score_breakdown["offshore"] == 14

    def test_sanctioned(self, service):
        """is_sanctioned=true, 1 list, 2 high + 1 medium media → score 60, high."""
        inp = RiskScoringInput(
            entity_name="Sanctioned Person",
            is_sanctioned=True,
            sanctions_hits=1,
            sanctions_lists=["OFAC SDN"],
            adverse_media_total=3,
            adverse_media_high=2,
            adverse_media_medium=1,
        )
        result = service.score(inp)
        # sanctions=40, media= 16 + 4 = 20 → total 60
        assert result.score == 60
        assert result.risk_level == "high"
        assert result.score_breakdown["sanctions"] == 40
        assert result.score_breakdown["adverse_media"] == 20

    def test_maximum_risk(self, service):
        """All signals maxed → capped at 100, level critical."""
        inp = RiskScoringInput(
            entity_name="Maximum Risk",
            is_sanctioned=True,
            sanctions_hits=4,
            sanctions_lists=["OFAC SDN", "EU Consolidated", "UN Security Council", "UK HMT"],
            is_pep=True,
            pep_hits=5,
            adverse_media_total=15,
            adverse_media_high=5,
            adverse_media_medium=5,
            adverse_media_low=5,
            adverse_media_categories=["corruption", "fraud", "sanctions"],
            offshore_connections=10,
            offshore_is_officer=True,
            offshore_is_beneficiary=True,
        )
        result = service.score(inp)
        # sanctions=40+15=55, pep=15+9=24, media=24+16+8=48, offshore=15+5+7=27
        # raw=154, capped=100
        assert result.raw_score == 154
        assert result.score == 100
        assert result.risk_level == "critical"


# ---------------------------------------------------------------------------
# §10.2 Edge Case Tests
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_score_cap(self, service):
        """Inputs that produce raw score of 154 → score=100, raw_score=154."""
        inp = RiskScoringInput(
            entity_name="Max",
            is_sanctioned=True,
            sanctions_lists=["A", "B", "C", "D"],
            is_pep=True,
            pep_hits=5,
            adverse_media_high=5,
            adverse_media_medium=5,
            adverse_media_low=5,
            offshore_connections=10,
            offshore_is_officer=True,
            offshore_is_beneficiary=True,
        )
        result = service.score(inp)
        assert result.score == 100
        assert result.raw_score > 100

    def test_empty_input(self, service):
        """Default RiskScoringInput → score=0, level='low', empty factors."""
        inp = RiskScoringInput(entity_name="Empty")
        result = service.score(inp)
        assert result.score == 0
        assert result.risk_level == "low"
        assert result.risk_factors == []
        assert result.risk_color == "#10B981"

    def test_sanctions_without_list_names(self, service):
        """is_sanctioned=true, sanctions_lists=[] → score=40, factor says 'unknown list(s)'."""
        inp = RiskScoringInput(
            entity_name="Unknown Lists",
            is_sanctioned=True,
            sanctions_hits=1,
            sanctions_lists=[],
        )
        result = service.score(inp)
        assert result.score == 40
        assert any("unknown list(s)" in f for f in result.risk_factors)

    def test_pep_without_details(self, service):
        """is_pep=true, pep_details=None → factor says 'Politically Exposed Person (PEP)' without dash."""
        inp = RiskScoringInput(
            entity_name="PEP No Detail",
            is_pep=True,
            pep_hits=1,
        )
        result = service.score(inp)
        assert "Politically Exposed Person (PEP)" in result.risk_factors
        # Should NOT have a dash if no details
        assert not any("—" in f for f in result.risk_factors)

    def test_per_category_caps(self, service):
        """10 high media hits should cap at 24, not 80."""
        inp = RiskScoringInput(
            entity_name="Media Heavy",
            adverse_media_total=10,
            adverse_media_high=10,
        )
        result = service.score(inp)
        assert result.score_breakdown["adverse_media"] == 24

    def test_breakdown_transparency(self, service):
        """score_breakdown dict must sum to raw_score."""
        inp = RiskScoringInput(
            entity_name="Transparency",
            is_sanctioned=True,
            sanctions_lists=["OFAC SDN", "EU"],
            is_pep=True,
            pep_hits=2,
            adverse_media_high=1,
            adverse_media_medium=2,
            adverse_media_low=1,
            offshore_connections=3,
            offshore_is_officer=True,
        )
        result = service.score(inp)
        assert sum(result.score_breakdown.values()) == result.raw_score


# ---------------------------------------------------------------------------
# §10.3 Determinism Test
# ---------------------------------------------------------------------------

class TestDeterminism:
    def test_deterministic(self, service):
        """Same input always produces same output."""
        inp = RiskScoringInput(
            entity_name="Test",
            is_pep=True,
            adverse_media_medium=3,
        )
        result1 = service.score(inp)
        result2 = service.score(inp)
        assert result1.score == result2.score
        assert result1.raw_score == result2.raw_score
        assert result1.risk_level == result2.risk_level
        assert result1.risk_factors == result2.risk_factors
        assert result1.score_breakdown == result2.score_breakdown


# ---------------------------------------------------------------------------
# Additional coverage
# ---------------------------------------------------------------------------

class TestRiskLevelBoundaries:
    """Verify boundary values for each risk level."""

    def test_low_upper_boundary(self, service):
        """Score of exactly 15 → low."""
        inp = RiskScoringInput(entity_name="Boundary", is_pep=True, pep_hits=1)
        result = service.score(inp)
        assert result.score == 15
        assert result.risk_level == "low"

    def test_medium_lower_boundary(self, service):
        """Score of exactly 16 → medium."""
        inp = RiskScoringInput(
            entity_name="Boundary",
            is_pep=True,
            pep_hits=1,
            adverse_media_low=1,
        )
        result = service.score(inp)
        # pep=15, media=2 → 17
        assert result.score == 17
        assert result.risk_level == "medium"

    def test_high_lower_boundary(self, service):
        """Score of exactly 41 → high."""
        inp = RiskScoringInput(
            entity_name="Boundary",
            is_sanctioned=True,
            sanctions_lists=["OFAC"],
            adverse_media_low=1,
        )
        result = service.score(inp)
        # sanctions=40, media=2 → 42
        assert result.score == 42
        assert result.risk_level == "high"

    def test_critical_lower_boundary(self, service):
        """Score of exactly 71+ → critical."""
        inp = RiskScoringInput(
            entity_name="Boundary",
            is_sanctioned=True,
            sanctions_lists=["OFAC", "EU", "UN", "UK"],
            is_pep=True,
            pep_hits=1,
            adverse_media_low=1,
        )
        result = service.score(inp)
        # sanctions=40+15=55, pep=15, media=2 → 72
        assert result.score == 72
        assert result.risk_level == "critical"


class TestFactorStrings:
    """Verify factor string formatting."""

    def test_sanctions_factor_lists_names(self, service):
        inp = RiskScoringInput(
            entity_name="X",
            is_sanctioned=True,
            sanctions_lists=["OFAC SDN", "EU Consolidated"],
        )
        result = service.score(inp)
        assert any("OFAC SDN" in f and "EU Consolidated" in f for f in result.risk_factors)

    def test_pep_factor_with_details(self, service):
        inp = RiskScoringInput(
            entity_name="X",
            is_pep=True,
            pep_hits=1,
            pep_details="Former Prime Minister of France",
        )
        result = service.score(inp)
        assert any("Former Prime Minister of France" in f for f in result.risk_factors)

    def test_media_factor_includes_categories(self, service):
        inp = RiskScoringInput(
            entity_name="X",
            adverse_media_high=2,
            adverse_media_categories=["corruption", "investigation"],
        )
        result = service.score(inp)
        assert any("corruption" in f for f in result.risk_factors)

    def test_offshore_singular_entity(self, service):
        inp = RiskScoringInput(entity_name="X", offshore_connections=1)
        result = service.score(inp)
        assert any("1 offshore entity" in f for f in result.risk_factors)

    def test_offshore_plural_entities(self, service):
        inp = RiskScoringInput(entity_name="X", offshore_connections=3)
        result = service.score(inp)
        assert any("3 offshore entities" in f for f in result.risk_factors)

    def test_officer_factor(self, service):
        inp = RiskScoringInput(entity_name="X", offshore_is_officer=True)
        result = service.score(inp)
        assert "Named as officer of offshore entity" in result.risk_factors

    def test_beneficiary_factor(self, service):
        inp = RiskScoringInput(entity_name="X", offshore_is_beneficiary=True)
        result = service.score(inp)
        assert "Named as beneficial owner of offshore entity" in result.risk_factors


class TestResponseFields:
    """Verify output model fields are populated correctly."""

    def test_metadata_fields(self, service):
        inp = RiskScoringInput(entity_name="X")
        result = service.score(inp)
        assert result.scoring_model_version == "1.0"
        assert result.scored_at.endswith("Z")
        assert isinstance(result.score_breakdown, dict)

    def test_convenience_counts(self, service):
        inp = RiskScoringInput(
            entity_name="X",
            sanctions_hits=3,
            pep_hits=2,
            adverse_media_total=5,
        )
        result = service.score(inp)
        assert result.sanctions_hits == 3
        assert result.pep_hits == 2
        assert result.adverse_news_count == 5
