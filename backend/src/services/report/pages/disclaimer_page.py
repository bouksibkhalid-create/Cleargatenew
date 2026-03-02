"""Page 15 — Shadow Zones & Disclaimer: orange zone cards, gray disclaimer box, dark footer."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


class _ShadowZoneCard(Flowable):
    """Orange-bordered card for unverified / ambiguous items."""

    def __init__(self, text: str, width: float):
        super().__init__()
        self.text = text
        self.width = width
        chars_per_line = max(1, int(width / 5.0))
        lines = max(1, len(text) // chars_per_line + 1)
        self.height = lines * 12 + 20

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        # Light amber background
        c.setFillColor(HexColor("#FFFBEB"))
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Orange left border
        c.setFillColor(HexColor(Colors.ORANGE))
        c.rect(0, 0, 4, h, fill=1, stroke=0)

        # Warning icon + text
        c.setFont(Fonts.REGULAR, 9)
        c.setFillColor(HexColor(Colors.GRAY_700))
        x = 14
        y = h - 14
        max_w = w - 28
        words = self.text.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            if c.stringWidth(test, Fonts.REGULAR, 9) > max_w:
                c.drawString(x, y, line)
                y -= 12
                line = word
            else:
                line = test
        if line:
            c.drawString(x, y, line)


class _FooterBlock(Flowable):
    """Dark footer block with report metadata."""

    def __init__(self, data: ReportData, width: float):
        super().__init__()
        self.data = data
        self.width = width
        self.height = 80

    def draw(self):
        c = self.canv
        d = self.data
        w = self.width
        h = self.height

        # Dark background
        c.setFillColor(HexColor(Colors.DARK))
        c.roundRect(0, 0, w, h, 6, fill=1, stroke=0)

        x = 16
        y = h - 18
        c.setFont(Fonts.BOLD, 9)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawString(x, y, "ClearGate Intelligence Platform")

        y -= 14
        c.setFont(Fonts.REGULAR, 8)
        c.setFillColor(HexColor(Colors.GRAY_400))
        c.drawString(x, y, f"Report ID: {d.reference_number}")
        y -= 12
        c.drawString(x, y, f"Generated: {d.report_date}")
        y -= 12
        c.drawString(x, y, f"Classification: {d.classification}")

        # Right side branding
        c.setFont(Fonts.BOLD, 10)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawRightString(w - 16, h - 18, "Taskforce × CLEARGATE")
        c.setFont(Fonts.REGULAR, 7)
        c.setFillColor(HexColor(Colors.GRAY_400))
        c.drawRightString(w - 16, h - 32, "v2.0 — Intelligence Économique")


def build_disclaimer_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("disclaimer_title", lang)))
    elements.append(Spacer(1, 12))

    # Shadow zones
    if data.shadow_zones:
        intro_style = ParagraphStyle(
            "DisclIntro",
            fontName=Fonts.SEMIBOLD,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.ORANGE),
            spaceAfter=10,
        )
        elements.append(Paragraph(t("shadow_zones_intro", lang), intro_style))
        for zone in data.shadow_zones:
            elements.append(_ShadowZoneCard(zone, Layout.CONTENT_WIDTH))
            elements.append(Spacer(1, 6))
        elements.append(Spacer(1, 12))

    # Disclaimer text in gray box
    disc_style = ParagraphStyle(
        "DisclText",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=8,
        borderWidth=1,
        borderColor=HexColor(Colors.GRAY_200),
        borderPadding=12,
        backColor=HexColor(Colors.GRAY_50),
    )
    elements.append(Paragraph(t("disclaimer_text", lang), disc_style))
    elements.append(Spacer(1, 24))

    # Dark footer block
    elements.append(_FooterBlock(data, Layout.CONTENT_WIDTH))

    return elements
