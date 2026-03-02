"""Page 12 — DD Synthesis: two-column table (Positive Points vs. Red Flags/Vigilance)."""

from typing import List

from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def build_synthesis_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("synthesis_title", lang)))
    elements.append(Spacer(1, 16))

    if not data.synthesis_table:
        body_style = ParagraphStyle(
            "SynEmpty",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_400),
            leading=14,
        )
        elements.append(Paragraph(t("ai_unavailable", lang), body_style))
        return elements

    # Build table: Axis | Positive Points | Red Flags / Vigilance
    header = [
        t("axis", lang),
        t("positive_points", lang),
        t("red_flags_vigilance", lang),
    ]
    rows_data = [header]
    for row in data.synthesis_table:
        rows_data.append([row.axis, row.positive_points, row.red_flags_vigilance])

    col_w = [
        Layout.CONTENT_WIDTH * 0.22,
        Layout.CONTENT_WIDTH * 0.39,
        Layout.CONTENT_WIDTH * 0.39,
    ]

    # Wrap text in Paragraphs for word wrapping
    cell_pos_style = ParagraphStyle(
        "SynPos",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.TABLE_CELL,
        textColor=HexColor(Colors.GRAY_700),
        leading=12,
    )
    cell_neg_style = ParagraphStyle(
        "SynNeg",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.TABLE_CELL,
        textColor=HexColor(Colors.GRAY_700),
        leading=12,
    )
    cell_axis_style = ParagraphStyle(
        "SynAxis",
        fontName=Fonts.SEMIBOLD,
        fontSize=FontSizes.TABLE_CELL,
        textColor=HexColor(Colors.GRAY_700),
        leading=12,
    )

    table_data = [rows_data[0]]  # Header as plain strings
    for row in rows_data[1:]:
        table_data.append([
            Paragraph(row[0], cell_axis_style),
            Paragraph(row[1], cell_pos_style),
            Paragraph(row[2], cell_neg_style),
        ])

    tbl = Table(table_data, colWidths=col_w)

    style_cmds = [
        # Global
        ("FONTNAME", (0, 0), (-1, 0), Fonts.BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), FontSizes.TABLE_HEADER),
        ("BACKGROUND", (0, 0), (-1, 0), HexColor(Colors.NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor(Colors.WHITE)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor(Colors.GRAY_100)),
        # Positive column tint (green)
        ("BACKGROUND", (1, 1), (1, -1), HexColor("#F0FDF4")),
        # Vigilance column tint (orange)
        ("BACKGROUND", (2, 1), (2, -1), HexColor("#FFFBEB")),
    ]

    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)

    return elements
