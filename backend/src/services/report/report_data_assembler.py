"""ReportDataAssembler — transforms an M5 EntityProfile into the ReportData model for PDF rendering.

This is the bridge between the backend intelligence pipeline and the PDF report generator.
All data mapping, enrichment, and fallback logic lives here.
"""

import hashlib
from datetime import datetime
from typing import Dict, List, Optional

from ..entity_profile_orchestrator import EntityProfile
from .report_data import (
    CoverStats,
    ControversyEvent,
    CorporateEntity,
    IdentityProfile,
    RecommendationAction,
    RedFlag,
    ReportData,
    SectorGroup,
    SummaryRow,
    SynthesisRow,
)


def _generate_reference(entity_name: str) -> str:
    """Auto-generate a reference number: TF-CG-{YEAR}-{HASH}-{SEQ}."""
    year = datetime.utcnow().strftime("%Y")
    short = hashlib.md5(entity_name.encode()).hexdigest()[:6].upper()
    return f"TF-CG-{year}-{short}-001"


def _risk_level_to_verdict(risk_level: str, risk_score: int) -> str:
    """Map M5 risk_level to report verdict (GREEN/ORANGE/RED)."""
    rl = risk_level.lower()
    if rl in ("critical", "high") or risk_score >= 70:
        return "RED"
    if rl == "medium" or risk_score >= 40:
        return "ORANGE"
    return "GREEN"


def _score_to_domain_level(score: int) -> str:
    """Convert a 0-100 score to a domain risk level string."""
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium-high"
    if score >= 25:
        return "medium"
    return "low"


def _build_identity(profile: EntityProfile) -> IdentityProfile:
    """Extract identity info from the profile, enriched with F2 social data."""
    affiliations: List[str] = []
    for sp in getattr(profile, "osint_social_profiles", []):
        platform = sp.get("platform", "")
        name = sp.get("display_name", "")
        if platform and name:
            affiliations.append(f"{platform.capitalize()}: {name}")

    return IdentityProfile(
        full_name=profile.entity.name,
        aliases=profile.entity.aliases or [],
        nationality=profile.entity.country,
        residence=profile.entity.country,
        title_position=profile.entity.entity_type.capitalize(),
        affiliations=affiliations,
    )


def _build_subject_summary(profile: EntityProfile) -> SummaryRow:
    """Build the comparison table row for the subject."""
    return SummaryRow(
        status=f"{profile.entity.entity_type.capitalize()} — Active",
        location=profile.entity.country or "Unknown",
        sanctions="FOUND" if profile.is_sanctioned else "NOT FOUND",
        pep_status="PEP" if profile.is_pep else "NOT PEP",
        offshore_mentions="MENTION" if profile.offshore_results else "NONE",
        offshore_structures="IDENTIFIED" if profile.offshore_is_officer or profile.offshore_is_beneficiary else "NONE",
        litigation="—",
        red_flags_count=len(profile.risk_factors),
        overall_risk=profile.risk_level.upper(),
    )


def _build_red_flags(profile: EntityProfile) -> List[RedFlag]:
    """Convert risk_factors + adverse media + dorking + court records into structured RedFlag entries."""
    flags: List[RedFlag] = []
    idx = 1

    # From risk_factors (M3)
    for factor in profile.risk_factors:
        severity = "HIGH" if any(kw in factor.lower() for kw in ["sanction", "critical", "pep", "terrorism"]) \
            else "MEDIUM" if any(kw in factor.lower() for kw in ["offshore", "media", "adverse", "risk"]) \
            else "LOW"
        flags.append(RedFlag(
            id=idx,
            title=factor,
            severity=severity,
            impact=severity,
            probability="HIGH" if severity == "HIGH" else "MEDIUM",
            description=factor,
            sources=["ClearGate Risk Engine"],
        ))
        idx += 1

    # From adverse media hits
    for hit in profile.adverse_media_hits[:5]:
        sev = (hit.get("severity", "medium") or "medium").upper()
        flags.append(RedFlag(
            id=idx,
            title=hit.get("title", "Adverse Media Finding"),
            severity=sev,
            impact=sev,
            probability="MEDIUM",
            year=hit.get("published_date", "")[:4] if hit.get("published_date") else None,
            description=hit.get("snippet", ""),
            sources=[hit.get("source_name", "Media")],
        ))
        idx += 1

    # From F1 dorking flagged results
    for dr in getattr(profile, "dorking_results", []):
        if not dr.get("is_flagged"):
            continue
        flags.append(RedFlag(
            id=idx,
            title=dr.get("title", "Dorking Finding"),
            severity="MEDIUM",
            impact="MEDIUM",
            probability="MEDIUM",
            description=dr.get("flag_reason", dr.get("snippet", "")),
            sources=[dr.get("domain", "Google Dorking")],
        ))
        idx += 1

    # From F2 court records
    for cr in getattr(profile, "osint_court_records", []):
        sev = (cr.get("severity", "MEDIUM") or "MEDIUM").upper()
        flags.append(RedFlag(
            id=idx,
            title=cr.get("case_title", "Court Record"),
            severity=sev,
            impact=sev,
            probability="HIGH" if sev == "HIGH" else "MEDIUM",
            description=cr.get("summary", ""),
            sources=[cr.get("court_name") or cr.get("source", "Court Records")],
        ))
        idx += 1

    # From F2 adverse gov filings
    for gf in getattr(profile, "osint_gov_filings", []):
        if not gf.get("is_adverse"):
            continue
        flags.append(RedFlag(
            id=idx,
            title=gf.get("filing_title", "Regulatory Filing"),
            severity="HIGH",
            impact="HIGH",
            probability="HIGH",
            description=gf.get("summary", ""),
            sources=[gf.get("regulator", "Government")],
        ))
        idx += 1

    # Sort: HIGH first, then MEDIUM, then LOW
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    flags.sort(key=lambda f: order.get(f.severity, 2))

    # Re-number after sort
    for i, f in enumerate(flags, 1):
        f.id = i

    return flags


def _build_risk_by_domain(profile: EntityProfile) -> Dict[str, str]:
    """Map score_breakdown to domain risk levels."""
    breakdown = profile.score_breakdown or {}
    domains = {
        "sanctions_pep": breakdown.get("sanctions", 0) + breakdown.get("pep", 0),
        "offshore": breakdown.get("offshore", 0),
        "governance": min(breakdown.get("offshore", 0) + 10, 100),
        "compliance": breakdown.get("adverse_media", 0),
        "reputation": breakdown.get("adverse_media", 0),
        "financial": breakdown.get("offshore", 0),
        "integrity": int(profile.risk_score * 0.6),
        "geopolitical": breakdown.get("geographic", breakdown.get("country_risk", 0)),
    }
    return {k: _score_to_domain_level(v) for k, v in domains.items()}


def _build_controversy_timeline(profile: EntityProfile) -> List[ControversyEvent]:
    """Build timeline from adverse media + F1 dorking news results."""
    events: List[ControversyEvent] = []

    for hit in profile.adverse_media_hits:
        year = (hit.get("published_date", "") or "")[:4]
        if not year:
            year = "N/A"
        events.append(ControversyEvent(
            year=year,
            event=hit.get("title", "—"),
            impact=(hit.get("severity", "medium") or "medium").capitalize(),
        ))

    # Add dorking news_investigations results
    for dr in getattr(profile, "dorking_results", []):
        if dr.get("category") != "news_investigations":
            continue
        year = (dr.get("date_published", "") or "")[:4] or "N/A"
        events.append(ControversyEvent(
            year=year,
            event=dr.get("title", "—"),
            impact="Medium",
        ))

    return events


def _build_sector_breakdown(profile: EntityProfile) -> List[SectorGroup]:
    """Build sector groups from offshore results + F2 osint_corporate."""
    sectors: Dict[str, List[str]] = {}

    # From offshore results
    for result in (profile.offshore_results or []):
        node_type = result.get("node_type", "Offshore")
        name = result.get("name", "Unknown")
        sectors.setdefault(node_type, []).append(name)

    # From F2 osint_corporate
    for corp in getattr(profile, "osint_corporate", []):
        jurisdiction = corp.get("jurisdiction", "Other")
        name = corp.get("company_name", "Unknown")
        role = corp.get("role", "")
        label = f"{name} ({role})" if role else name
        sectors.setdefault(jurisdiction, []).append(label)

    if not sectors:
        return []

    return [
        SectorGroup(
            sector=sector,
            entities=names[:5],
            observations=f"{len(names)} entities identified",
            has_warning=len(names) > 3,
        )
        for sector, names in sectors.items()
    ]


def _build_synthesis(profile: EntityProfile) -> List[SynthesisRow]:
    """Build synthesis table from available data."""
    rows: List[SynthesisRow] = []

    # Sanctions / PEP
    rows.append(SynthesisRow(
        axis="Sanctions / PEP",
        positive_points="No active sanctions" if not profile.is_sanctioned else "Listed on international watch lists",
        red_flags_vigilance=f"{profile.sanctions_hits} sanctions hits found" if profile.sanctions_hits else "Clear",
    ))

    # Offshore
    rows.append(SynthesisRow(
        axis="Offshore",
        positive_points="No offshore structures identified" if not profile.offshore_results else f"{len(profile.offshore_results)} connections found",
        red_flags_vigilance="Officer/Beneficiary role detected" if (profile.offshore_is_officer or profile.offshore_is_beneficiary) else "No concerning roles",
    ))

    # Reputation
    rows.append(SynthesisRow(
        axis="Reputation",
        positive_points="No significant adverse media" if profile.adverse_news_count == 0 else f"{profile.adverse_news_count} media mentions",
        red_flags_vigilance=f"{profile.adverse_media_high} high-severity findings" if profile.adverse_media_high else "No high-severity findings",
    ))

    # Integrity
    rows.append(SynthesisRow(
        axis="Personal Integrity",
        positive_points="Profile consistent with public records",
        red_flags_vigilance=f"{len(profile.risk_factors)} risk factors identified" if profile.risk_factors else "No risk factors",
    ))

    return rows


def _build_recommendations(profile: EntityProfile) -> List[RecommendationAction]:
    """Build recommendation actions from AI analysis or template-based."""
    actions: List[RecommendationAction] = []

    if profile.ai_recommendation:
        actions.append(RecommendationAction(
            number=1,
            title="Primary Recommendation",
            description=profile.ai_recommendation,
        ))

    # Template-based recommendations based on risk
    if profile.is_sanctioned:
        actions.append(RecommendationAction(
            number=len(actions) + 1,
            title="Sanctions Compliance Review",
            description="Immediately escalate to the compliance team for sanctions review. Verify all matches against source lists and assess potential exposure. Consider blocking or restricting transactions pending review.",
        ))

    if profile.is_pep:
        actions.append(RecommendationAction(
            number=len(actions) + 1,
            title="Enhanced PEP Due Diligence",
            description="Apply enhanced due diligence procedures for politically exposed persons. Verify source of funds and wealth, establish purpose of business relationship, and implement ongoing monitoring.",
        ))

    if profile.offshore_results:
        actions.append(RecommendationAction(
            number=len(actions) + 1,
            title="Offshore Structure Analysis",
            description="Investigate identified offshore connections for beneficial ownership transparency. Cross-reference with UBO registers and assess jurisdictional risk of identified structures.",
        ))

    if profile.adverse_media_high > 0:
        actions.append(RecommendationAction(
            number=len(actions) + 1,
            title="Adverse Media Deep Dive",
            description="Conduct detailed review of high-severity media findings. Verify claims against primary sources, assess materiality and recency, and document conclusions for the compliance record.",
        ))

    # Default if nothing else
    if not actions:
        actions.append(RecommendationAction(
            number=1,
            title="Standard Monitoring",
            description="No significant risk indicators identified. Recommend standard periodic screening and monitoring per established compliance procedures.",
        ))

    return actions


def _build_shadow_zones(profile: EntityProfile) -> List[str]:
    """Identify data gaps and unresolved items."""
    zones: List[str] = []

    if "adverse_media" in profile.sources_failed:
        zones.append("Adverse media search was unavailable — media risk may be underestimated.")
    if "sanctions" in profile.sources_failed:
        zones.append("Sanctions screening encountered errors — results may be incomplete.")
    if "offshore" in profile.sources_failed:
        zones.append("Offshore leaks database was unreachable — offshore connections not verified.")
    if "dorking" in profile.sources_failed:
        zones.append("Google dorking was unavailable — deep web findings may be incomplete.")
    if "osint" in profile.sources_failed:
        zones.append("OSINT collection partially failed — some intelligence sources not covered.")
    if not profile.ai_summary:
        zones.append("AI analysis was not available — narrative sections use template-based assessment.")
    if profile.entity.entity_type == "individual" and not profile.entity.country:
        zones.append("Country of residence/nationality not specified — geographic risk assessment may be inaccurate.")
    if not getattr(profile, "osint_corporate", []):
        zones.append("No corporate registry data found — corporate structure analysis limited.")

    return zones


def assemble_report_data(
    profile: EntityProfile,
    language: str = "fr",
    client_name: str = "",
    classification: str = "CONFIDENTIEL",
) -> ReportData:
    """Transform an M5 EntityProfile into a complete ReportData for PDF generation."""
    red_flags = _build_red_flags(profile)
    risk_verdict = _risk_level_to_verdict(profile.risk_level, profile.risk_score)

    return ReportData(
        # Metadata
        reference_number=_generate_reference(profile.entity.name),
        report_date=datetime.utcnow().strftime("%d/%m/%Y"),
        classification=classification,
        client_name=client_name,
        language=language,

        # Cover
        subject_name=profile.entity.name,
        entity_name="",
        entity_type=profile.entity.entity_type,
        location=profile.entity.country or "",
        screening_summary=f"Comprehensive screening across {len(profile.sources_succeeded)} data sources",
        stats=CoverStats(
            red_flags_count=len(red_flags),
            entities_analyzed=len(profile.sanctions_results) + len(profile.offshore_results),
            risk_axes=9,
            coverage_label="International",
        ),

        # Executive Summary
        overall_risk_level=risk_verdict,
        risk_score=profile.risk_score,
        risk_recommendation=profile.ai_recommendation or "",
        investigation_context=profile.ai_summary or "",
        subject_summary=_build_subject_summary(profile),

        # Identity
        identity=_build_identity(profile),

        # Corporate
        sector_breakdown=_build_sector_breakdown(profile),

        # Red Flags
        red_flags=red_flags,

        # Risk Assessment
        risk_by_domain=_build_risk_by_domain(profile),

        # Reputation
        controversy_timeline=_build_controversy_timeline(profile),
        media_warnings=[f"High severity: {h.get('title', '')}" for h in profile.adverse_media_hits if (h.get("severity") or "").lower() == "high"],

        # Synthesis
        synthesis_table=_build_synthesis(profile),

        # Recommendations
        recommendation_actions=_build_recommendations(profile),

        # Shadow Zones
        shadow_zones=_build_shadow_zones(profile),

        # Raw data
        raw_sanctions_results=profile.sanctions_results,
        raw_offshore_results=profile.offshore_results,
        raw_adverse_media=profile.adverse_media_hits,
        score_breakdown=profile.score_breakdown,

        # F1: Dorking
        dorking_results=getattr(profile, "dorking_results", []),
        dorking_flagged=[d for d in getattr(profile, "dorking_results", []) if d.get("is_flagged")],

        # F2: OSINT
        osint_corporate=getattr(profile, "osint_corporate", []),
        osint_court_records=getattr(profile, "osint_court_records", []),
        osint_gov_filings=getattr(profile, "osint_gov_filings", []),
        osint_social_profiles=getattr(profile, "osint_social_profiles", []),

        # OSINT Synthesis (non-sanctioned entities)
        is_sanctioned=profile.is_sanctioned,
        osint_biography=getattr(profile, "osint_biography", None),
        osint_adverse_summary=getattr(profile, "osint_adverse_summary", None),
        osint_risk_assessment=getattr(profile, "osint_risk_assessment", None),
        osint_risk_rationale=getattr(profile, "osint_risk_rationale", None),
        osint_sources_investigated=getattr(profile, "osint_sources_investigated", []),
    )
