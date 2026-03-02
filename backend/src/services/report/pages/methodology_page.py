"""Page 2 — Methodology: purple header, intro, 4 bordered cards, closing note."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


class _MethodCard(Flowable):
    """A methodology card with a purple left-border, icon-prefix title, and body text."""

    def __init__(self, icon: str, title: str, body: str, width: float):
        super().__init__()
        self.icon = icon
        self.title = title
        self.body = body
        self.width = width
        # Estimate height (title + body wrapping)
        chars_per_line = int(width / 5.0)
        body_lines = max(1, len(body) // chars_per_line + 1)
        self.height = 24 + body_lines * 13 + 16

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        # Light gray background
        c.setFillColor(HexColor(Colors.GRAY_100))
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Purple left border
        c.setFillColor(HexColor(Colors.ACCENT))
        c.rect(0, 0, 4, h, fill=1, stroke=0)

        # Title
        x = 14
        y_title = h - 18
        c.setFont(Fonts.SEMIBOLD, 11)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawString(x, y_title, f"{self.icon}  {self.title}")

        # Body text (simple wrapping)
        c.setFont(Fonts.REGULAR, 9)
        c.setFillColor(HexColor(Colors.GRAY_700))
        y = y_title - 16
        max_w = w - 28
        words = self.body.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            if c.stringWidth(test, Fonts.REGULAR, 9) > max_w:
                c.drawString(x, y, line)
                y -= 13
                line = word
            else:
                line = test
        if line:
            c.drawString(x, y, line)


def build_methodology_flowables(data: ReportData) -> List:
    """Return a list of Flowables for the methodology page."""
    lang = data.language
    elements: List = []

    elements.append(SectionHeader("Méthodologie Cleargate" if lang == "fr" else "ClearGate Methodology"))
    elements.append(Spacer(1, 12))

    # Intro paragraph
    intro_style = ParagraphStyle(
        "MethodIntro",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=20,
    )
    intro_text = (
        "L'ensemble des résultats de ce rapport ont été obtenus grâce au logiciel "
        "<font color='#7C3AED'><b>Cleargate</b></font>, plateforme propriétaire de due "
        "diligence développée par Taskforce. Cleargate exécute automatiquement :"
        if lang == "fr" else
        "All results in this report were obtained using the "
        "<font color='#7C3AED'><b>ClearGate</b></font> platform, a proprietary due "
        "diligence engine developed by Taskforce. ClearGate automatically executes:"
    )
    elements.append(Paragraph(intro_text, intro_style))

    # Four methodology cards with icons
    cards = [
        ("🔍", t("methodology_osint_title", lang), t("methodology_osint_desc", lang)),
        ("🔎", t("methodology_dorking_title", lang), t("methodology_dorking_desc", lang)),
        ("🛡", t("methodology_sanctions_title", lang), t("methodology_sanctions_desc", lang)),
        ("🌐", t("methodology_offshore_title", lang), t("methodology_offshore_desc", lang)),
    ]

    for icon, title, body in cards:
        elements.append(_MethodCard(icon, title, body, Layout.CONTENT_WIDTH))
        elements.append(Spacer(1, 10))

    # Closing credibility line
    closing_style = ParagraphStyle(
        "MethodClosing",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_500),
        leading=14,
        spaceBefore=8,
    )
    elements.append(Paragraph(t("methodology_closing", lang), closing_style))

    return elements
