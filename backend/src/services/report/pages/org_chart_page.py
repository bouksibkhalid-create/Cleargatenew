"""Page 6 — Org Chart: structured tree fallback using text with connector characters."""

from typing import List

from reportlab.platypus import Paragraph, Spacer, Preformatted
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def build_org_chart_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("org_chart_title", lang)))
    elements.append(Spacer(1, 16))

    if not data.sector_breakdown and not data.corporate_entities:
        empty_style = ParagraphStyle(
            "OrgEmpty",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_400),
            leading=14,
        )
        elements.append(Paragraph(t("no_offshore", lang), empty_style))
        return elements

    # Build a text-based tree
    lines = []
    subject = data.subject_name or "Subject"
    lines.append(subject)

    if data.sector_breakdown:
        for i, sg in enumerate(data.sector_breakdown):
            is_last_sector = i == len(data.sector_breakdown) - 1
            branch = "└── " if is_last_sector else "├── "
            prefix = "    " if is_last_sector else "│   "
            lines.append(f"{branch}{sg.sector}")
            for j, entity_name in enumerate(sg.entities):
                is_last_entity = j == len(sg.entities) - 1
                sub_branch = "└── " if is_last_entity else "├── "
                lines.append(f"{prefix}{sub_branch}{entity_name}")
    elif data.corporate_entities:
        for i, ent in enumerate(data.corporate_entities):
            is_last = i == len(data.corporate_entities) - 1
            branch = "└── " if is_last else "├── "
            label = ent.name
            if ent.sector:
                label += f" [{ent.sector}]"
            if ent.country:
                label += f" ({ent.country})"
            lines.append(f"{branch}{label}")

    tree_text = "\n".join(lines)

    tree_style = ParagraphStyle(
        "OrgTree",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=16,
        leftIndent=20,
    )
    elements.append(Preformatted(tree_text, tree_style))

    # Financial attention points
    if data.financial_attention_points:
        elements.append(Spacer(1, 16))
        warn_style = ParagraphStyle(
            "OrgWarn",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.ORANGE),
            spaceAfter=4,
        )
        elements.append(Paragraph("Financial Attention Points", warn_style))
        bullet_style = ParagraphStyle(
            "OrgBullet",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            leading=14,
            leftIndent=12,
            spaceAfter=3,
        )
        for point in data.financial_attention_points:
            elements.append(Paragraph(f"• {point}", bullet_style))

    return elements
