"""Risk verdict badge — full-width rounded rectangle with colored background and white text."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout


class RiskBadge(Flowable):
    """Large full-width risk verdict badge (GREEN/ORANGE/RED)."""

    def __init__(self, level: str, text: str):
        super().__init__()
        self.level = level.upper()
        self.text = text
        self.width = Layout.CONTENT_WIDTH
        self.height = 44

    def _bg_color(self) -> str:
        if self.level in ("RED", "HIGH", "CRITICAL", "ÉLEVÉ"):
            return Colors.RED
        if self.level in ("ORANGE", "MEDIUM", "MOYEN", "MODERATE"):
            return Colors.ORANGE
        return Colors.GREEN

    def draw(self):
        c = self.canv
        bg = self._bg_color()
        c.setFillColor(HexColor(bg))
        c.roundRect(0, 0, self.width, self.height, Layout.BADGE_RADIUS, fill=1, stroke=0)

        c.setFont(Fonts.BOLD, FontSizes.SUBSECTION)
        c.setFillColor(HexColor(Colors.WHITE))
        c.drawCentredString(self.width / 2, 14, self.text)
