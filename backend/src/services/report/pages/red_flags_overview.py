"""Page 7 — Red Flags Overview: count + risk matrix (Impact × Probability grid)."""

from typing import List

from reportlab.platypus import Flowable, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


class RiskMatrix(Flowable):
    """3×3 Impact × Probability grid with numbered circles placed by severity."""

    CELL = 80
    LABEL_W = 60

    def __init__(self, red_flags, lang: str = "fr"):
        super().__init__()
        self.flags = red_flags
        self.lang = lang
        cols = 3
        self.width = self.LABEL_W + self.CELL * cols + 10
        self.height = self.LABEL_W + self.CELL * cols + 30

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
        levels = ["LOW", "MEDIUM", "HIGH"]

        # Color grid cells
        cell_colors = {
            (0, 0): Colors.GREEN, (1, 0): Colors.GREEN, (2, 0): Colors.ORANGE,
            (0, 1): Colors.GREEN, (1, 1): Colors.ORANGE, (2, 1): Colors.ORANGE,
            (0, 2): Colors.ORANGE, (1, 2): Colors.RED, (2, 2): Colors.RED,
        }

        # Draw grid
        for row in range(3):
            for col in range(3):
                x = LW + col * CELL
                y = 20 + row * CELL
                color = cell_colors.get((col, row), Colors.GRAY_100)
                c.setFillColor(HexColor(color))
                c.setStrokeColor(HexColor(Colors.WHITE))
                c.setLineWidth(2)
                c.rect(x, y, CELL, CELL, fill=1, stroke=1)
                # Subtle opacity overlay
                c.setFillColor(HexColor(Colors.WHITE))
                c.setFillAlpha(0.7)
                c.rect(x, y, CELL, CELL, fill=1, stroke=0)
                c.setFillAlpha(1.0)

        # Axis labels
        c.setFont(Fonts.SEMIBOLD, 8)
        c.setFillColor(HexColor(Colors.GRAY_700))
        for i, label in enumerate(levels):
            # X axis (Probability)
            c.drawCentredString(LW + i * CELL + CELL / 2, 6, label)
            # Y axis (Impact)
            c.saveState()
            c.translate(LW - 8, 20 + i * CELL + CELL / 2)
            c.rotate(90)
            c.drawCentredString(0, 0, label)
            c.restoreState()

        # Axis titles
        c.setFont(Fonts.BOLD, 9)
        c.drawCentredString(LW + 1.5 * CELL, -6, "Probability →")
        c.saveState()
        c.translate(8, 20 + 1.5 * CELL)
        c.rotate(90)
        c.drawCentredString(0, 0, "Impact →")
        c.restoreState()

        # Place numbered circles for each red flag
        for flag in self.flags:
            prob_idx = self._level_idx(flag.probability)
            impact_idx = self._level_idx(flag.impact)
            cx = LW + prob_idx * CELL + CELL / 2
            cy = 20 + impact_idx * CELL + CELL / 2

            # Circle
            sev_color = Colors.RED if flag.severity == "HIGH" else (Colors.ORANGE if flag.severity == "MEDIUM" else Colors.GREEN)
            c.setFillColor(HexColor(sev_color))
            c.circle(cx, cy, 12, fill=1, stroke=0)

            # Number
            c.setFont(Fonts.BOLD, 9)
            c.setFillColor(HexColor(Colors.WHITE))
            c.drawCentredString(cx, cy - 3, str(flag.id))


def build_red_flags_overview_flowables(data: ReportData) -> List:
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(t("red_flags_title", lang)))
    elements.append(Spacer(1, 16))

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

    # Count summary
    count_style = ParagraphStyle(
        "RFCount",
        fontName=Fonts.BOLD,
        fontSize=FontSizes.SUBSECTION,
        textColor=HexColor(Colors.GRAY_700),
        spaceAfter=16,
    )
    high = sum(1 for f in data.red_flags if f.severity == "HIGH")
    med = sum(1 for f in data.red_flags if f.severity == "MEDIUM")
    low = sum(1 for f in data.red_flags if f.severity == "LOW")
    elements.append(Paragraph(
        f"{len(data.red_flags)} Red Flags Identified — "
        f"<font color='{Colors.RED}'>{high} High</font>, "
        f"<font color='{Colors.ORANGE}'>{med} Medium</font>, "
        f"<font color='{Colors.GREEN}'>{low} Low</font>",
        count_style,
    ))

    # Risk matrix
    elements.append(RiskMatrix(data.red_flags, lang))

    return elements
