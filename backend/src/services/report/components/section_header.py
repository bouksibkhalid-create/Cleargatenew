"""Section header component — purple title text with short accent underline."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout


class SectionHeader(Flowable):
    """Section header: large purple title with a short accent underline beneath."""

    def __init__(self, title: str, text_color: str = Colors.ACCENT, **_kw):
        super().__init__()
        self.title = title
        self.text_color = text_color
        self.width = Layout.CONTENT_WIDTH
        self.height = 44

    def draw(self):
        c = self.canv
        # Title text — bold purple
        c.setFont(Fonts.BOLD, FontSizes.SECTION_TITLE)
        c.setFillColor(HexColor(self.text_color))
        c.drawString(0, 14, self.title)

        # Short accent underline
        c.setStrokeColor(HexColor(Colors.ACCENT))
        c.setLineWidth(3)
        c.line(0, 8, 60, 8)
