from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "client_brief" / "SAES_Client_Progress_Report_2026-06-19.docx"

BRAND_RED = RGBColor(0xE1, 0x2D, 0x3C)
BRAND_RED_DARK = RGBColor(0xB5, 0x16, 0x23)
INK = RGBColor(0x00, 0x34, 0x50)
MUTED = RGBColor(0x5F, 0x66, 0x73)
BORDER = "D9DEE8"
SURFACE = "F4F4F4"


SCREENSHOTS = [
    {
        "title": "Dashboard",
        "caption": "Operational overview with headline counts, alert placeholders, and space for activity summaries.",
        "path": ROOT / "client_brief" / "screenshots" / "dashboard.png",
    },
    {
        "title": "Locations",
        "caption": "Location register for warehouses, storage points, and temporary deployment sites.",
        "path": ROOT / "client_brief" / "screenshots" / "locations.png",
    },
    {
        "title": "Assets",
        "caption": "Asset register with filters, status handling, and create/edit flow entry points.",
        "path": ROOT / "client_brief" / "screenshots" / "assets.png",
    },
    {
        "title": "Consumables",
        "caption": "Consumables and batch tracking screen for stock on hand, issue flows, and threshold management.",
        "path": ROOT / "client_brief" / "screenshots" / "consumables.png",
    },
    {
        "title": "Maintenance",
        "caption": "Maintenance and compliance view for upcoming schedules and overdue servicing work.",
        "path": ROOT / "client_brief" / "screenshots" / "maintenance-2.png",
    },
    {
        "title": "Deployments",
        "caption": "Deployment planning screen with filtering, creation flow, and future field operation tracking.",
        "path": ROOT / "client_brief" / "screenshots" / "deployments.png",
    },
    {
        "title": "Login",
        "caption": "Authentication screen wired for Supabase-backed sign-in once environment variables are configured.",
        "path": ROOT / "client_brief" / "screenshots" / "full-login-2.png",
    },
]


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_border(cell, color: str = BORDER) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "8")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_font(run, size: float, color: RGBColor, bold: bool = False) -> None:
    run.font.name = "Roboto"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Roboto")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Roboto")
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.bold = bold


def style_normal(document: Document) -> None:
    section = document.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    normal = document.styles["Normal"]
    normal.font.name = "Roboto"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Roboto")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Roboto")
    normal.font.size = Pt(11)


def add_title_block(document: Document) -> None:
    title = document.add_paragraph()
    title.paragraph_format.space_after = Pt(4)
    run = title.add_run("SAES Asset Register")
    set_font(run, 24, INK, bold=True)

    subtitle = document.add_paragraph()
    subtitle.paragraph_format.space_after = Pt(16)
    subtitle_run = subtitle.add_run("Client Progress Report")
    set_font(subtitle_run, 16, BRAND_RED, bold=True)

    meta = document.add_paragraph()
    meta.paragraph_format.space_after = Pt(18)
    meta_run = meta.add_run(
        f"Prepared for client review | {date(2026, 6, 19).strftime('%d %B %Y')}"
    )
    set_font(meta_run, 10.5, MUTED)


def add_heading(document: Document, text: str, level: int = 1) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(12 if level == 1 else 8)
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run(text)
    if level == 1:
        set_font(run, 16, INK, bold=True)
    else:
        set_font(run, 12.5, BRAND_RED_DARK, bold=True)


def add_body(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.line_spacing = 1.12
    run = paragraph.add_run(text)
    set_font(run, 11, RGBColor(0x19, 0x19, 0x19))


def add_bullet(document: Document, text: str) -> None:
    paragraph = document.add_paragraph(style="List Bullet")
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.line_spacing = 1.12
    run = paragraph.add_run(text)
    set_font(run, 11, RGBColor(0x19, 0x19, 0x19))


def add_status_table(document: Document) -> None:
    table = document.add_table(rows=1, cols=3)
    table.autofit = False
    table.columns[0].width = Inches(1.8)
    table.columns[1].width = Inches(2.1)
    table.columns[2].width = Inches(2.6)

    headers = ["Module", "Status", "Current scope"]
    for idx, text in enumerate(headers):
        cell = table.rows[0].cells[idx]
        cell.text = ""
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cell, SURFACE)
        set_cell_border(cell)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(text)
        set_font(run, 10.5, INK, bold=True)

    rows = [
        ("Dashboard", "Built", "Operational summary layout and alert scaffolding"),
        ("Locations", "Built", "Location register and create/update flows"),
        ("Assets", "Built", "Asset list, filtering, forms, and detail route"),
        ("Consumables", "Built", "Items, batches, issue flows, and stock movement logic"),
        ("Maintenance", "Built", "Schedules, records, audit logging, and due views"),
        ("Deployments", "Built", "Deployments, asset assignment, and consumable issue flows"),
        ("Authentication", "Built", "Login experience ready for Supabase configuration"),
    ]

    for row in rows:
        cells = table.add_row().cells
        for idx, text in enumerate(row):
            cell = cells[idx]
            cell.text = ""
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_border(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            set_font(run, 10.5, RGBColor(0x19, 0x19, 0x19), bold=(idx == 1 and text == "Built"))
            if idx == 1 and text == "Built":
                run.font.color.rgb = BRAND_RED_DARK


def add_screenshot_page(document: Document, title: str, caption: str, path: Path) -> None:
    document.add_section(WD_SECTION_START.NEW_PAGE)
    add_heading(document, title, level=1)
    add_body(document, caption)

    if path.exists():
        document.add_picture(str(path), width=Inches(6.1))
        picture_paragraph = document.paragraphs[-1]
        picture_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

    note = document.add_paragraph()
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    note.paragraph_format.space_before = Pt(4)
    note.paragraph_format.space_after = Pt(0)
    run = note.add_run("Captured in local Microsoft Edge review mode.")
    set_font(run, 9.5, MUTED)


def build_report() -> Path:
    document = Document()
    style_normal(document)

    add_title_block(document)
    add_body(
        document,
        "This report summarises the current build progress for the Salvation Emergency Services Asset Register and includes screenshot evidence of the client-facing screens completed so far.",
    )

    add_heading(document, "Executive Summary", level=1)
    add_body(
        document,
        "The core asset-register foundation is now in place. The project currently covers operational overview, location management, asset records, consumable stock control, maintenance scheduling, deployment tracking, and login flow preparation.",
    )
    add_body(
        document,
        "The application is running locally and the main workflows are wired into the interface. Because the live Supabase environment has not yet been configured in this development workspace, the screens currently show the structure, forms, and empty-state messaging rather than real operational data.",
    )

    add_heading(document, "Completed In This Build", level=1)
    add_bullet(document, "Dashboard route with operational summary cards and alert space.")
    add_bullet(document, "Locations register with create and update workflow support.")
    add_bullet(document, "Asset register, forms, filters, and detail-page foundation.")
    add_bullet(document, "Consumable items, batches, issue handling, and stock movement rules.")
    add_bullet(document, "Maintenance schedules, service records, and due-maintenance review screen.")
    add_bullet(document, "Deployment records with asset assignment and consumable issue support.")
    add_bullet(document, "Login page prepared for authenticated access once environment setup is complete.")

    add_heading(document, "Current Build Status", level=1)
    add_status_table(document)

    add_heading(document, "Environment Note", level=1)
    add_body(
        document,
        "These screenshots were taken from the local development build in Microsoft Edge on 19 June 2026. Live data loading is intentionally deferred until the Supabase public URL and anon key are configured for the environment.",
    )
    add_body(
        document,
        "Additional routes already exist in code for asset details, consumable batch details, consumable item details, deployment details, audit, reports, settings, and health checks. The pages shown in this report are the modules that are currently the clearest client-facing view of delivered progress.",
    )

    for screenshot in SCREENSHOTS:
        add_screenshot_page(document, screenshot["title"], screenshot["caption"], screenshot["path"])

    document.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    output = build_report()
    print(output)
