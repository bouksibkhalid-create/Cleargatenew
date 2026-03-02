"""Page 1 — Cover Page: dark background, branding, subject, stat cards."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData


class CoverPage(Flowable):
    """Full-page cover drawn directly on the canvas."""

    def __init__(self, data: ReportData):
        super().__init__()
        self.data = data
        self.width = Layout.PAGE_WIDTH
        self.height = Layout.PAGE_HEIGHT

    def draw(self):
        d = self.data
        lang = d.language
        c = self.canv
        W = self.width
        H = self.height

        # --- Full dark background ---
        c.setFillColor(HexColor(Colors.DARK))
        c.rect(0, 0, W, H, fill=1, stroke=0)

        # --- Top branding bar ---
        y = H - 60
        c.setFont(Fonts.BOLD, 12)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawCentredString(W / 2, y, t("branding_top", lang))
        y -= 18
        c.setFont(Fonts.REGULAR, 9)
        c.setFillColor(HexColor(Colors.GRAY_400))
        c.drawCentredString(W / 2, y, t("branding_sub", lang))

        # --- Accent line ---
        y -= 20
        line_w = 80
        c.setStrokeColor(HexColor(Colors.ACCENT))
        c.setLineWidth(2)
        c.line(W / 2 - line_w / 2, y, W / 2 + line_w / 2, y)

        # --- Report type ---
        y -= 40
        c.setFont(Fonts.SEMIBOLD, 14)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawCentredString(W / 2, y, t("report_type", lang))

        # --- Subject name ---
        y -= 50
        c.setFont(Fonts.BOLD, FontSizes.REPORT_TITLE)
        c.setFillColor(HexColor(Colors.WHITE))
        # Truncate long names on cover
        name = d.subject_name
        if len(name) > 40:
            name = name[:37] + "..."
        c.drawCentredString(W / 2, y, name)

        # --- Entity + location ---
        if d.entity_name:
            y -= 24
            c.setFont(Fonts.REGULAR, 12)
            c.setFillColor(HexColor(Colors.GRAY_400))
            c.drawCentredString(W / 2, y, d.entity_name)

        if d.location:
            y -= 20
            c.setFont(Fonts.REGULAR, 11)
            c.setFillColor(HexColor(Colors.GRAY_400))
            c.drawCentredString(W / 2, y, d.location)

        # --- Screening summary ---
        if d.screening_summary:
            y -= 30
            c.setFont(Fonts.REGULAR, 9)
            c.setFillColor(HexColor(Colors.GRAY_400))
            c.drawCentredString(W / 2, y, d.screening_summary)

        # --- Stat cards (2x2 grid) ---
        card_w = 200
        card_h = 70
        gap = 20
        grid_w = card_w * 2 + gap
        x_start = (W - grid_w) / 2
        y_card_top = y - 40

        stats = [
            (str(d.stats.red_flags_count), "Red Flags"),
            (str(d.stats.entities_analyzed), "Entities Analyzed"),
            (str(d.stats.risk_axes), "Risk Axes"),
            (d.stats.coverage_label, "Coverage"),
        ]

        for idx, (value, label) in enumerate(stats):
            col = idx % 2
            row = idx // 2
            x = x_start + col * (card_w + gap)
            y_pos = y_card_top - row * (card_h + gap)

            # Card background
            c.setFillColor(HexColor(Colors.NAVY))
            c.roundRect(x, y_pos, card_w, card_h, 6, fill=1, stroke=0)

            # Value
            c.setFont(Fonts.BOLD, 28)
            c.setFillColor(HexColor(Colors.ACCENT))
            c.drawCentredString(x + card_w / 2, y_pos + card_h - 38, value)

            # Label
            c.setFont(Fonts.REGULAR, 9)
            c.setFillColor(HexColor(Colors.GRAY_400))
            c.drawCentredString(x + card_w / 2, y_pos + 10, label)

        # --- Footer bar ---
        footer_y = 50
        c.setFont(Fonts.REGULAR, 8)
        c.setFillColor(HexColor(Colors.GRAY_400))
        parts = [d.report_date, d.reference_number, d.classification]
        footer_text = "  |  ".join(p for p in parts if p)
        c.drawCentredString(W / 2, footer_y, footer_text)
