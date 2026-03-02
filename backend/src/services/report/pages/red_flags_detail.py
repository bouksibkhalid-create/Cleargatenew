"""Pages 8-9 — Red Flag Details: numbered entries with severity dots, narratives, sources."""

from typing import List

from reportlab.platypus import Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def _severity_color(severity: str) -> str:
    s = severity.upper()
    if s == "HIGH":
        return Colors.RED
    if s == "MEDIUM":
        return Colors.ORANGE
    return Colors.GREEN


def build_red_flags_detail_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    if not data.red_flags:
        return elements

    elements.append(SectionHeader(t("red_flags_detail_title", lang)))
    elements.append(Spacer(1, 16))

    title_style = ParagraphStyle(
        "RFDTitle",
        fontName=Fonts.BOLD,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "RFDBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=4,
    )
    source_style = ParagraphStyle(
        "RFDSource",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.CAPTION,
        textColor=HexColor(Colors.GRAY_400),
        leading=11,
        spaceAfter=12,
    )

    for flag in data.red_flags:
        sev_hex = _severity_color(flag.severity)
        year_str = f" ({flag.year})" if flag.year else ""

        # Severity dot + number + title
        dot = f'<font color="{sev_hex}">●</font>'
        title_text = f'{dot}  <b>{flag.id}. {flag.title}</b> — {flag.severity}{year_str}'

        block = [
            Paragraph(title_text, title_style),
        ]

        if flag.description:
            block.append(Paragraph(flag.description, body_style))

        if flag.sources:
            sources_str = ", ".join(flag.sources)
            block.append(Paragraph(f"Sources: {sources_str}", source_style))
        else:
            block.append(Spacer(1, 8))

        elements.append(KeepTogether(block))

    return elements
