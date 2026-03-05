"""Report data model — the structured intermediate representation between M5 profile and PDF pages."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class CoverStats:
    red_flags_count: int = 0
    entities_analyzed: int = 0
    risk_axes: int = 9
    coverage_label: str = "International"


@dataclass
class SummaryRow:
    """One row in the executive summary comparison table."""
    status: str = ""
    location: str = ""
    sanctions: str = ""
    pep_status: str = ""
    offshore_mentions: str = ""
    offshore_structures: str = ""
    litigation: str = ""
    red_flags_count: int = 0
    overall_risk: str = ""


@dataclass
class IdentityProfile:
    full_name: str = ""
    aliases: List[str] = field(default_factory=list)
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    residence: Optional[str] = None
    title_position: Optional[str] = None
    registration_ids: List[str] = field(default_factory=list)
    education: Optional[str] = None
    family_associates: List[str] = field(default_factory=list)
    affiliations: List[str] = field(default_factory=list)
    career_narrative: Optional[str] = None


@dataclass
class CorporateEntity:
    name: str = ""
    sector: str = ""
    role: str = ""
    country: str = ""
    notes: str = ""


@dataclass
class SectorGroup:
    sector: str = ""
    entities: List[str] = field(default_factory=list)
    observations: str = ""
    has_warning: bool = False


@dataclass
class RedFlag:
    id: int = 0
    title: str = ""
    severity: str = "MEDIUM"   # HIGH | MEDIUM | LOW
    impact: str = "MEDIUM"     # HIGH | MEDIUM | LOW
    probability: str = "MEDIUM"  # HIGH | MEDIUM | LOW
    year: Optional[str] = None
    description: str = ""
    sources: List[str] = field(default_factory=list)


@dataclass
class ControversyEvent:
    year: str = ""
    event: str = ""
    impact: str = ""


@dataclass
class SynthesisRow:
    axis: str = ""
    positive_points: str = ""
    red_flags_vigilance: str = ""


@dataclass
class RecommendationAction:
    number: int = 0
    title: str = ""
    description: str = ""


@dataclass
class ReportData:
    """Complete report data model — all pages draw from this."""

    # --- Metadata ---
    reference_number: str = ""
    report_date: str = ""
    classification: str = "CONFIDENTIEL"
    client_name: str = ""
    language: str = "fr"

    # --- Cover ---
    subject_name: str = ""
    entity_name: str = ""
    entity_type: str = "individual"
    location: str = ""
    screening_summary: str = ""
    stats: CoverStats = field(default_factory=CoverStats)

    # --- Executive Summary ---
    overall_risk_level: str = "GREEN"  # GREEN | ORANGE | RED
    risk_score: int = 0
    risk_recommendation: str = ""
    investigation_context: str = ""
    subject_summary: Optional[SummaryRow] = None
    entity_summary: Optional[SummaryRow] = None

    # --- Identity ---
    identity: IdentityProfile = field(default_factory=IdentityProfile)

    # --- Corporate ---
    corporate_entities: List[CorporateEntity] = field(default_factory=list)
    sector_breakdown: List[SectorGroup] = field(default_factory=list)
    financial_attention_points: List[str] = field(default_factory=list)

    # --- Red Flags ---
    red_flags: List[RedFlag] = field(default_factory=list)

    # --- Risk Assessment ---
    risk_by_domain: Dict[str, str] = field(default_factory=dict)

    # --- Reputation ---
    positive_coverage: str = ""
    controversy_timeline: List[ControversyEvent] = field(default_factory=list)
    media_warnings: List[str] = field(default_factory=list)
    favorable_sources: List[str] = field(default_factory=list)

    # --- Synthesis ---
    synthesis_table: List[SynthesisRow] = field(default_factory=list)

    # --- Recommendation ---
    recommendation_actions: List[RecommendationAction] = field(default_factory=list)

    # --- Shadow Zones ---
    shadow_zones: List[str] = field(default_factory=list)

    # --- Raw profile (for fallback access) ---
    raw_sanctions_results: List[Dict] = field(default_factory=list)
    raw_offshore_results: List[Dict] = field(default_factory=list)
    raw_adverse_media: List[Dict] = field(default_factory=list)
    score_breakdown: Dict[str, int] = field(default_factory=dict)

    # --- F1: Dorking results ---
    dorking_results: List[Dict] = field(default_factory=list)
    dorking_flagged: List[Dict] = field(default_factory=list)

    # --- F2: OSINT data ---
    osint_corporate: List[Dict] = field(default_factory=list)
    osint_court_records: List[Dict] = field(default_factory=list)
    osint_gov_filings: List[Dict] = field(default_factory=list)
    osint_social_profiles: List[Dict] = field(default_factory=list)

    # --- OSINT Synthesis (non-sanctioned entities) ---
    is_sanctioned: bool = False
    osint_biography: Optional[str] = None
    osint_adverse_summary: Optional[str] = None
    osint_risk_assessment: Optional[str] = None
    osint_risk_rationale: Optional[str] = None
    osint_sources_investigated: List[Dict] = field(default_factory=list)
