"""Risk Scoring Service — M3: Computes weighted risk scores from multi-source intelligence.

Pure computation — no async, no API calls, no I/O, no external dependencies.
Deterministic: same inputs always produce the same score.
"""

from datetime import datetime
from typing import Dict, List, Tuple

from src.models.risk_scoring import RiskScoringInput, RiskAssessment


class RiskScoringService:
    """Computes weighted risk scores from multi-source intelligence data."""

    # ------------------------------------------------------------------
    # Scoring weights — class-level constants for easy tuning
    # ------------------------------------------------------------------
    SANCTIONS_BASE = 40
    SANCTIONS_ADDITIONAL_PER_LIST = 5
    SANCTIONS_ADDITIONAL_CAP = 15

    PEP_BASE = 15
    PEP_ADDITIONAL_PER_HIT = 3
    PEP_ADDITIONAL_CAP = 9

    MEDIA_HIGH_PER_HIT = 8
    MEDIA_HIGH_CAP = 24
    MEDIA_MEDIUM_PER_HIT = 4
    MEDIA_MEDIUM_CAP = 16
    MEDIA_LOW_PER_HIT = 2
    MEDIA_LOW_CAP = 8

    OFFSHORE_PER_CONNECTION = 3
    OFFSHORE_CONNECTION_CAP = 15
    OFFSHORE_OFFICER_BONUS = 5
    OFFSHORE_BENEFICIARY_BONUS = 7

    # (min_score, max_score, hex_color)
    RISK_THRESHOLDS: Dict[str, Tuple[int, int, str]] = {
        "low": (0, 15, "#10B981"),
        "medium": (16, 40, "#F59E0B"),
        "high": (41, 70, "#EF4444"),
        "critical": (71, 100, "#DC2626"),
    }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def score(self, input_data: RiskScoringInput) -> RiskAssessment:
        """Main entry point. Computes score, level, factors."""
        breakdown = self._calculate_breakdown(input_data)
        raw_score = sum(breakdown.values())
        final_score = min(raw_score, 100)
        risk_level, risk_color = self._classify(final_score)
        risk_factors = self._generate_factors(input_data)

        return RiskAssessment(
            raw_score=raw_score,
            score=final_score,
            risk_level=risk_level,
            risk_color=risk_color,
            risk_factors=risk_factors,
            score_breakdown=breakdown,
            sanctions_hits=input_data.sanctions_hits,
            pep_hits=input_data.pep_hits,
            adverse_news_count=input_data.adverse_media_total,
            scoring_model_version="1.0",
            scored_at=datetime.utcnow().isoformat() + "Z",
        )

    # ------------------------------------------------------------------
    # Breakdown calculation
    # ------------------------------------------------------------------

    def _calculate_breakdown(self, input_data: RiskScoringInput) -> Dict[str, int]:
        """Calculate points per category."""
        breakdown: Dict[str, int] = {}

        # Sanctions
        sanctions_score = 0
        if input_data.is_sanctioned:
            sanctions_score += self.SANCTIONS_BASE
            extra_lists = max(0, len(input_data.sanctions_lists) - 1)
            sanctions_score += min(
                extra_lists * self.SANCTIONS_ADDITIONAL_PER_LIST,
                self.SANCTIONS_ADDITIONAL_CAP,
            )
        breakdown["sanctions"] = sanctions_score

        # PEP
        pep_score = 0
        if input_data.is_pep:
            pep_score += self.PEP_BASE
            extra_hits = max(0, input_data.pep_hits - 1)
            pep_score += min(
                extra_hits * self.PEP_ADDITIONAL_PER_HIT,
                self.PEP_ADDITIONAL_CAP,
            )
        breakdown["pep"] = pep_score

        # Adverse media
        media_score = 0
        media_score += min(
            input_data.adverse_media_high * self.MEDIA_HIGH_PER_HIT,
            self.MEDIA_HIGH_CAP,
        )
        media_score += min(
            input_data.adverse_media_medium * self.MEDIA_MEDIUM_PER_HIT,
            self.MEDIA_MEDIUM_CAP,
        )
        media_score += min(
            input_data.adverse_media_low * self.MEDIA_LOW_PER_HIT,
            self.MEDIA_LOW_CAP,
        )
        breakdown["adverse_media"] = media_score

        # Offshore
        offshore_score = 0
        offshore_score += min(
            input_data.offshore_connections * self.OFFSHORE_PER_CONNECTION,
            self.OFFSHORE_CONNECTION_CAP,
        )
        if input_data.offshore_is_officer:
            offshore_score += self.OFFSHORE_OFFICER_BONUS
        if input_data.offshore_is_beneficiary:
            offshore_score += self.OFFSHORE_BENEFICIARY_BONUS
        breakdown["offshore"] = offshore_score

        return breakdown

    # ------------------------------------------------------------------
    # Classification
    # ------------------------------------------------------------------

    def _classify(self, score: int) -> Tuple[str, str]:
        """Map score to risk level and color."""
        for level, (low, high, color) in self.RISK_THRESHOLDS.items():
            if low <= score <= high:
                return level, color
        return "critical", "#DC2626"

    # ------------------------------------------------------------------
    # Factor generation
    # ------------------------------------------------------------------

    def _generate_factors(self, input_data: RiskScoringInput) -> List[str]:
        """Generate human-readable risk factor strings."""
        factors: List[str] = []

        if input_data.is_sanctioned:
            n = len(input_data.sanctions_lists) or input_data.sanctions_hits or 1
            lists_str = (
                ", ".join(input_data.sanctions_lists)
                if input_data.sanctions_lists
                else "unknown list(s)"
            )
            factors.append(
                f"Active match on {n} sanctions list(s): {lists_str}"
            )

        if input_data.is_pep:
            if input_data.pep_details:
                factors.append(
                    f"Politically Exposed Person (PEP) — {input_data.pep_details}"
                )
            else:
                factors.append("Politically Exposed Person (PEP)")

        if input_data.adverse_media_high > 0:
            cats = (
                ", ".join(input_data.adverse_media_categories[:3])
                if input_data.adverse_media_categories
                else "various concerns"
            )
            factors.append(
                f"{input_data.adverse_media_high} high-severity adverse media hit(s) involving {cats}"
            )

        if input_data.adverse_media_medium > 0:
            factors.append(
                f"{input_data.adverse_media_medium} medium-severity adverse media hit(s)"
            )

        if input_data.adverse_media_low > 0:
            factors.append(
                f"{input_data.adverse_media_low} low-severity adverse media hit(s)"
            )

        if input_data.offshore_connections > 0:
            entity_word = (
                "entity" if input_data.offshore_connections == 1 else "entities"
            )
            factors.append(
                f"Connected to {input_data.offshore_connections} offshore {entity_word} in ICIJ database"
            )

        if input_data.offshore_is_officer:
            factors.append("Named as officer of offshore entity")

        if input_data.offshore_is_beneficiary:
            factors.append("Named as beneficial owner of offshore entity")

        return factors
