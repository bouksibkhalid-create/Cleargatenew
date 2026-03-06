"""Page 1 — Cover Page: white background, purple branding, large title, stat cards."""

from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData


class CoverPage(Flowable):
    """Full-page cover drawn directly on the canvas — white/purple theme."""

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
        LM = 50  # left margin for cover content

        # --- White background (implicit) ---

        # --- Top branding: "Taskforce × CLEARGATE" ---
        y = H - 55
        # "Taskforce" in italic purple
        c.setFont(Fonts.SEMIBOLD, 14)
        c.setFillColor(HexColor(Colors.ACCENT))
        c.drawString(LM, y, "Taskforce")
        # " × CLEARGATE" in bold black
        tw = c.stringWidth("Taskforce", Fonts.SEMIBOLD, 14)
        c.setFont(Fonts.BOLD, 14)
        c.setFillColor(HexColor(Colors.GRAY_900))
        c.drawString(LM + tw + 4, y, "× CLEARGATE")

        # Subtitle
        y -= 18
        c.setFont(Fonts.REGULAR, 9)
        c.setFillColor(HexColor(Colors.GRAY_500))
        c.drawString(LM, y, t("branding_sub", lang))

        # --- Large report title ---
        y -= 70
        c.setFont(Fonts.BOLD, 36)
        c.setFillColor(HexColor(Colors.GRAY_900))
        c.drawString(LM, y, "Rapport de")
        y -= 42
        c.drawString(LM, y, "Due Diligence")

        # --- Purple accent line ---
        y -= 20
        c.setStrokeColor(HexColor(Colors.ACCENT))
        c.setLineWidth(3)
        c.line(LM, y, LM + 60, y)

        # --- Entity details ---
        y -= 30
        c.setFont(Fonts.REGULAR, 11)
        c.setFillColor(HexColor(Colors.GRAY_700))
        name = d.subject_name
        if d.entity_name:
            c.drawString(LM, y, f"{name} — {d.entity_name}")
        else:
            c.drawString(LM, y, name)

        if d.location:
            y -= 18
            c.drawString(LM, y, d.location)

        if d.screening_summary:
            y -= 18
            c.setFont(Fonts.REGULAR, 9)
            c.setFillColor(HexColor(Colors.GRAY_500))
            c.drawString(LM, y, d.screening_summary)

        # --- 4-stat row ---
        y -= 70
        stats = [
            (str(d.stats.red_flags_count), "Red Flags identifiés"),
            (f"{d.stats.entities_analyzed}+", "Entités analysées"),
            (str(d.stats.risk_axes), "Axes de risque"),
            ("360°", "Couverture Intelligence"),
        ]
        stat_spacing = (W - 2 * LM) / 4
        for i, (value, label) in enumerate(stats):
            x = LM + i * stat_spacing
            c.setFont(Fonts.BOLD, 28)
            c.setFillColor(HexColor(Colors.ACCENT))
            c.drawString(x, y, value)
            c.setFont(Fonts.REGULAR, 7)
            c.setFillColor(HexColor(Colors.GRAY_500))
            c.drawString(x, y - 14, label)

        # --- Footer reference line ---
        footer_y = 60
        c.setFont(Fonts.REGULAR, 8)
        c.setFillColor(HexColor(Colors.GRAY_400))
        client_str = f"Produit pour {d.client_name}" if d.client_name else ""
        parts = [d.report_date, f"Réf: {d.reference_number}", d.classification]
        if client_str:
            parts.append(client_str)
        footer_text = " | ".join(p for p in parts if p)
        c.drawString(LM, footer_y, footer_text)
