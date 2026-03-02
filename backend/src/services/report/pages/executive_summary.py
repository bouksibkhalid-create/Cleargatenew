"""Page 3 — Executive Summary: risk verdict badge, narrative, comparison table."""

from typing import List

from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.risk_badge import RiskBadge
from ..components.table_builder import build_table


def _verdict_text(data: ReportData) -> str:
    lang = data.language
    level = data.overall_risk_level.upper()
    if level == "RED":
        return t("risk_verdict_red", lang)
    if level == "ORANGE":
        return t("risk_verdict_orange", lang)
    return t("risk_verdict_green", lang)


def build_executive_summary_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("exec_summary_title", lang)))
    elements.append(Spacer(1, 16))

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

    # Risk verdict badge
    elements.append(RiskBadge(data.overall_risk_level, _verdict_text(data)))
    elements.append(Spacer(1, 16))

    # Recommendation
    if data.risk_recommendation:
        rec_style = ParagraphStyle(
            "ExecRec",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_700),
            leading=14,
            spaceAfter=16,
        )
        elements.append(Paragraph(data.risk_recommendation, rec_style))

    # Comparison table
    if data.subject_summary:
        s = data.subject_summary
        header = [t("criterion", lang), t("subject", lang)]
        rows = [
            header,
            ["Status", s.status],
            ["Location", s.location],
            ["Sanctions OFAC/EU/UN", s.sanctions],
            ["PEP Status", s.pep_status],
            ["Panama/Pandora/FinCEN", s.offshore_mentions],
            ["Offshore Structures", s.offshore_structures],
            ["Litigation", s.litigation],
            ["Red Flags", str(s.red_flags_count)],
            ["Overall Risk", s.overall_risk],
        ]
        if data.entity_summary:
            e = data.entity_summary
            header.append(t("entity_org", lang))
            rows[1].append(e.status)
            rows[2].append(e.location)
            rows[3].append(e.sanctions)
            rows[4].append(e.pep_status)
            rows[5].append(e.offshore_mentions)
            rows[6].append(e.offshore_structures)
            rows[7].append(e.litigation)
            rows[8].append(str(e.red_flags_count))
            rows[9].append(e.overall_risk)

        n_cols = len(header)
        col_w = [Layout.CONTENT_WIDTH / n_cols] * n_cols
        col_w[0] = Layout.CONTENT_WIDTH * 0.35
        remaining = Layout.CONTENT_WIDTH - col_w[0]
        for i in range(1, n_cols):
            col_w[i] = remaining / (n_cols - 1)

        elements.append(build_table(rows, col_widths=col_w))

    return elements
