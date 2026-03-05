"""Entity Profile data models for M5: Entity Profile Orchestrator & API."""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional
from datetime import datetime


class EntityProfileRequest(BaseModel):
    """Input for generating a complete entity profile."""

    name: str
    entity_type: str = "individual"
    country: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)
    include_ai_analysis: bool = True
    include_adverse_media: bool = True
    max_adverse_media: int = Field(default=10, ge=1, le=50)
    lang: str = "en"  # "en" or "fr" — controls OSINT synthesis language

    @field_validator("name")
    @classmethod
    def name_min_length(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v


class EntityInfo(BaseModel):
    """Core entity identification."""

    name: str
    entity_type: str
    country: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)


class SourceItem(BaseModel):
    """Single source item for the Sources & References list."""

    type: str                                # "news" | "sanctions" | "offshore" | "pep"
    title: str
    snippet: Optional[str] = None
    url: Optional[str] = None
    source_name: Optional[str] = None
    published_date: Optional[str] = None
    severity: Optional[str] = None           # "high" | "medium" | "low" (for news)


class EntityProfile(BaseModel):
    """Complete entity intelligence profile."""

    # === ENTITY ===
    entity: EntityInfo

    # === RISK ===
    risk_score: int = 0
    risk_level: str = "low"
    risk_color: str = "#10B981"
    risk_factors: List[str] = Field(default_factory=list)
    score_breakdown: Dict[str, int] = Field(default_factory=dict)

    # === HIT COUNTS (for summary cards) ===
    sanctions_hits: int = 0
    pep_hits: int = 0
    adverse_news_count: int = 0
    offshore_connections_count: int = 0

    # === AI ANALYSIS ===
    ai_summary: Optional[str] = None
    ai_key_findings: List[str] = Field(default_factory=list)
    ai_recommendation: Optional[str] = None
    ai_model_used: Optional[str] = None
    ai_generation_time_ms: Optional[int] = None

    # === SOURCES & REFERENCES ===
    sources: List[SourceItem] = Field(default_factory=list)

    # === SANCTIONS DETAIL ===
    sanctions_results: List[Dict] = Field(default_factory=list)
    sanctions_lists_matched: List[str] = Field(default_factory=list)
    is_sanctioned: bool = False
    is_pep: bool = False
    pep_details: Optional[str] = None

    # === ADVERSE MEDIA DETAIL ===
    adverse_media_hits: List[Dict] = Field(default_factory=list)
    adverse_media_high: int = 0
    adverse_media_medium: int = 0
    adverse_media_low: int = 0

    # === OFFSHORE DETAIL ===
    offshore_results: List[Dict] = Field(default_factory=list)
    offshore_is_officer: bool = False
    offshore_is_beneficiary: bool = False

    # === CHECK METADATA ===
    check_id: str
    check_status: str = "completed"          # "completed" | "partial" | "failed"
    check_created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    check_duration_ms: int = 0
    sources_succeeded: List[str] = Field(default_factory=list)
    sources_failed: List[str] = Field(default_factory=list)

    # === DORKING RESULTS (F1) ===
    dorking_results: List[Dict] = Field(default_factory=list)
    dorking_flagged_count: int = 0

    # === OSINT DATA (F2) ===
    osint_corporate: List[Dict] = Field(default_factory=list)
    osint_court_records: List[Dict] = Field(default_factory=list)
    osint_gov_filings: List[Dict] = Field(default_factory=list)
    osint_social_profiles: List[Dict] = Field(default_factory=list)

    # === OSINT SYNTHESIS PROFILE (for non-sanctioned entities) ===
    osint_biography: Optional[str] = None
    osint_adverse_summary: Optional[str] = None
    osint_risk_assessment: Optional[str] = None       # "low" | "medium" | "high"
    osint_risk_rationale: Optional[str] = None
    osint_sources_investigated: List[Dict] = Field(default_factory=list)
    osint_synthesis_model: Optional[str] = None
    osint_synthesis_error: Optional[str] = None

    # === PIPELINE METADATA ===
    pipeline_version: str = "2.0"


class CollectionResults:
    """Internal container for parallel collection results."""

    def __init__(
        self,
        sanctions=None,
        offshore=None,
        adverse_media=None,
        dorking=None,
        osint=None,
        errors=None,
    ):
        self.sanctions = sanctions           # dict from _search_sanctions
        self.offshore = offshore             # dict from _search_offshore
        self.adverse_media = adverse_media   # AdverseMediaResponse from M2
        self.dorking = dorking               # DorkingReport from F1
        self.osint = osint                   # OSINTReport from F2
        self.errors = errors or {}           # {source_name: error_message}
