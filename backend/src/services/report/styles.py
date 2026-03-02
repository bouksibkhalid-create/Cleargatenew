"""Design tokens and style constants for the ClearGate intelligence report.

All colors, fonts, dimensions, and layout constants are defined here
so every page module draws from a single source of truth.
"""

from dataclasses import dataclass, field
from typing import Dict

# ---------------------------------------------------------------------------
# Color palette (PRD §3.1)
# ---------------------------------------------------------------------------

class Colors:
    # Primary branding (reference: purple accent on white)
    DARK = "#1A1A1A"
    NAVY = "#1A1F2E"
    ACCENT = "#7C3AED"          # Purple — headers, branding, links
    ACCENT_LIGHT = "#EDE9FE"   # Light purple for backgrounds
    WHITE = "#FFFFFF"
    GRAY_50 = "#F9FAFB"
    GRAY_100 = "#F3F4F6"
    GRAY_200 = "#E5E7EB"
    GRAY_400 = "#9CA3AF"
    GRAY_500 = "#6B7280"
    GRAY_700 = "#374151"
    GRAY_900 = "#111827"
    # Traffic light system
    RED = "#EF4444"
    RED_BG = "#FEE2E2"         # Light red for matrix cells
    RED_MID = "#FECACA"        # Medium red
    ORANGE = "#F97316"
    ORANGE_BG = "#FEF3C7"      # Light yellow/amber
    GREEN = "#22C55E"
    GREEN_BG = "#DCFCE7"       # Light green
    BLUE = "#3B82F6"

    # Convenience helpers
    @staticmethod
    def hex_to_rgb(hex_color: str):
        """Convert '#RRGGBB' to (r, g, b) floats 0-1 for ReportLab."""
        h = hex_color.lstrip("#")
        return tuple(int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4))

    @classmethod
    def risk_color(cls, level: str) -> str:
        """Return hex color for a risk level string."""
        level_lower = level.lower() if level else "low"
        if level_lower in ("critical", "high", "élevé", "red"):
            return cls.RED
        if level_lower in ("medium", "moyen", "moyen-élevé", "orange"):
            return cls.ORANGE
        return cls.GREEN


# ---------------------------------------------------------------------------
# Typography (PRD §3.2)
# ---------------------------------------------------------------------------

class Fonts:
    REGULAR = "Inter"
    BOLD = "Inter-Bold"
    SEMIBOLD = "Inter-SemiBold"


# ---------------------------------------------------------------------------
# Layout constants (PRD §3.3)
# ---------------------------------------------------------------------------

class Layout:
    PAGE_WIDTH = 595.28   # A4
    PAGE_HEIGHT = 841.89  # A4
    MARGIN_TOP = 40
    MARGIN_BOTTOM = 40
    MARGIN_LEFT = 45
    MARGIN_RIGHT = 45
    CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT  # ~505
    COL_GAP = 20
    SECTION_SPACING = 24
    PARAGRAPH_SPACING = 8
    TABLE_ROW_HEIGHT = 28
    BADGE_RADIUS = 4

    @classmethod
    def col_width(cls, cols: int = 2) -> float:
        """Width of a single column in a multi-column layout."""
        return (cls.CONTENT_WIDTH - cls.COL_GAP * (cols - 1)) / cols


# ---------------------------------------------------------------------------
# Font sizes (pt)
# ---------------------------------------------------------------------------

class FontSizes:
    REPORT_TITLE = 28
    SECTION_TITLE = 18
    SUBSECTION = 14
    BODY = 10
    TABLE_HEADER = 9
    TABLE_CELL = 9
    CAPTION = 8
    STAT_NUMBER = 36
    BADGE = 10
    FOOTER = 7


# ---------------------------------------------------------------------------
# Translations (PRD §8)
# ---------------------------------------------------------------------------

TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "fr": {
        "report_type": "Rapport de Due Diligence",
        "branding_top": "Taskforce × CLEARGATE",
        "branding_sub": "Due Diligence & Intelligence Économique",
        "classification_label": "Classification",
        "page_of": "Page {current} sur {total}",
        "methodology_title": "Méthodologie",
        "methodology_osint_title": "Recherche OSINT",
        "methodology_osint_desc": "Exploration systématique des sources ouvertes incluant bases de données publiques, registres commerciaux, publications officielles, et médias internationaux.",
        "methodology_dorking_title": "Google Dorking avancé",
        "methodology_dorking_desc": "Utilisation d'opérateurs de recherche avancés pour identifier des documents, fuites de données, et informations enfouies non indexées par les moteurs de recherche standards.",
        "methodology_sanctions_title": "Screening sanctions internationales",
        "methodology_sanctions_desc": "Croisement avec les listes de sanctions OFAC (SDN), UE, ONU, UK HMT, ainsi que les bases PEP internationales et les listes de gel des avoirs.",
        "methodology_offshore_title": "Paradis fiscaux & structures offshore",
        "methodology_offshore_desc": "Recherche dans les bases ICIJ (Panama Papers, Paradise Papers, Pandora Papers, FinCEN Files) pour identifier les structures offshore et les connexions financières opaques.",
        "methodology_closing": "Chaque source est croisée, dédupliquée et évaluée selon un indice de confiance pour garantir la fiabilité des conclusions.",
        "exec_summary_title": "Synthèse Exécutive",
        "identity_title": "Identité & Informations Personnelles",
        "corporate_title": "Structure Corporate & Réseau d'Entités",
        "org_chart_title": "Organigramme",
        "red_flags_title": "Red Flags & Signaux d'Alerte",
        "red_flags_detail_title": "Détail des Red Flags",
        "risk_assessment_title": "Évaluation des Risques par Domaine",
        "reputation_title": "Réputation & Couverture Médiatique",
        "synthesis_title": "Synthèse DD — Points Positifs vs. Vigilance",
        "recommendation_title": "Recommandations Finales",
        "disclaimer_title": "Zones d'Ombre & Avertissement",
        "risk_verdict_green": "RISQUE FAIBLE — Profil globalement conforme",
        "risk_verdict_orange": "RISQUE MODÉRÉ — Vigilance renforcée requise",
        "risk_verdict_red": "RISQUE ÉLEVÉ — Due diligence approfondie requise",
        "sanctions_pep": "Sanctions / PEP",
        "offshore": "Paradis fiscaux / Offshore",
        "governance": "Gouvernance",
        "compliance": "Conformité sociale",
        "reputation": "Réputation",
        "financial": "Financier / Structure",
        "integrity": "Intégrité personnelle",
        "geopolitical": "Géopolitique",
        "risk_low": "Faible",
        "risk_medium": "Moyen",
        "risk_medium_high": "Moyen-Élevé",
        "risk_high": "Élevé",
        "found": "IDENTIFIÉ",
        "not_found": "NON IDENTIFIÉ",
        "pep": "PEP",
        "not_pep": "NON PEP",
        "no_red_flags": "Aucun signal d'alerte identifié.",
        "no_adverse_media": "Aucune couverture médiatique défavorable identifiée.",
        "no_offshore": "Aucune structure offshore identifiée.",
        "ai_unavailable": "Analyse AI indisponible — données brutes ci-dessous.",
        "positive_points": "Points positifs",
        "red_flags_vigilance": "Red flags / Vigilance",
        "shadow_zones_intro": "Les éléments suivants n'ont pas pu être vérifiés ou restent ambigus :",
        "disclaimer_text": "Ce rapport a été généré par la plateforme automatisée ClearGate. Les informations proviennent de sources publiques et de bases de données propriétaires. Ce document ne constitue pas un avis juridique ou financier. Toute décision doit être validée par un analyste qualifié.",
        "sector": "Secteur",
        "entities": "Entités principales",
        "observations": "Observations",
        "year": "Année",
        "event": "Événement",
        "impact": "Impact",
        "axis": "Axe",
        "criterion": "Critère",
        "subject": "Sujet (Personne)",
        "entity_org": "Entité (Organisation)",
    },
    "en": {
        "report_type": "Due Diligence Report",
        "branding_top": "Taskforce × CLEARGATE",
        "branding_sub": "Due Diligence & Economic Intelligence",
        "classification_label": "Classification",
        "page_of": "Page {current} of {total}",
        "methodology_title": "Methodology",
        "methodology_osint_title": "OSINT Research",
        "methodology_osint_desc": "Systematic exploration of open sources including public databases, commercial registers, official publications, and international media.",
        "methodology_dorking_title": "Advanced Google Dorking",
        "methodology_dorking_desc": "Advanced search operators to identify documents, data leaks, and buried information not indexed by standard search engines.",
        "methodology_sanctions_title": "International Sanctions Screening",
        "methodology_sanctions_desc": "Cross-referencing with OFAC (SDN), EU, UN, UK HMT sanctions lists, as well as international PEP databases and asset freeze lists.",
        "methodology_offshore_title": "Tax Havens & Offshore Structures",
        "methodology_offshore_desc": "Searching ICIJ databases (Panama Papers, Paradise Papers, Pandora Papers, FinCEN Files) to identify offshore structures and opaque financial connections.",
        "methodology_closing": "Each source is cross-referenced, deduplicated, and evaluated using a confidence index to ensure the reliability of conclusions.",
        "exec_summary_title": "Executive Summary",
        "identity_title": "Identity & Personal Information",
        "corporate_title": "Corporate Structure & Entity Network",
        "org_chart_title": "Organization Chart",
        "red_flags_title": "Red Flags & Alert Signals",
        "red_flags_detail_title": "Red Flag Details",
        "risk_assessment_title": "Risk Assessment by Domain",
        "reputation_title": "Reputation & Media Coverage",
        "synthesis_title": "DD Synthesis — Positives vs. Concerns",
        "recommendation_title": "Final Recommendations",
        "disclaimer_title": "Shadow Zones & Disclaimer",
        "risk_verdict_green": "LOW RISK — Generally compliant profile",
        "risk_verdict_orange": "MODERATE RISK — Enhanced vigilance required",
        "risk_verdict_red": "HIGH RISK — In-depth due diligence required",
        "sanctions_pep": "Sanctions / PEP",
        "offshore": "Tax Havens / Offshore",
        "governance": "Governance",
        "compliance": "Social Compliance",
        "reputation": "Reputation",
        "financial": "Financial / Structure",
        "integrity": "Personal Integrity",
        "geopolitical": "Geopolitical",
        "risk_low": "Low",
        "risk_medium": "Medium",
        "risk_medium_high": "Medium-High",
        "risk_high": "High",
        "found": "FOUND",
        "not_found": "NOT FOUND",
        "pep": "PEP",
        "not_pep": "NOT PEP",
        "no_red_flags": "No alert signals identified.",
        "no_adverse_media": "No adverse media coverage identified.",
        "no_offshore": "No offshore structures identified.",
        "ai_unavailable": "AI analysis unavailable — raw data below.",
        "positive_points": "Positive Points",
        "red_flags_vigilance": "Red Flags / Concerns",
        "shadow_zones_intro": "The following elements could not be verified or remain ambiguous:",
        "disclaimer_text": "This report was generated by the ClearGate automated platform. Information is sourced from public databases and proprietary data sources. This document does not constitute legal or financial advice. All decisions should be validated by a qualified analyst.",
        "sector": "Sector",
        "entities": "Key Entities",
        "observations": "Observations",
        "year": "Year",
        "event": "Event",
        "impact": "Impact",
        "axis": "Axis",
        "criterion": "Criterion",
        "subject": "Subject (Person)",
        "entity_org": "Entity (Organization)",
    },
}


def t(key: str, lang: str = "fr", **kwargs) -> str:
    """Look up a translation, falling back to English then to the key itself."""
    text = TRANSLATIONS.get(lang, TRANSLATIONS["en"]).get(key)
    if text is None:
        text = TRANSLATIONS["en"].get(key, key)
    if kwargs:
        text = text.format(**kwargs)
    return text
