"""Page 3 — Executive Summary: narrative, risk badge with subtitle, comparison table."""

from typing import List

from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.risk_badge import RiskBadge


def _verdict_text(data: ReportData) -> str:
    lang = data.language
    level = data.overall_risk_level.upper()
    if level == "RED":
        return "RED — Due diligence approfondie requise" if lang == "fr" else t("risk_verdict_red", lang)
    if level == "ORANGE":
        return "ORANGE — Vigilance renforcée" if lang == "fr" else t("risk_verdict_orange", lang)
    return "GREEN — Profil conforme" if lang == "fr" else t("risk_verdict_green", lang)


def _verdict_subtitle(data: ReportData) -> str:
    lang = data.language
    level = data.overall_risk_level.upper()
    if level == "RED":
        return "Engagement non recommandé sans analyse complémentaire" if lang == "fr" else "Engagement not recommended without further analysis"
    if level == "ORANGE":
        return "Collaboration possible avec garde-fous contractuels et opérationnels stricts" if lang == "fr" else "Collaboration possible with strict contractual safeguards"
    return "Profil globalement conforme — monitoring standard" if lang == "fr" else "Generally compliant profile — standard monitoring"


def _color_value(value: str) -> str:
    """Wrap certain known status values in color tags."""
    v = value.upper()
    if v in ("NOT FOUND", "NON TROUVÉ", "NONE", "AUCUNE MENTION", "AUCUNE IDENTIFIÉE", "NOT PEP", "NON PEP"):
        return f'<font color="{Colors.GREEN}">{value}</font>'
    if v in ("FOUND", "IDENTIFIÉ", "PEP", "MENTION"):
        return f'<font color="{Colors.RED}">{value}</font>'
    if "SIGNAL" in v or "ORANGE" in v:
        return f'<font color="{Colors.ORANGE}">{value}</font>'
    if "RED" in v or "CRITICAL" in v or "HIGH" in v:
        return f'<font color="{Colors.RED}">{value}</font>'
    return value


def build_executive_summary_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("exec_summary_title", lang)))
    elements.append(Spacer(1, 12))

    # Narrative
    if data.investigation_context:
        body_style = ParagraphStyle(
            "ExecBody",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            leading=14,
            spaceAfter=16,
        )
        elements.append(Paragraph(data.investigation_context, body_style))

    # Risk verdict badge with subtitle
    elements.append(RiskBadge(
        data.overall_risk_level,
        _verdict_text(data),
        subtitle=_verdict_subtitle(data),
    ))
    elements.append(Spacer(1, 16))

    # Comparison table with color-coded values
    if data.subject_summary:
        s = data.subject_summary

        cell_style = ParagraphStyle("ESCell", fontName=Fonts.REGULAR, fontSize=FontSizes.TABLE_CELL, textColor=HexColor(Colors.GRAY_700), leading=12)
        bold_style = ParagraphStyle("ESBold", fontName=Fonts.BOLD, fontSize=FontSizes.TABLE_CELL, textColor=HexColor(Colors.GRAY_700), leading=12)
        color_style = ParagraphStyle("ESColor", fontName=Fonts.SEMIBOLD, fontSize=FontSizes.TABLE_CELL, leading=12)

        header = [t("criterion", lang), t("subject", lang)]
        raw_rows = [
            ["Statut", s.status],
            ["Localisation", s.location],
            ["Sanctions OFAC/UE/ONU", s.sanctions],
            ["Statut PEP", s.pep_status],
            ["Panama / Pandora / FinCEN", s.offshore_mentions],
            ["Structures offshore", s.offshore_structures],
            ["Contentieux judiciaire", s.litigation],
            ["Red flags", f"{s.red_flags_count} SIGNAUX" if s.red_flags_count else "—"],
            ["Risque global", s.overall_risk],
        ]

        n_cols = len(header)
        col_w = [Layout.CONTENT_WIDTH * 0.30]
        remaining = Layout.CONTENT_WIDTH - col_w[0]
        col_w.extend([remaining / (n_cols - 1)] * (n_cols - 1))

        # Build table data with Paragraphs for word-wrapping and color
        table_data = [header]
        for row in raw_rows:
            table_data.append([
                Paragraph(f"<b>{row[0]}</b>", bold_style),
                Paragraph(_color_value(row[1]), color_style),
            ])

        tbl = Table(table_data, colWidths=col_w)
        style_cmds = [
            ("FONTNAME", (0, 0), (-1, 0), Fonts.BOLD),
            ("FONTSIZE", (0, 0), (-1, 0), FontSizes.TABLE_HEADER),
            ("BACKGROUND", (0, 0), (-1, 0), HexColor(Colors.ACCENT)),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor(Colors.WHITE)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor(Colors.GRAY_200)),
        ]
        tbl.setStyle(TableStyle(style_cmds))
        elements.append(tbl)

    return elements
