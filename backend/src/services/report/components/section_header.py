"""Section header component — full-width colored bar with white/accent text."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout


class SectionHeader(Flowable):
    """Full-width section header bar."""

    def __init__(self, title: str, bg_color: str = Colors.NAVY, text_color: str = Colors.WHITE):
        super().__init__()
        self.title = title
        self.bg_color = bg_color
        self.text_color = text_color
        self.width = Layout.CONTENT_WIDTH
        self.height = 32

    def draw(self):
        c = self.canv
        c.setFillColor(HexColor(self.bg_color))
        c.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)

        c.setFont(Fonts.BOLD, FontSizes.SECTION_TITLE)
        c.setFillColor(HexColor(self.text_color))
        c.drawString(14, 8, self.title)
