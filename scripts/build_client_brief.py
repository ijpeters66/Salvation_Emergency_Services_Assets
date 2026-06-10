from __future__ import annotations

import html
import shutil
import zipfile
from pathlib import Path


OUT = Path("client_brief/Salvation_Emergency_Services_Asset_Register_Client_Brief.docx")
LOGO = Path("static/SAES Logo.png")

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def run(text: str, bold: bool = False, italic: bool = False, color: str | None = None, size: int | None = None) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    if size:
        props.append(f'<w:sz w:val="{size * 2}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    preserve = ' xml:space="preserve"' if text.startswith(" ") or text.endswith(" ") else ""
    return f"<w:r>{rpr}<w:t{preserve}>{esc(text)}</w:t></w:r>"


def para(
    text: str = "",
    style: str | None = None,
    align: str | None = None,
    before: int | None = None,
    after: int | None = None,
    bold: bool = False,
    italic: bool = False,
    color: str | None = None,
    size: int | None = None,
    keep_next: bool = False,
) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    spacing = []
    if before is not None:
        spacing.append(f'w:before="{before}"')
    if after is not None:
        spacing.append(f'w:after="{after}"')
    if spacing:
        ppr.append(f"<w:spacing {' '.join(spacing)} w:line=\"264\" w:lineRule=\"auto\"/>")
    if keep_next:
        ppr.append("<w:keepNext/>")
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr_xml}{run(text, bold=bold, italic=italic, color=color, size=size)}</w:p>"


def rich_para(parts: list[tuple[str, dict]], style: str | None = None, after: int | None = None) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if after is not None:
        ppr.append(f'<w:spacing w:after="{after}" w:line="264" w:lineRule="auto"/>')
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr_xml}{''.join(run(text, **opts) for text, opts in parts)}</w:p>"


def bullet(text: str) -> str:
    return (
        '<w:p><w:pPr><w:pStyle w:val="BodyText"/>'
        '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
        '<w:spacing w:after="80" w:line="280" w:lineRule="auto"/></w:pPr>'
        f"{run(text)}</w:p>"
    )


def numbered(text: str) -> str:
    return (
        '<w:p><w:pPr><w:pStyle w:val="BodyText"/>'
        '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>'
        '<w:spacing w:after="80" w:line="280" w:lineRule="auto"/></w:pPr>'
        f"{run(text)}</w:p>"
    )


def numbered_restart(text: str) -> str:
    return (
        '<w:p><w:pPr><w:pStyle w:val="BodyText"/>'
        '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr>'
        '<w:spacing w:after="80" w:line="280" w:lineRule="auto"/></w:pPr>'
        f"{run(text)}</w:p>"
    )


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def cell(text: str, width: int, fill: str | None = None, bold: bool = False) -> str:
    shading = f'<w:shd w:fill="{fill}"/>' if fill else ""
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>'
        '<w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>'
        '<w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>'
        f"{shading}</w:tcPr>{para(text, after=40, bold=bold)}</w:tc>"
    )


def table(rows: list[list[str]], widths: list[int], header: bool = False) -> str:
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    out = [
        '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/>'
        '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
        '</w:tblPr>',
        f"<w:tblGrid>{grid}</w:tblGrid>",
    ]
    for idx, row in enumerate(rows):
        fill = "F2F4F7" if header and idx == 0 else None
        out.append("<w:tr>")
        for value, width in zip(row, widths):
            out.append(cell(value, width, fill=fill, bold=bool(fill)))
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def callout(title: str, body: str) -> str:
    return (
        '<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/>'
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E2EF"/>'
        '<w:left w:val="single" w:sz="4" w:color="D9E2EF"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="D9E2EF"/>'
        '<w:right w:val="single" w:sz="4" w:color="D9E2EF"/></w:tblBorders></w:tblPr>'
        '<w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr>'
        '<w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F4F6F9"/>'
        '<w:tcMar><w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/>'
        '<w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>'
        f"{para(title, after=40, bold=True, color='1F4D78')}{para(body, after=20)}</w:tc></w:tr></w:tbl>"
    )


def logo_paragraph() -> str:
    if not LOGO.exists():
        return ""
    cx = 2286000
    cy = 914400
    return f"""
<w:p>
  <w:pPr><w:jc w:val="right"/><w:spacing w:after="260"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="1" name="SAES Logo"/>
        <wp:cNvGraphicFramePr/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr><pic:cNvPr id="1" name="SAES Logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
"""


def build_document_xml() -> str:
    body: list[str] = []
    body.append(logo_paragraph())
    body.append(para("CLIENT BRIEF", size=11, bold=True, color="666666", after=120))
    body.append(para("Salvation Army Emergency Services Asset Register", size=24, bold=True, color="0B2545", after=100))
    body.append(para("Progressive Web Application for asset, consumable, fleet, deployment, maintenance, QR, offline, audit, and reporting workflows.", size=13, color="555555", after=260))
    body.append(table([
        ["Prepared for", "Salvation Army Emergency Services Victoria"],
        ["Prepared by", "Alex - Regional Victoria custom software delivery"],
        ["Date", "9 June 2026"],
        ["Document purpose", "Plain-English summary of what is being built, how it will be delivered, and what will be included in Version 1."],
    ], [2200, 7160]))
    body.append(callout("Executive summary", "We are building an offline-capable asset register PWA to replace fragile manual tracking with a practical operational system for emergency services logistics. The system will help users know what they have, where it is, what condition it is in, what stock is low, what is deployed, and what needs maintenance."))

    body.append(page_break())
    body.append(para("1. What We Are Building", "Heading1"))
    body.append(para("The project is a custom Progressive Web Application for Salvation Army Emergency Services Victoria. It will manage non-consumable assets, consumable stock, plant and fleet, deployments, maintenance, documents, QR codes, audit history, and reporting across Victorian locations."))
    body.append(para("The system is designed for operational use on laptops, desktops, tablets, and mobile phones. It must support offline work and synchronise when internet connectivity returns."))
    body.append(para("The practical outcome is a single source of truth for emergency services assets and consumables, with clearer visibility, fewer spreadsheet handovers, and better audit readiness."))
    body.append(para("Primary outcomes", "Heading2"))
    for item in [
        "Track assets individually with clear status, location, ownership history, photos, documents, and QR codes.",
        "Track consumables by batch/lot, including quantity on hand, movement history, cost, location, and expiry where relevant.",
        "Record operational stock movements such as received, issued, transferred, returned, adjusted, written off, and stocktake variance.",
        "Support deployments by assigning assets and issuing consumables to an event or operational response.",
        "Provide alerts for low stock, out-of-stock items, upcoming maintenance, overdue maintenance, and registration or insurance expiry.",
        "Maintain a full audit trail for important changes.",
        "Provide professional exports and reports for operational review, management, and compliance.",
    ]:
        body.append(bullet(item))

    body.append(para("2. Version 1 Scope", "Heading1"))
    body.append(para("Version 1 focuses on the workflows needed to make the register operational in Victoria. It is deliberately scoped so the first usable release can be built, tested, improved, and handed over without waiting for every future idea to be designed upfront."))
    body.append(table([
        ["Area", "Version 1 inclusion"],
        ["Locations", "Warehouses, storage facilities, temporary deployment locations, soft delete/archive, location-based views and reports."],
        ["Assets", "Individual asset register, unique asset IDs, QR codes, status workflow, value fields, photos/documents, audit history."],
        ["Consumables", "Batch/lot tracking, quantity on hand, supplier/donor, expiry where relevant, FIFO issuing, movement history."],
        ["Stock movements", "Received, issued, transferred, returned, adjusted, written off, and stocktake variance records."],
        ["Fleet and plant", "Vehicle/plant fields including registration, insurance, roadworthy/compliance dates, odometer/hours, and attached assets."],
        ["Maintenance", "Schedules, completed records, invoices/photos, due soon and overdue alerts."],
        ["Deployments", "Deployment records, assets assigned, consumables issued, return tracking, notes, photos/documents."],
        ["QR scanning", "Generate and scan QR codes for assets, plant/vehicles, consumable batches, and locations."],
        ["Offline use", "View cached data, record field actions, queue changes, and synchronise when connectivity returns."],
        ["Reporting", "PDF, XLSX, and CSV export capability for core asset, stock, deployment, maintenance, and audit reports."],
    ], [2200, 7160], header=True))

    body.append(para("3. User Roles", "Heading1"))
    body.append(para("The MVP uses two clear roles. There is no approval workflow in Version 1; authorised users make changes directly, and important actions are recorded in the audit trail."))
    body.append(table([
        ["Role", "Responsibilities and access"],
        ["System Admin", "Manage users, locations, asset categories, consumable categories, system settings, reports, exports, soft deletes, and audit trail access."],
        ["User", "Add/edit assets, add/edit consumable batches, record stock movements, check assets in/out, record deployments, record maintenance, upload photos/documents, and view dashboards/reports."],
    ], [2200, 7160], header=True))

    body.append(para("4. Key Workflows", "Heading1"))
    workflows = [
        ("Asset lifecycle", "Create an asset, assign a QR code, record make/model/serial/value, set location and status, attach documents/photos, move it, deploy it, maintain it, retire/archive it, and retain audit history."),
        ("Consumable stock", "Receive stock by batch, track quantity on hand, issue stock using FIFO, transfer between locations, return unused stock where relevant, adjust after stocktake, and report on low or out-of-stock items."),
        ("Deployment support", "Create a deployment, assign vehicles/assets, issue consumables, capture notes/photos, return assets, close the deployment, and keep a deployment history."),
        ("Maintenance and compliance", "Create service schedules, record completed work, attach invoices or certificates, track odometer/hour readings, and surface due soon or overdue alerts."),
        ("QR field actions", "Scan a QR code to view the record and start context-specific actions such as move asset, check in/out, issue consumables, or record maintenance."),
        ("Offline operations", "Continue critical field workflows without internet, show pending sync status, synchronise automatically when connectivity returns, and preserve audit trail integrity."),
    ]
    for title, body_text in workflows:
        body.append(rich_para([(title + ": ", {"bold": True, "color": "1F4D78"}), (body_text, {})], after=100))

    body.append(para("5. Data and Governance", "Heading1"))
    body.append(para("The system will be designed around clear data ownership, exportability, and audit readiness. The client retains ownership of the code and data. The system should not create unnecessary SaaS lock-in."))
    body.append(para("Core data records", "Heading2"))
    for item in [
        "Users, roles, and permissions.",
        "Locations and location-specific stock thresholds.",
        "Assets, asset categories, asset assignments, plant details, and parent/child relationships.",
        "Consumable items, consumable batches, and stock movements.",
        "Maintenance schedules and maintenance records.",
        "Deployments, deployment assets, and deployment consumables.",
        "Document attachments and audit logs.",
        "Report templates and system settings where required.",
    ]:
        body.append(bullet(item))
    body.append(para("Audit trail", "Heading2"))
    body.append(para("Every important action should capture the user, date/time, action type, affected record, old value where useful, new value where useful, device/source where useful, and offline sync reference where relevant. Audited modules include assets, consumables, locations, deployments, maintenance, users, and stock movements."))

    body.append(para("6. Recommended Technical Approach", "Heading1"))
    body.append(para("The recommended implementation is a Next.js, TypeScript, Tailwind CSS, and shadcn/ui Progressive Web App backed by Supabase Auth, PostgreSQL, Row Level Security, Supabase Storage, IndexedDB, and a service worker."))
    body.append(table([
        ["Layer", "Recommended technology"],
        ["Frontend", "Next.js, TypeScript, Tailwind CSS, shadcn/ui"],
        ["Backend/data", "Supabase, PostgreSQL, Row Level Security"],
        ["Authentication", "Supabase Auth"],
        ["Offline", "Progressive Web App, IndexedDB, service worker, sync queue"],
        ["Storage", "Supabase Storage for photos, documents, invoices, certificates, and manuals"],
        ["Reporting", "CSV export early, then PDF and XLSX export where required"],
        ["Testing", "Vitest for unit tests and Playwright for end-to-end workflow tests"],
    ], [2200, 7160], header=True))

    body.append(para("7. Delivery Approach", "Heading1"))
    body.append(para("The project should be delivered iteratively. Each delivery slice should be small enough to test, but complete enough to connect the user interface, database, validation, permissions, audit trail, and reporting/offline behaviour where relevant."))
    for item in [
        "Start with project foundation, app shell, authentication, roles, and audit logging.",
        "Build location management as the first complete vertical slice.",
        "Add assets and asset status workflow.",
        "Add consumables, stock movements, FIFO issuing, and stock thresholds.",
        "Add fleet/plant, maintenance, deployments, QR scanning, attachments, offline sync, dashboard, and reporting.",
        "Pilot with real users and realistic data before production handoff.",
    ]:
        body.append(numbered(item))
    body.append(callout("Delivery principle", "The goal is working software that can be tested against real emergency services workflows early, not a long design phase that delays learning."))

    body.append(para("8. Client Responsibilities", "Heading1"))
    body.append(para("The build will move faster and produce a better operational fit if the client can provide timely workflow input, realistic sample data, and access to users who will test the system."))
    for item in [
        "Nominate a primary decision-maker and day-to-day operational contact.",
        "Provide current asset, consumable, location, and maintenance records where available.",
        "Confirm the minimum reports required for Version 1.",
        "Confirm which locations and user groups are in scope for the first release.",
        "Provide feedback on early working versions.",
        "Separate must-have issues from Phase 2 ideas during pilot testing.",
        "Participate in handoff and training.",
    ]:
        body.append(bullet(item))

    body.append(para("9. Assumptions and Boundaries", "Heading1"))
    for item in [
        "Version 1 is Victoria-only, with future multi-state support allowed for in the design.",
        "The MVP uses two roles: System Admin and User.",
        "There is no approval workflow in Version 1.",
        "Offline capability is required, but the exact offline-first scope should be confirmed during implementation.",
        "CSV export should be prioritised early; PDF and XLSX exports can be added based on report importance.",
        "Historical archived records should remain available for reporting and audit purposes.",
        "Scope changes should be captured as contract changes or Phase 2 backlog items.",
    ]:
        body.append(bullet(item))

    body.append(para("10. Future Roadmap", "Heading1"))
    body.append(para("The following features are useful candidates for later phases, but are not required for Version 1 unless explicitly brought into scope."))
    for item in [
        "Configurable forms.",
        "Vehicle pre-departure and return checklists.",
        "Maintenance checklists.",
        "Digital signatures.",
        "Safety inspections.",
        "Multi-state support.",
        "Personnel register.",
        "Approval workflows.",
        "Advanced dashboard analytics and scheduled email reports.",
        "Integration with Microsoft 365, SharePoint, finance, or procurement systems.",
    ]:
        body.append(bullet(item))

    body.append(page_break())
    body.append(para("11. Immediate Next Steps", "Heading1"))
    for item in [
        "Confirm the MVP scope and any exclusions.",
        "Confirm the first pilot locations and users.",
        "Collect current asset, stock, maintenance, and deployment data.",
        "Confirm report/export priorities.",
        "Begin the first implementation slice: foundation, auth, roles, audit logging, and locations.",
    ]:
        body.append(numbered_restart(item))

    body.append(
        '<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/>'
        '<w:footerReference w:type="default" r:id="rIdFooter"/>'
        '<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>'
        '</w:sectPr>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        f"<w:body>{''.join(body)}</w:body></w:document>"
    )


def styles_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/><w:qFormat/>
    <w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BodyText">
    <w:name w:val="Body Text"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="24"/><w:color w:val="1F4D78"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="59"/><w:qFormat/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9DEE8"/><w:left w:val="single" w:sz="4" w:color="D9DEE8"/><w:bottom w:val="single" w:sz="4" w:color="D9DEE8"/><w:right w:val="single" w:sz="4" w:color="D9DEE8"/><w:insideH w:val="single" w:sz="4" w:color="D9DEE8"/><w:insideV w:val="single" w:sz="4" w:color="D9DEE8"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>"""


def numbering_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
  <w:abstractNum w:abstractNumId="3">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="3"><w:abstractNumId w:val="3"/></w:num>
</w:numbering>"""


def rels_xml() -> str:
    logo_rel = '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/saes-logo.png"/>' if LOGO.exists() else ""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  {logo_rel}
</Relationships>"""


def content_types_xml() -> str:
    png = '<Default Extension="png" ContentType="image/png"/>' if LOGO.exists() else ""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {png}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""


def header_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="right"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:color="D9DEE8"/></w:pBdr></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>SAES Asset Register - Client Brief</w:t></w:r></w:p>
</w:hdr>"""


def footer_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr><w:t>Page </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
</w:ftr>"""


def root_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def core_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Salvation Army Emergency Services Asset Register Client Brief</dc:title>
  <dc:creator>Alex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-09T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-09T00:00:00Z</dcterms:modified>
</cp:coreProperties>"""


def app_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Company>Regional Victoria Custom Software</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>"""


def build() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml())
        z.writestr("_rels/.rels", root_rels_xml())
        z.writestr("docProps/core.xml", core_xml())
        z.writestr("docProps/app.xml", app_xml())
        z.writestr("word/document.xml", build_document_xml())
        z.writestr("word/styles.xml", styles_xml())
        z.writestr("word/numbering.xml", numbering_xml())
        z.writestr("word/_rels/document.xml.rels", rels_xml())
        z.writestr("word/header1.xml", header_xml())
        z.writestr("word/footer1.xml", footer_xml())
        if LOGO.exists():
            z.write(LOGO, "word/media/saes-logo.png")
    print(OUT)


if __name__ == "__main__":
    build()
