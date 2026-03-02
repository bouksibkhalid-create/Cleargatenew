"""Risk verdict badge — bordered rectangle with light tinted background and colored text."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout


class RiskBadge(Flowable):
    """Large full-width risk verdict badge (GREEN/ORANGE/RED) with border + tint."""

    def __init__(self, level: str, text: str, subtitle: str = ""):
        super().__init__()
        self.level = level.upper()
        self.text = text
        self.subtitle = subtitle
        self.width = Layout.CONTENT_WIDTH
        self.height = 64 if subtitle else 50

    def _colors(self):
        """Return (border_color, bg_tint, text_color) based on level."""
        if self.level in ("RED", "HIGH", "CRITICAL", "ÉLEVÉ"):
            return Colors.RED, "#FEF2F2", Colors.RED
        if self.level in ("ORANGE", "MEDIUM", "MOYEN", "MODERATE"):
            return Colors.ORANGE, "#FFF7ED", Colors.ORANGE
        return Colors.GREEN, "#F0FDF4", Colors.GREEN

    def draw(self):
        c = self.canv
        border_color, bg_tint, text_color = self._colors()

        # Background tint
        c.setFillColor(HexColor(bg_tint))
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=0)

        # Border
        c.setStrokeColor(HexColor(border_color))
        c.setLineWidth(2)
        c.roundRect(0, 0, self.width, self.height, 6, fill=0, stroke=1)

        # Main text
        y_text = self.height / 2 + 2 if not self.subtitle else self.height / 2 + 8
        c.setFont(Fonts.BOLD, FontSizes.SUBSECTION)
        c.setFillColor(HexColor(text_color))
        c.drawCentredString(self.width / 2, y_text, self.text)

        # Subtitle
        if self.subtitle:
            c.setFont(Fonts.REGULAR, 9)
            c.setFillColor(HexColor(Colors.GRAY_500))
            c.drawCentredString(self.width / 2, y_text - 18, self.subtitle)
