"""Page 10 — Risk Assessment by Domain: horizontal rows with risk level badges."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


# Domain keys in display order
DOMAIN_KEYS = [
    "sanctions_pep",
    "offshore",
    "governance",
    "compliance",
    "reputation",
    "financial",
    "integrity",
    "geopolitical",
]


class DomainRiskRow(Flowable):
    """Single row: domain label on left, risk-level badge on right."""

    ROW_H = 36

    def __init__(self, domain_label: str, risk_label: str, risk_color: str):
        super().__init__()
        self.domain_label = domain_label
        self.risk_label = risk_label
        self.risk_color = risk_color
        self.width = Layout.CONTENT_WIDTH
        self.height = self.ROW_H

    def draw(self):
        c = self.canv
        W = self.width
        H = self.height

        # Light background
        c.setFillColor(HexColor(Colors.GRAY_100))
        c.roundRect(0, 0, W, H, 4, fill=1, stroke=0)

        # Domain label
        c.setFont(Fonts.SEMIBOLD, FontSizes.BODY)
        c.setFillColor(HexColor(Colors.GRAY_700))
        c.drawString(14, H / 2 - 4, self.domain_label)

        # Badge
        badge_w = 100
        badge_h = 22
        badge_x = W - badge_w - 14
        badge_y = (H - badge_h) / 2
        c.setFillColor(HexColor(self.risk_color))
        c.roundRect(badge_x, badge_y, badge_w, badge_h, 4, fill=1, stroke=0)

        c.setFont(Fonts.BOLD, FontSizes.BADGE)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(badge_x + badge_w / 2, badge_y + 6, self.risk_label)


def _risk_to_color(risk_level: str) -> str:
    r = risk_level.lower()
    if r in ("high", "élevé"):
        return Colors.RED
    if r in ("medium-high", "moyen-élevé"):
        return "#E97B1A"
    if r in ("medium", "moyen"):
        return Colors.ORANGE
    return Colors.GREEN


def build_risk_assessment_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("risk_assessment_title", lang)))
    elements.append(Spacer(1, 16))

    for key in DOMAIN_KEYS:
        domain_label = t(key, lang)
        risk_level = data.risk_by_domain.get(key, "low")
        risk_label = t(f"risk_{risk_level.lower().replace('-', '_')}", lang)
        color = _risk_to_color(risk_level)

        elements.append(DomainRiskRow(domain_label, risk_label, color))
        elements.append(Spacer(1, 6))

    return elements
