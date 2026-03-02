"""Page 7 — Red Flags Overview: count summary + 3×3 risk matrix (Impact × Probabilité)."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


class RiskMatrix(Flowable):
    """3×3 Impact × Probabilité grid with numbered severity circles.

    Reference colors:
      Row 0 (Faible impact):  green-bg | yellow-bg | pink-light
      Row 1 (Moyen impact):   yellow-bg | pink-light | pink-mid
      Row 2 (Élevé impact):   yellow-bg | pink-mid   | pink-dark
    """

    CELL = 90
    LABEL_W = 70

    # Pastel gradient per (col, row) — col=probability, row=impact
    CELL_BG = {
        (0, 0): "#DCFCE7", (1, 0): "#FEF9C3", (2, 0): "#FECACA",
        (0, 1): "#FEF9C3", (1, 1): "#FECACA", (2, 1): "#FCA5A5",
        (0, 2): "#FEF9C3", (1, 2): "#FCA5A5", (2, 2): "#F87171",
    }

    def __init__(self, red_flags, lang: str = "fr"):
        super().__init__()
        self.flags = red_flags
        self.lang = lang
        self.width = self.LABEL_W + self.CELL * 3 + 20
        self.height = self.LABEL_W + self.CELL * 3 + 40

    @staticmethod
    def _level_idx(level: str) -> int:
        l = level.upper()
        if l == "HIGH":
            return 2
        if l == "MEDIUM":
            return 1
        return 0

    def draw(self):
        c = self.canv
        CELL = self.CELL
        LW = self.LABEL_W
        y_labels = ["Faible", "Moyen", "Élevé"] if self.lang == "fr" else ["Low", "Medium", "High"]
        x_labels = ["Faible", "Moyenne", "Élevée"] if self.lang == "fr" else ["Low", "Medium", "High"]

        # Border box
        grid_w = CELL * 3
        grid_h = CELL * 3
        grid_x = LW
        grid_y = 30
        c.setStrokeColor(HexColor(Colors.GRAY_200))
        c.setLineWidth(1)
        c.rect(grid_x, grid_y, grid_w, grid_h, fill=0, stroke=1)

        # Draw cells
        for row in range(3):
            for col in range(3):
                x = grid_x + col * CELL
                y = grid_y + row * CELL
                bg = self.CELL_BG.get((col, row), Colors.GRAY_100)
                c.setFillColor(HexColor(bg))
                c.rect(x, y, CELL, CELL, fill=1, stroke=0)
                # White grid lines
                c.setStrokeColor(HexColor(Colors.WHITE))
                c.setLineWidth(2)
                c.rect(x, y, CELL, CELL, fill=0, stroke=1)

        # Y-axis labels (Impact)
        c.setFont(Fonts.REGULAR, 8)
        c.setFillColor(HexColor(Colors.GRAY_500))
        for i, label in enumerate(y_labels):
            c.drawRightString(grid_x - 6, grid_y + i * CELL + CELL / 2 - 3, label)

        # X-axis labels (Probabilité)
        for i, label in enumerate(x_labels):
            c.drawCentredString(grid_x + i * CELL + CELL / 2, grid_y - 14, label)

        # Axis titles
        c.setFont(Fonts.BOLD, 9)
        c.setFillColor(HexColor(Colors.GRAY_700))
        prob_label = "PROBABILITÉ" if self.lang == "fr" else "PROBABILITY"
        c.drawCentredString(grid_x + grid_w / 2, grid_y - 28, prob_label)

        # Vertical IMPACT label
        c.saveState()
        impact_label = "IMPACT" if self.lang == "fr" else "IMPACT"
        c.translate(12, grid_y + grid_h / 2)
        c.rotate(90)
        c.drawCentredString(0, 0, impact_label)
        c.restoreState()

        # Place numbered circles — offset duplicates slightly
        placed = {}  # (col, row) -> count for offset
        for flag in self.flags:
            prob_idx = self._level_idx(flag.probability)
            impact_idx = self._level_idx(flag.impact)
            key = (prob_idx, impact_idx)
            count = placed.get(key, 0)
            placed[key] = count + 1

            # Offset for overlapping circles
            offset_x = (count % 3) * 18 - 12
            offset_y = (count // 3) * 18 - 6

            cx = grid_x + prob_idx * CELL + CELL / 2 + offset_x
            cy = grid_y + impact_idx * CELL + CELL / 2 + offset_y

            # Circle color by severity
            sev_color = Colors.RED if flag.severity == "HIGH" else (Colors.ORANGE if flag.severity == "MEDIUM" else Colors.GREEN)
            c.setFillColor(HexColor(sev_color))
            c.circle(cx, cy, 13, fill=1, stroke=0)

            # Number
            c.setFont(Fonts.BOLD, 9)
            c.setFillColor(HexColor(Colors.WHITE))
            c.drawCentredString(cx, cy - 3, str(flag.id))


def build_red_flags_overview_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    # Red title for this page (reference uses red, not purple)
    elements.append(SectionHeader(
        t("red_flags_title", lang),
        text_color=Colors.RED,
    ))
    elements.append(Spacer(1, 12))

    if not data.red_flags:
        empty_style = ParagraphStyle(
            "RFEmpty",
            fontName=Fonts.REGULAR,
            fontSize=FontSizes.BODY,
            textColor=HexColor(Colors.GRAY_400),
            leading=14,
        )
        elements.append(Paragraph(t("no_red_flags", lang), empty_style))
        return elements

    # Intro text
    intro_style = ParagraphStyle(
        "RFIntro",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=16,
    )
    high = sum(1 for f in data.red_flags if f.severity == "HIGH")
    med = sum(1 for f in data.red_flags if f.severity == "MEDIUM")
    low = sum(1 for f in data.red_flags if f.severity == "LOW")
    intro = (
        f"L'analyse croisée Cleargate identifie <b>{len(data.red_flags)} signaux d'alerte</b> "
        f"classés par gravité."
        if lang == "fr" else
        f"ClearGate cross-analysis identified <b>{len(data.red_flags)} alert signals</b> "
        f"classified by severity."
    )
    elements.append(Paragraph(intro, intro_style))

    # Count badge
    count_style = ParagraphStyle(
        "RFCount",
        fontName=Fonts.BOLD,
        fontSize=12,
        textColor=HexColor(Colors.GRAY_700),
        spaceAfter=16,
    )
    elements.append(Paragraph(
        f"<font color='{Colors.RED}'>{high} high</font> · "
        f"<font color='{Colors.ORANGE}'>{med} medium</font> · "
        f"<font color='{Colors.GREEN}'>{low} low</font>",
        count_style,
    ))

    # Matrix header
    matrix_title = ParagraphStyle(
        "RFMatrixTitle",
        fontName=Fonts.BOLD,
        fontSize=10,
        textColor=HexColor(Colors.GRAY_900),
        spaceAfter=8,
    )
    elements.append(Paragraph(
        "MATRICE DE RISQUE — IMPACT × PROBABILITÉ" if lang == "fr" else "RISK MATRIX — IMPACT × PROBABILITY",
        matrix_title,
    ))

    # Risk matrix
    elements.append(RiskMatrix(data.red_flags, lang))

    return elements
