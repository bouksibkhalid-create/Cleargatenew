"""Pages 13-14 — Final Recommendations: risk badge + purple-bordered action cards."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData, RecommendationAction
from ..components.section_header import SectionHeader
from ..components.risk_badge import RiskBadge


class _ActionCard(Flowable):
    """Recommendation action card with purple left border and numbered circle."""

    def __init__(self, action: RecommendationAction, width: float):
        super().__init__()
        self.action = action
        self.width = width
        chars_per_line = max(1, int(width / 5.0))
        desc_lines = max(1, len(action.description) // chars_per_line + 1)
        self.height = 24 + desc_lines * 12 + 18

    def draw(self):
        c = self.canv
        a = self.action
        w = self.width
        h = self.height

        # Light purple background
        c.setFillColor(HexColor(Colors.ACCENT_LIGHT))
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Purple left border
        c.setFillColor(HexColor(Colors.ACCENT))
        c.rect(0, 0, 4, h, fill=1, stroke=0)

        x = 16
        y = h - 18

        # Number circle
        c.setFillColor(HexColor(Colors.ACCENT))
        c.circle(x + 8, y + 3, 10, fill=1, stroke=0)
        c.setFont(Fonts.BOLD, 9)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(x + 8, y, str(a.number))

        # Title
        c.setFont(Fonts.BOLD, 10)
        c.setFillColor(HexColor(Colors.GRAY_900))
        c.drawString(x + 24, y, a.title)

        # Description (word-wrapped)
        c.setFont(Fonts.REGULAR, 9)
        c.setFillColor(HexColor(Colors.GRAY_700))
        y_d = y - 18
        max_w = w - 32
        words = a.description.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            if c.stringWidth(test, Fonts.REGULAR, 9) > max_w:
                c.drawString(x, y_d, line)
                y_d -= 12
                line = word
            else:
                line = test
        if line:
            c.drawString(x, y_d, line)


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
    elements.append(Spacer(1, 12))

    # Repeat risk verdict badge
    elements.append(RiskBadge(data.overall_risk_level, _verdict_text(data)))
    elements.append(Spacer(1, 16))

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

    for action in data.recommendation_actions:
        elements.append(_ActionCard(action, Layout.CONTENT_WIDTH))
        elements.append(Spacer(1, 8))

    return elements
