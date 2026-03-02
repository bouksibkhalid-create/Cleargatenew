"""Page 11 — Reputation & Media Coverage: positive section, controversy timeline, warnings."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader
from ..components.table_builder import build_table


class _MediaCard(Flowable):
    """Bordered card for media items (green for positive, orange for warnings)."""

    def __init__(self, text: str, width: float, border_color: str = Colors.GREEN, bg_color: str = "#F0FDF4"):
        super().__init__()
        self.text = text
        self.width = width
        self.border_color = border_color
        self.bg_color = bg_color
        chars_per_line = max(1, int(width / 5.0))
        lines = max(1, len(text) // chars_per_line + 1)
        self.height = lines * 12 + 16

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        c.setFillColor(HexColor(self.bg_color))
        c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(HexColor(self.border_color))
        c.rect(0, 0, 4, h, fill=1, stroke=0)

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


def build_reputation_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("reputation_title", lang)))
    elements.append(Spacer(1, 12))

    body_style = ParagraphStyle(
        "RepBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=12,
    )

    # Positive coverage
    if data.positive_coverage:
        sub_style = ParagraphStyle(
            "RepPosSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=12,
            textColor=HexColor(Colors.GREEN),
            spaceAfter=8,
        )
        elements.append(Paragraph("Couverture positive" if lang == "fr" else "Positive Coverage", sub_style))
        elements.append(_MediaCard(data.positive_coverage, Layout.CONTENT_WIDTH, Colors.GREEN, "#F0FDF4"))
        elements.append(Spacer(1, 12))

    # Controversy timeline
    if data.controversy_timeline:
        timeline_sub = ParagraphStyle(
            "RepTimeSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=12,
            textColor=HexColor(Colors.RED),
            spaceAfter=8,
        )
        elements.append(Paragraph(
            "Chronologie des controverses" if lang == "fr" else "Controversy Timeline",
            timeline_sub,
        ))
        header = [t("year", lang), t("event", lang), t("impact", lang)]
        rows = [header]
        for ev in data.controversy_timeline[:8]:
            rows.append([ev.year, ev.event[:80], ev.impact])
        col_w = [
            Layout.CONTENT_WIDTH * 0.10,
            Layout.CONTENT_WIDTH * 0.60,
            Layout.CONTENT_WIDTH * 0.30,
        ]
        elements.append(build_table(rows, col_widths=col_w))
        elements.append(Spacer(1, 12))

    # Warnings
    if data.media_warnings:
        warn_sub = ParagraphStyle(
            "RepWarnSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=12,
            textColor=HexColor(Colors.ORANGE),
            spaceAfter=8,
        )
        elements.append(Paragraph(
            "Alertes médiatiques" if lang == "fr" else "Media Warnings",
            warn_sub,
        ))
        for warning in data.media_warnings[:5]:
            elements.append(_MediaCard(warning, Layout.CONTENT_WIDTH, Colors.ORANGE, "#FFFBEB"))
            elements.append(Spacer(1, 4))
        elements.append(Spacer(1, 8))

    # No adverse media fallback
    if not data.controversy_timeline and not data.media_warnings and not data.positive_coverage:
        elements.append(Paragraph(t("no_adverse_media", lang), body_style))

    # Favorable sources
    if data.favorable_sources:
        elements.append(Spacer(1, 8))
        src_sub = ParagraphStyle(
            "RepSrcSub",
            fontName=Fonts.SEMIBOLD,
            fontSize=10,
            textColor=HexColor(Colors.GRAY_700),
            spaceAfter=4,
        )
        src_style = ParagraphStyle(
            "RepSrc",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.CAPTION,
            textColor=HexColor(Colors.GRAY_400),
            leading=11,
            leftIndent=12,
            spaceAfter=2,
        )
        elements.append(Paragraph("Sources favorables" if lang == "fr" else "Favorable Sources", src_sub))
        for src in data.favorable_sources:
            elements.append(Paragraph(f"• {src}", src_style))

    return elements
