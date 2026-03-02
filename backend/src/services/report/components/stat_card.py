"""Cover page stat card — dark card with large number + label."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes


class StatCard(Flowable):
    """Single stat card for the cover page 2x2 grid."""

    def __init__(self, value: str, label: str, width: float = 230, height: float = 80):
        super().__init__()
        self.value = str(value)
        self.label = label
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        # Background
        c.setFillColor(HexColor(Colors.NAVY))
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=0)

        # Value
        c.setFont(Fonts.BOLD, FontSizes.STAT_NUMBER)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawCentredString(self.width / 2, self.height - 45, self.value)

        # Label
        c.setFont(Fonts.REGULAR, FontSizes.BODY)
        c.setFillColor(HexColor(Colors.GRAY_400))
        c.drawCentredString(self.width / 2, 12, self.label)
