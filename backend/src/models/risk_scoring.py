"""Risk scoring data models for M3: Risk Scoring Engine."""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class RiskScoringInput(BaseModel):
    """All intelligence signals for risk calculation."""

    # Entity context
    entity_name: str
    entity_type: str = "individual"

    # Sanctions signals
    is_sanctioned: bool = False
    sanctions_hits: int = 0
    sanctions_lists: List[str] = Field(default_factory=list)

    # PEP signals
    is_pep: bool = False
    pep_hits: int = 0
    pep_details: Optional[str] = None

    # Adverse media signals (from M2)
    adverse_media_total: int = 0
    adverse_media_high: int = 0
    adverse_media_medium: int = 0
    adverse_media_low: int = 0
    adverse_media_categories: List[str] = Field(default_factory=list)

    # Offshore signals
    offshore_connections: int = 0
    offshore_is_officer: bool = False
    offshore_is_beneficiary: bool = False


class RiskAssessment(BaseModel):
    """Complete risk scoring result."""

    # Score
    raw_score: int
    score: int = Field(ge=0, le=100)
    risk_level: str
    risk_color: str

    # Breakdown
    risk_factors: List[str] = Field(default_factory=list)
    score_breakdown: Dict[str, int] = Field(default_factory=dict)

    # Summary counts (convenience fields for frontend)
    sanctions_hits: int = 0
    pep_hits: int = 0
    adverse_news_count: int = 0

    # Metadata
    scoring_model_version: str = "1.0"
    scored_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
