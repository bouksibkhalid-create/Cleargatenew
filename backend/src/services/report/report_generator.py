"""Main report orchestrator — registers fonts, assembles pages, produces PDF bytes.

Usage:
    from src.services.report.report_generator import generate_pdf
    pdf_bytes = generate_pdf(entity_profile, language="fr")
"""

import io
import os
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Spacer,
)
from reportlab.lib.colors import HexColor

from .styles import Colors, Fonts, FontSizes, Layout, t
from .report_data import ReportData
from .report_data_assembler import assemble_report_data
from .components.page_footer import PageFooter

# Page builders
from .pages.methodology_page import build_methodology_flowables
from .pages.executive_summary import build_executive_summary_flowables
from .pages.identity_page import build_identity_flowables
from .pages.corporate_structure import build_corporate_structure_flowables
from .pages.org_chart_page import build_org_chart_flowables
from .pages.red_flags_overview import build_red_flags_overview_flowables
from .pages.red_flags_detail import build_red_flags_detail_flowables
from .pages.risk_assessment import build_risk_assessment_flowables
from .pages.reputation_page import build_reputation_flowables
from .pages.synthesis_page import build_synthesis_flowables
from .pages.recommendation_page import build_recommendation_flowables
from .pages.disclaimer_page import build_disclaimer_flowables
from .pages.osint_profile_page import build_osint_profile_flowables
from .pages.cover_page import CoverPage


# ---------------------------------------------------------------------------
# Font registration
# ---------------------------------------------------------------------------

_fonts_registered = False


def _safe_register_fonts():
    """Register Inter font family from bundled TTFs, with Helvetica fallback.

    On Vercel serverless, font files may not be present — in that case we
    patch the Fonts constants to use ReportLab's built-in Helvetica family
    which is always available and requires no file access.
    """
    global _fonts_registered
    if _fonts_registered:
        return

    font_dir = os.path.join(os.path.dirname(__file__), "fonts")

    registrations = [
        (Fonts.REGULAR, "Inter-Regular.ttf", "Helvetica"),
        (Fonts.BOLD, "Inter-Bold.ttf", "Helvetica-Bold"),
        (Fonts.SEMIBOLD, "Inter-SemiBold.ttf", "Helvetica-Bold"),
    ]

    for font_name, filename, fallback in registrations:
        path = os.path.join(font_dir, filename)
        registered = False
        if os.path.isfile(path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, path))
                registered = True
            except Exception:
                pass

        if not registered:
            # Patch the Fonts class to use Helvetica built-in names directly
            if font_name == Fonts.REGULAR:
                Fonts.REGULAR = fallback
            elif font_name == Fonts.BOLD:
                Fonts.BOLD = fallback
            elif font_name == Fonts.SEMIBOLD:
                Fonts.SEMIBOLD = fallback

    _fonts_registered = True


# ---------------------------------------------------------------------------
# Page templates
# ---------------------------------------------------------------------------

def _on_content_page(canvas, doc):
    """Called for every content page — draws footer with ref, classification, page number."""
    canvas.saveState()
    try:
        canvas.setFont(Fonts.REGULAR, FontSizes.FOOTER)
    except KeyError:
        canvas.setFont("Helvetica", FontSizes.FOOTER)

    page_num = doc.page

    # Light top border line above footer
    canvas.setStrokeColor(HexColor(Colors.GRAY_200))
    canvas.setLineWidth(0.5)
    canvas.line(Layout.MARGIN_LEFT, 32, Layout.PAGE_WIDTH - Layout.MARGIN_RIGHT, 32)

    # Footer text in gray
    canvas.setFillColor(HexColor(Colors.GRAY_400))
    ref = getattr(doc, "_cg_reference", "")
    classification = getattr(doc, "_cg_classification", "")

    # Left: reference
    canvas.drawString(Layout.MARGIN_LEFT, 20, ref)
    # Center: classification
    canvas.drawCentredString(Layout.PAGE_WIDTH / 2, 20, classification)
    # Right: page number
    canvas.drawRightString(Layout.PAGE_WIDTH - Layout.MARGIN_RIGHT, 20, f"Page {page_num}")

    # Purple accent dot next to "ClearGate" on left
    canvas.setFillColor(HexColor(Colors.ACCENT))
    canvas.circle(Layout.MARGIN_LEFT - 6, 23, 2, fill=1, stroke=0)

    canvas.restoreState()


def _on_cover_page(canvas, doc):
    """Cover page has no automatic footer."""
    pass


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_pdf(
    profile,
    language: str = "fr",
    client_name: str = "",
    classification: str = "CONFIDENTIEL",
) -> bytes:
    """Generate a complete PDF intelligence report from an M5 EntityProfile.

    Args:
        profile: An EntityProfile instance (or dict that can be coerced).
        language: 'fr' or 'en'.
        client_name: Client reference name.
        classification: Document classification level.

    Returns:
        PDF file as bytes.
    """
    _safe_register_fonts()

    # Coerce dict to EntityProfile if needed
    from src.models.entity_profile import EntityProfile
    if isinstance(profile, dict):
        profile = EntityProfile(**profile)

    # Assemble report data
    data = assemble_report_data(profile, language, client_name, classification)

    # Build PDF
    buf = io.BytesIO()

    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=Layout.MARGIN_LEFT,
        rightMargin=Layout.MARGIN_RIGHT,
        topMargin=Layout.MARGIN_TOP,
        bottomMargin=Layout.MARGIN_BOTTOM,
        title=f"ClearGate Report — {data.subject_name}",
        author="ClearGate Intelligence Platform",
    )

    # Attach metadata for footer callbacks
    doc._cg_reference = data.reference_number
    doc._cg_classification = data.classification

    # Define page templates
    content_frame = Frame(
        Layout.MARGIN_LEFT,
        Layout.MARGIN_BOTTOM,
        Layout.CONTENT_WIDTH,
        Layout.PAGE_HEIGHT - Layout.MARGIN_TOP - Layout.MARGIN_BOTTOM,
        id="content",
    )

    # Cover uses a full-page frame with no margins
    cover_frame = Frame(
        0, 0, Layout.PAGE_WIDTH, Layout.PAGE_HEIGHT,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        id="cover",
    )

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=_on_cover_page),
        PageTemplate(id="Content", frames=[content_frame], onPage=_on_content_page),
    ])

    # Assemble flowables
    story = []

    # --- Page 1: Cover ---
    story.append(CoverPage(data))
    story.append(NextPageTemplate("Content"))
    story.append(PageBreak())

    # --- Page 2: Methodology ---
    story.extend(build_methodology_flowables(data))
    story.append(PageBreak())

    # --- Page 3: Executive Summary ---
    story.extend(build_executive_summary_flowables(data))
    story.append(PageBreak())

    # --- Page 3b: OSINT Profile (non-sanctioned entities only) ---
    if not data.is_sanctioned:
        osint_flowables = build_osint_profile_flowables(data)
        if osint_flowables:
            story.extend(osint_flowables)
            story.append(PageBreak())

    # --- Page 4: Identity ---
    story.extend(build_identity_flowables(data))
    story.append(PageBreak())

    # --- Page 5: Corporate Structure ---
    story.extend(build_corporate_structure_flowables(data))
    story.append(PageBreak())

    # --- Page 6: Org Chart ---
    story.extend(build_org_chart_flowables(data))
    story.append(PageBreak())

    # --- Page 7: Red Flags Overview ---
    story.extend(build_red_flags_overview_flowables(data))
    story.append(PageBreak())

    # --- Pages 8-9: Red Flag Details ---
    detail_flowables = build_red_flags_detail_flowables(data)
    if detail_flowables:
        story.extend(detail_flowables)
        story.append(PageBreak())

    # --- Page 10: Risk Assessment ---
    story.extend(build_risk_assessment_flowables(data))
    story.append(PageBreak())

    # --- Page 11: Reputation ---
    story.extend(build_reputation_flowables(data))
    story.append(PageBreak())

    # --- Page 12: Synthesis ---
    story.extend(build_synthesis_flowables(data))
    story.append(PageBreak())

    # --- Pages 13-14: Recommendations ---
    story.extend(build_recommendation_flowables(data))
    story.append(PageBreak())

    # --- Page 15: Disclaimer ---
    story.extend(build_disclaimer_flowables(data))

    # Build
    doc.build(story)

    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
