"""Styled table wrapper — builds ReportLab Tables with ClearGate styling."""

from typing import List, Optional

from reportlab.platypus import Table, TableStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm

from ..styles import Colors, Fonts, FontSizes, Layout


def build_table(
    data: List[List[str]],
    col_widths: Optional[List[float]] = None,
    has_header: bool = True,
    row_height: float = Layout.TABLE_ROW_HEIGHT,
) -> Table:
    """Build a styled ClearGate table.

    Args:
        data: 2D list of cell strings. First row is header if has_header=True.
        col_widths: Optional column widths. Auto-distributed if None.
        has_header: Whether the first row should be styled as a header.
        row_height: Row height in points.
    """
    if not col_widths:
        n_cols = len(data[0]) if data else 1
        col_widths = [Layout.CONTENT_WIDTH / n_cols] * n_cols

    tbl = Table(data, colWidths=col_widths, rowHeights=[row_height] * len(data))

    style_commands = [
        # Global
        ("FONTNAME", (0, 0), (-1, -1), Fonts.REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), FontSizes.TABLE_CELL),
        ("TEXTCOLOR", (0, 0), (-1, -1), HexColor(Colors.GRAY_700)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        # Grid lines
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor(Colors.GRAY_100)),
    ]

    if has_header and len(data) > 0:
        style_commands.extend([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor(Colors.NAVY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor(Colors.WHITE)),
            ("FONTNAME", (0, 0), (-1, 0), Fonts.BOLD),
            ("FONTSIZE", (0, 0), (-1, 0), FontSizes.TABLE_HEADER),
        ])

    # Alternating row backgrounds (skip header row)
    start_row = 1 if has_header else 0
    for i in range(start_row, len(data)):
        if (i - start_row) % 2 == 1:
            style_commands.append(
                ("BACKGROUND", (0, i), (-1, i), HexColor(Colors.GRAY_100))
            )

    tbl.setStyle(TableStyle(style_commands))
    return tbl
