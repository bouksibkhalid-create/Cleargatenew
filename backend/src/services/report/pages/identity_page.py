"""Page 4 — Identity & Personal Information: biographical key-value grid."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.table_builder import build_table


def build_identity_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("identity_title", lang)))
    elements.append(Spacer(1, 16))

    ident = data.identity
    label_w = Layout.CONTENT_WIDTH * 0.30
    value_w = Layout.CONTENT_WIDTH * 0.70

    rows = []
    def _add(label: str, value):
        if value:
            v = value if isinstance(value, str) else ", ".join(value)
            if v.strip():
                rows.append([label, v])

    _add("Full Name", ident.full_name)
    _add("Aliases", ident.aliases)
    _add("Date of Birth", ident.date_of_birth)
    _add("Nationality", ident.nationality)
    _add("Residence", ident.residence)
    _add("Title / Position", ident.title_position)
    _add("Registration IDs", ident.registration_ids)
    _add("Education", ident.education)
    _add("Family / Associates", ident.family_associates)
    _add("Affiliations", ident.affiliations)

    if rows:
        elements.append(build_table(rows, col_widths=[label_w, value_w], has_header=False))
        elements.append(Spacer(1, 16))

    # Career narrative
    if ident.career_narrative:
        sub_style = ParagraphStyle(
            "IdentSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.SUBSECTION,
            textColor=HexColor(Colors.GRAY_700),
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "IdentBody",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            leading=14,
        )
        elements.append(Paragraph("Career Timeline", sub_style))
        elements.append(Paragraph(ident.career_narrative, body_style))

    return elements
