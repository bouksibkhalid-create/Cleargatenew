"""Pages 13-14 — Final Recommendations: risk verdict badge + numbered action items."""

from typing import List

from reportlab.platypus import Paragraph, Spacer, KeepTogether
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
        return t("risk_verdict_red", lang)
    if level == "ORANGE":
        return t("risk_verdict_orange", lang)
    return t("risk_verdict_green", lang)


def build_recommendation_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("recommendation_title", lang)))
    elements.append(Spacer(1, 16))

    # Repeat risk verdict badge
    elements.append(RiskBadge(data.overall_risk_level, _verdict_text(data)))
    elements.append(Spacer(1, 20))

    if not data.recommendation_actions:
        body_style = ParagraphStyle(
            "RecEmpty",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_400),
            leading=14,
        )
        elements.append(Paragraph(t("ai_unavailable", lang), body_style))
        return elements

    num_style = ParagraphStyle(
        "RecNum",
        fontName=Fonts.BOLD,
        fontSize=FontSizes.SUBSECTION,
        textColor=HexColor(Colors.ACCENT),
        spaceAfter=2,
    )
    title_style = ParagraphStyle(
        "RecTitle",
        fontName=Fonts.SEMIBOLD,
        fontSize=FontSizes.BODY + 1,
        textColor=HexColor(Colors.GRAY_700),
        spaceAfter=4,
    )
    desc_style = ParagraphStyle(
        "RecDesc",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=16,
    )

    for action in data.recommendation_actions:
        block = [
            Paragraph(f"{action.number}.", num_style),
            Paragraph(action.title, title_style),
            Paragraph(action.description, desc_style),
        ]
        elements.append(KeepTogether(block))

    return elements
