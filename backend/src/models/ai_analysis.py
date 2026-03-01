"""AI Analysis data models for M4: AI Analysis Service."""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class AIAnalysisInput(BaseModel):
    """All data needed for Claude to generate the compliance narrative."""

    # Entity
    entity_name: str
    entity_type: str = "individual"
    country: Optional[str] = None

    # Risk assessment (from M3)
    risk_score: int = 0
    risk_level: str = "low"
    risk_factors: List[str] = Field(default_factory=list)
    score_breakdown: Dict[str, int] = Field(default_factory=dict)

    # Sanctions
    is_sanctioned: bool = False
    sanctions_hits: int = 0
    sanctions_lists: List[str] = Field(default_factory=list)

    # PEP
    is_pep: bool = False
    pep_hits: int = 0
    pep_details: Optional[str] = None

    # Adverse media (from M2)
    adverse_media_total: int = 0
    adverse_media_high: int = 0
    adverse_media_medium: int = 0
    adverse_media_low: int = 0
    adverse_media_hits: List[Dict] = Field(default_factory=list)

    # Offshore
    offshore_connections: int = 0
    offshore_is_officer: bool = False
    offshore_is_beneficiary: bool = False


class AIAnalysisResult(BaseModel):
    """Structured output from Claude's analysis."""

    executive_summary: str
    key_findings: List[str] = Field(default_factory=list)
    recommendation: str

    # Metadata
    model_used: str = "fallback-template-v1"
    tokens_used: int = 0
    generation_time_ms: int = 0
    generated_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    error: Optional[str] = None
