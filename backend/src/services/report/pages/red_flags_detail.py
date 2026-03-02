"""Pages 8-9 — Red Flag Details: card-based layout with colored left border per severity."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData, RedFlag
from ..components.section_header import SectionHeader


def _severity_color(severity: str) -> str:
    s = severity.upper()
    if s == "HIGH":
        return Colors.RED
    if s == "MEDIUM":
        return Colors.ORANGE
    return Colors.GREEN


def _severity_bg(severity: str) -> str:
    s = severity.upper()
    if s == "HIGH":
        return "#FEF2F2"
    if s == "MEDIUM":
        return "#FFFBEB"
    return "#F0FDF4"


class _FlagCard(Flowable):
    """A red-flag detail card with colored left border."""

    def __init__(self, flag: RedFlag, width: float):
        super().__init__()
        self.flag = flag
        self.width = width
        # Estimate height based on description length
        chars_per_line = max(1, int(width / 5.2))
        desc_lines = max(1, len(flag.description or "") // chars_per_line + 1)
        self.height = 28 + desc_lines * 12 + (16 if flag.sources else 0) + 16

    def draw(self):
        c = self.canv
        f = self.flag
        w = self.width
        h = self.height
        sev_color = _severity_color(f.severity)
        bg_color = _severity_bg(f.severity)

        # Card background
        c.setFillColor(HexColor(bg_color))
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Colored left border
        c.setFillColor(HexColor(sev_color))
        c.rect(0, 0, 4, h, fill=1, stroke=0)

        x = 16
        y = h - 18

        # Number circle + title
        # Small severity circle
        c.setFillColor(HexColor(sev_color))
        c.circle(x + 6, y + 3, 10, fill=1, stroke=0)
        c.setFont(Fonts.BOLD, 8)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(x + 6, y, str(f.id))

        # Title
        title_x = x + 22
        c.setFont(Fonts.BOLD, 10)
        c.setFillColor(HexColor(Colors.GRAY_900))
        year_str = f" ({f.year})" if f.year else ""
        c.drawString(title_x, y, f"{f.title}{year_str}")

        # Severity badge
        badge_text = f.severity
        badge_w = c.stringWidth(badge_text, Fonts.BOLD, 7) + 12
        badge_x = w - badge_w - 12
        c.setFillColor(HexColor(sev_color))
        c.roundRect(badge_x, y - 3, badge_w, 16, 3, fill=1, stroke=0)
        c.setFont(Fonts.BOLD, 7)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(badge_x + badge_w / 2, y + 1, badge_text)

        # Description (simple text wrapping)
        if f.description:
            c.setFont(Fonts.REGULAR, 9)
            c.setFillColor(HexColor(Colors.GRAY_700))
            y_desc = y - 18
            max_w = w - 32
            words = f.description.split()
            line = ""
            for word in words:
                test = f"{line} {word}".strip()
                if c.stringWidth(test, Fonts.REGULAR, 9) > max_w:
                    c.drawString(x, y_desc, line)
                    y_desc -= 12
                    line = word
                else:
                    line = test
            if line:
                c.drawString(x, y_desc, line)

        # Sources
        if f.sources:
            c.setFont(Fonts.REGULAR, 7)
            c.setFillColor(HexColor(Colors.GRAY_400))
            src_text = "Sources: " + ", ".join(f.sources)
            c.drawString(x, 6, src_text[:120])


def build_red_flags_detail_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    if not data.red_flags:
        return elements

    elements.append(SectionHeader(
        t("red_flags_detail_title", lang),
        text_color=Colors.RED,
    ))
    elements.append(Spacer(1, 12))

    for flag in data.red_flags:
        elements.append(_FlagCard(flag, Layout.CONTENT_WIDTH))
        elements.append(Spacer(1, 8))

    return elements
