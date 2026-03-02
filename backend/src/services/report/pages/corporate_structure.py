"""Page 5 — Corporate Structure & Entity Network: sector breakdown table."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.table_builder import build_table


def build_corporate_structure_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("corporate_title", lang)))
    elements.append(Spacer(1, 16))

    if not data.sector_breakdown:
        body_style = ParagraphStyle(
            "CorpEmpty",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_400),
            leading=14,
        )
        elements.append(Paragraph(t("no_offshore", lang), body_style))
        return elements

    # Sector table
    header = [t("sector", lang), t("entities", lang), t("observations", lang)]
    rows = [header]
    for sg in data.sector_breakdown:
        entities_str = ", ".join(sg.entities) if sg.entities else "—"
        obs = sg.observations or "—"
        if sg.has_warning:
            obs = f"⚠ {obs}"
        rows.append([sg.sector, entities_str, obs])

    col_w = [
        Layout.CONTENT_WIDTH * 0.20,
        Layout.CONTENT_WIDTH * 0.40,
        Layout.CONTENT_WIDTH * 0.40,
    ]
    elements.append(build_table(rows, col_widths=col_w))

    # Financial attention points
    if data.financial_attention_points:
        elements.append(Spacer(1, 16))
        warn_style = ParagraphStyle(
            "CorpWarn",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.ORANGE),
            leading=14,
            spaceAfter=4,
        )
        elements.append(Paragraph("Financial Attention Points", warn_style))
        bullet_style = ParagraphStyle(
            "CorpBullet",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            leading=14,
            leftIndent=12,
            bulletIndent=0,
            spaceAfter=3,
        )
        for point in data.financial_attention_points:
            elements.append(Paragraph(f"• {point}", bullet_style))

    return elements
