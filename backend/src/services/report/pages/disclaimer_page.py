"""Page 15 — Shadow Zones & Disclaimer: unresolved items, data gaps, legal notice."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def build_disclaimer_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("disclaimer_title", lang)))
    elements.append(Spacer(1, 16))

    body_style = ParagraphStyle(
        "DisclBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=8,
    )
    bullet_style = ParagraphStyle(
        "DisclBullet",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        leftIndent=12,
        spaceAfter=4,
    )

    # Shadow zones
    if data.shadow_zones:
        sub_style = ParagraphStyle(
            "DisclSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.SUBSECTION,
            textColor=HexColor(Colors.ORANGE),
            spaceAfter=8,
        )
        elements.append(Paragraph(t("shadow_zones_intro", lang), sub_style))
        for zone in data.shadow_zones:
            elements.append(Paragraph(f"• {zone}", bullet_style))
        elements.append(Spacer(1, 16))

    # Disclaimer text
    elements.append(Paragraph(t("disclaimer_text", lang), body_style))
    elements.append(Spacer(1, 20))

    # Report metadata footer block
    meta_style = ParagraphStyle(
        "DisclMeta",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.CAPTION,
        textColor=HexColor(Colors.GRAY_400),
        leading=11,
        spaceAfter=3,
    )
    elements.append(Paragraph(f"Report ID: {data.reference_number}", meta_style))
    elements.append(Paragraph(f"Generated: {data.report_date}", meta_style))
    elements.append(Paragraph(f"Classification: {data.classification}", meta_style))
    elements.append(Paragraph("Platform: ClearGate v2.0", meta_style))

    return elements
