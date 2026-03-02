"""Page 10 — Risk Assessment by Domain: horizontal bar chart rows with colored fills."""

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


class DomainRiskBar(Flowable):
    """Horizontal bar: domain label left, colored bar proportional to risk, risk label right."""

    ROW_H = 32
    LABEL_W = 160
    BAR_GAP = 10
    BADGE_W = 90

    def __init__(self, domain_label: str, risk_label: str, risk_color: str, risk_pct: float):
        super().__init__()
        self.domain_label = domain_label
        self.risk_label = risk_label
        self.risk_color = risk_color
        self.risk_pct = risk_pct  # 0.0 - 1.0
        self.width = Layout.CONTENT_WIDTH
        self.height = self.ROW_H

    def draw(self):
        c = self.canv
        W = self.width
        H = self.height
        LW = self.LABEL_W
        BW = self.BADGE_W

        # Domain label
        c.setFont(Fonts.SEMIBOLD, 9)
        c.setFillColor(HexColor(Colors.GRAY_700))
        c.drawString(0, H / 2 - 3, self.domain_label)

        # Bar track (gray background)
        bar_x = LW
        bar_w = W - LW - BW - self.BAR_GAP * 2
        bar_h = 14
        bar_y = (H - bar_h) / 2

        c.setFillColor(HexColor(Colors.GRAY_200))
        c.roundRect(bar_x, bar_y, bar_w, bar_h, 3, fill=1, stroke=0)

        # Colored fill
        fill_w = max(bar_w * self.risk_pct, 10)
        c.setFillColor(HexColor(self.risk_color))
        c.roundRect(bar_x, bar_y, fill_w, bar_h, 3, fill=1, stroke=0)

        # Risk label badge
        badge_x = W - BW
        badge_h = 20
        badge_y = (H - badge_h) / 2
        c.setFillColor(HexColor(self.risk_color))
        c.roundRect(badge_x, badge_y, BW, badge_h, 4, fill=1, stroke=0)

        c.setFont(Fonts.BOLD, 8)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(badge_x + BW / 2, badge_y + 6, self.risk_label.upper())


def _risk_to_color(risk_level: str) -> str:
    r = risk_level.lower()
    if r in ("high", "élevé"):
        return Colors.RED
    if r in ("medium-high", "moyen-élevé"):
        return Colors.ORANGE
    if r in ("medium", "moyen"):
        return "#F59E0B"
    return Colors.GREEN


def _risk_to_pct(risk_level: str) -> float:
    r = risk_level.lower()
    if r in ("high", "élevé"):
        return 0.95
    if r in ("medium-high", "moyen-élevé"):
        return 0.75
    if r in ("medium", "moyen"):
        return 0.50
    return 0.25


def build_risk_assessment_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("risk_assessment_title", lang)))
    elements.append(Spacer(1, 12))

    # Intro
    intro_style = ParagraphStyle(
        "RAIntro",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=16,
    )
    intro = (
        "Chaque axe est évalué sur la base des données collectées et croisées automatiquement par Cleargate."
        if lang == "fr" else
        "Each axis is assessed based on data automatically collected and cross-referenced by ClearGate."
    )
    elements.append(Paragraph(intro, intro_style))

    for key in DOMAIN_KEYS:
        domain_label = t(key, lang)
        risk_level = data.risk_by_domain.get(key, "low")
        risk_label = t(f"risk_{risk_level.lower().replace('-', '_')}", lang)
        color = _risk_to_color(risk_level)
        pct = _risk_to_pct(risk_level)

        elements.append(DomainRiskBar(domain_label, risk_label, color, pct))
        elements.append(Spacer(1, 4))

    return elements
