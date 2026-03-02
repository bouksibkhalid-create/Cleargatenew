"""Page footer component — appears on every page with page number, reference, classification."""

from reportlab.lib.units import mm
from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout


class PageFooter(Flowable):
    """Draws footer at the bottom of a page frame."""

    def __init__(self, reference: str, classification: str, branding: str = "CLEARGATE"):
        super().__init__()
        self.reference = reference
        self.classification = classification
        self.branding = branding
        self.width = Layout.CONTENT_WIDTH
        self.height = 20

    def draw(self):
        c = self.canv
        y = 4
        c.setStrokeColor(HexColor(Colors.GRAY_100))
        c.setLineWidth(0.5)
        c.line(0, self.height - 2, self.width, self.height - 2)

        c.setFont(Fonts.REGULAR, FontSizes.FOOTER)
        c.setFillColor(HexColor(Colors.GRAY_400))

        # Left: reference
        c.drawString(0, y, self.reference)

        # Center: classification
        c.drawCentredString(self.width / 2, y, self.classification)

        # Right: branding
        c.drawRightString(self.width, y, self.branding)
