"""Severity indicator — colored dot + optional label for red flag items."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes


class SeverityDot(Flowable):
    """Small colored circle indicating severity level."""

    def __init__(self, severity: str, radius: float = 4, show_label: bool = False):
        super().__init__()
        self.severity = severity.upper()
        self.radius = radius
        self.show_label = show_label
        self.width = 80 if show_label else radius * 2 + 2
        self.height = radius * 2 + 2

    def _color(self) -> str:
        if self.severity == "HIGH":
            return Colors.RED
        if self.severity == "MEDIUM":
            return Colors.ORANGE
        return Colors.GREEN

    def draw(self):
        c = self.canv
        color = self._color()
        cx = self.radius + 1
        cy = self.radius + 1
        c.setFillColor(HexColor(color))
        c.circle(cx, cy, self.radius, fill=1, stroke=0)

        if self.show_label:
            c.setFont(Fonts.SEMIBOLD, FontSizes.CAPTION)
            c.setFillColor(HexColor(Colors.GRAY_700))
            c.drawString(self.radius * 2 + 6, 1, self.severity)
