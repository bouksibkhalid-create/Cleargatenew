"""Intelligence Profile Page — Due diligence summary for non-sanctioned entities.

Displays: NOT SANCTIONED banner, biography, adverse media summary,
risk assessment, and list of sources investigated.
"""

from typing import List

from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

from ..styles import Colors, Fonts, FontSizes, Layout, t
from ..report_data import ReportData
from ..components.section_header import SectionHeader


def build_osint_profile_flowables(data: ReportData) -> List:
    """Build flowables for the Intelligence Profile page. Only for non-sanctioned entities."""
    lang = data.language
    elements: List = []

    elements.append(SectionHeader(
        "Profil Intelligence — Due Diligence" if lang == "fr" else "Intelligence Profile — Due Diligence"
    ))
    elements.append(Spacer(1, 12))

    # --- NOT SANCTIONED banner ---
    banner_style = ParagraphStyle(
        "OSINTBanner",
        fontName=Fonts.BOLD,
        fontSize=14,
        textColor=HexColor(Colors.WHITE),
        alignment=1,  # center
        spaceAfter=6,
    )
    banner_sub_style = ParagraphStyle(
        "OSINTBannerSub",
        fontName=Fonts.REGULAR,
        fontSize=9,
        textColor=HexColor(Colors.WHITE),
        alignment=1,
        spaceAfter=0,
    )

    banner_text = "NON SANCTIONNÉ" if lang == "fr" else "NOT SANCTIONED"
    banner_sub = (
        "Aucune correspondance trouvée sur les listes de surveillance internationales"
        if lang == "fr" else
        "No Matches Found on International Watchlists"
    )

    banner_data = [
        [Paragraph(f"✓  {banner_text}", banner_style)],
        [Paragraph(banner_sub, banner_sub_style)],
    ]
    banner_table = Table(banner_data, colWidths=[Layout.CONTENT_WIDTH])
    banner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor(Colors.GREEN)),
        ("TOPPADDING", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 16))

    body_style = ParagraphStyle(
        "OSINTBody",
        fontName=Fonts.REGULAR,
        fontSize=FontSizes.BODY,
        textColor=HexColor(Colors.GRAY_700),
        leading=14,
        spaceAfter=12,
    )
    sub_style = ParagraphStyle(
        "OSINTSub",
        fontName=Fonts.SEMIBOLD,
        fontSize=FontSizes.SUBSECTION,
        textColor=HexColor(Colors.ACCENT),
        spaceAfter=6,
    )

    # --- OSINT Risk Assessment ---
    risk = data.osint_risk_assessment or "low"
    risk_label = {"low": "LOW", "medium": "MEDIUM", "high": "HIGH"}.get(risk, "LOW")
    if lang == "fr":
        risk_label = {"low": "FAIBLE", "medium": "MOYEN", "high": "ÉLEVÉ"}.get(risk, "FAIBLE")

    elements.append(Paragraph(
        "Évaluation du risque" if lang == "fr" else "Risk Assessment",
        sub_style,
    ))
    elements.append(Paragraph(f"<b>{risk_label}</b>", ParagraphStyle(
        "RiskLevel", fontName=Fonts.BOLD, fontSize=12,
        textColor=HexColor(Colors.GREEN if risk == "low" else "#F59E0B" if risk == "medium" else Colors.RED),
        spaceAfter=4,
    )))
    if data.osint_risk_rationale:
        elements.append(Paragraph(data.osint_risk_rationale, body_style))
    elements.append(Spacer(1, 8))

    # --- Biography ---
    if data.osint_biography:
        elements.append(Paragraph(
            "Biographie" if lang == "fr" else "Biography",
            sub_style,
        ))
        elements.append(Paragraph(data.osint_biography, body_style))
        elements.append(Spacer(1, 8))

    # --- Adverse Media Summary ---
    if data.osint_adverse_summary:
        elements.append(Paragraph(
            "Médias défavorables & Réputation" if lang == "fr" else "Adverse Media & Reputation",
            sub_style,
        ))
        elements.append(Paragraph(data.osint_adverse_summary, body_style))
        elements.append(Spacer(1, 8))

    # --- Sources Investigated ---
    sources = data.osint_sources_investigated
    if sources:
        elements.append(Paragraph(
            f"Sources examinées ({len(sources)})" if lang == "fr" else f"Sources Investigated ({len(sources)})",
            sub_style,
        ))

        src_style = ParagraphStyle(
            "SrcURL",
            fontName=Fonts.REGULAR,
            fontSize=8,
            textColor=HexColor(Colors.GRAY_700),
            leading=11,
        )
        status_style_ok = ParagraphStyle(
            "SrcOK",
            fontName=Fonts.SEMIBOLD,
            fontSize=8,
            textColor=HexColor(Colors.GREEN),
        )
        status_style_fail = ParagraphStyle(
            "SrcFail",
            fontName=Fonts.SEMIBOLD,
            fontSize=8,
            textColor=HexColor(Colors.RED),
        )

        src_rows = [[
            Paragraph("<b>URL</b>", src_style),
            Paragraph("<b>Status</b>", src_style),
        ]]
        for s in sources:
            url = s.get("url", "—")
            title = s.get("title", "")
            success = s.get("success", False)
            label = title[:60] if title else url[:60]
            status = Paragraph("✓", status_style_ok) if success else Paragraph("✗", status_style_fail)
            src_rows.append([Paragraph(label, src_style), status])

        col_widths = [Layout.CONTENT_WIDTH * 0.85, Layout.CONTENT_WIDTH * 0.15]
        src_table = Table(src_rows, colWidths=col_widths)
        src_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), Fonts.BOLD),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), HexColor(Colors.ACCENT)),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor(Colors.WHITE)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor(Colors.GRAY_200)),
        ]))
        elements.append(src_table)

    return elements
