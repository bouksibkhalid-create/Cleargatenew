"""Page 2 — Methodology: how ClearGate works (largely boilerplate)."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def build_methodology_flowables(data: ReportData) -> List:
    """Return a list of Flowables for the methodology page."""
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("methodology_title", lang)))
    elements.append(Spacer(1, 20))

    title_style = ParagraphStyle(
        "MethodTitle",
        fontName=Fonts.SEMIBOLD,
        fontSize=FontSizes.SUBSECTION,
        textColor=HexColor(Colors.ACCENT),
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "MethodBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=16,
    )

    blocks = [
        ("methodology_osint_title", "methodology_osint_desc"),
        ("methodology_dorking_title", "methodology_dorking_desc"),
        ("methodology_sanctions_title", "methodology_sanctions_desc"),
        ("methodology_offshore_title", "methodology_offshore_desc"),
    ]

    for title_key, desc_key in blocks:
        elements.append(Paragraph(t(title_key, lang), title_style))
        elements.append(Paragraph(t(desc_key, lang), body_style))

    # Closing credibility line
    closing_style = ParagraphStyle(
        "MethodClosing",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_400),
        leading=14,
        spaceBefore=8,
    )
    elements.append(Paragraph(t("methodology_closing", lang), closing_style))

    return elements
