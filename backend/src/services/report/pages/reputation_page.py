"""Page 11 — Reputation & Media Coverage: positive coverage, controversy timeline, warnings."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.table_builder import build_table


def build_reputation_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("reputation_title", lang)))
    elements.append(Spacer(1, 16))

    body_style = ParagraphStyle(
        "RepBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=12,
    )

    # Positive coverage
    if data.positive_coverage:
        sub_style = ParagraphStyle(
            "RepPosSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.SUBSECTION,
            textColor=HexColor(Colors.GREEN),
            spaceAfter=6,
        )
        elements.append(Paragraph("Positive Coverage", sub_style))
        elements.append(Paragraph(data.positive_coverage, body_style))

    # Controversy timeline
    if data.controversy_timeline:
        elements.append(Spacer(1, 8))
        header = [t("year", lang), t("event", lang), t("impact", lang)]
        rows = [header]
        for ev in data.controversy_timeline:
            rows.append([ev.year, ev.event, ev.impact])
        col_w = [
            Layout.CONTENT_WIDTH * 0.12,
            Layout.CONTENT_WIDTH * 0.58,
            Layout.CONTENT_WIDTH * 0.30,
        ]
        elements.append(build_table(rows, col_widths=col_w))
        elements.append(Spacer(1, 12))

    # Warnings
    if data.media_warnings:
        warn_style = ParagraphStyle(
            "RepWarn",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.ORANGE),
            leading=14,
            spaceAfter=4,
            leftIndent=12,
        )
        for warning in data.media_warnings:
            elements.append(Paragraph(f"⚠ {warning}", warn_style))
        elements.append(Spacer(1, 8))

    # No adverse media fallback
    if not data.controversy_timeline and not data.media_warnings and not data.positive_coverage:
        elements.append(Paragraph(t("no_adverse_media", lang), body_style))

    # Favorable sources
    if data.favorable_sources:
        elements.append(Spacer(1, 8))
        src_sub = ParagraphStyle(
            "RepSrcSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            spaceAfter=4,
        )
        src_style = ParagraphStyle(
            "RepSrc",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.CAPTION,
            textColor=HexColor(Colors.GRAY_400),
            leading=11,
            leftIndent=12,
            spaceAfter=2,
        )
        elements.append(Paragraph("Favorable Sources", src_sub))
        for src in data.favorable_sources:
            elements.append(Paragraph(f"• {src}", src_style))

    return elements
