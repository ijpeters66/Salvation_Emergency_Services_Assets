import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { ReportBrandingSettings } from "@/lib/report-branding";
import type { BuiltReport } from "@/lib/reports";
import { getReportPdfMetadata, type ReportExportMetadata } from "@/lib/reports/export";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 40;
const HEADER_HEIGHT = 90;
const FOOTER_HEIGHT = 24;
const ROW_HEIGHT = 18;

function hexToRgb(hex: string) {
  const normalised = hex.replace("#", "");
  const value = parseInt(normalised, 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function drawHeader(
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  report: BuiltReport,
  branding: ReportBrandingSettings,
  metadata: ReportExportMetadata,
) {
  const primary = hexToRgb(branding.primaryColor);
  const secondary = hexToRgb(branding.secondaryColor);
  const accent = hexToRgb(branding.accentColor);
  const top = A4_HEIGHT - MARGIN;

  page.drawRectangle({
    x: MARGIN,
    y: top - 44,
    width: 44,
    height: 44,
    color: primary,
  });

  page.drawText(branding.logoText, {
    x: MARGIN + 7,
    y: top - 28,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(branding.organizationName, {
    x: MARGIN + 56,
    y: top - 12,
    size: 11,
    font: fontBold,
    color: secondary,
  });

  page.drawText(branding.tagline, {
    x: MARGIN + 56,
    y: top - 28,
    size: 9,
    font: fontRegular,
    color: accent,
  });

  page.drawText(report.definition.title, {
    x: MARGIN,
    y: top - 64,
    size: 18,
    font: fontBold,
    color: secondary,
  });

  page.drawText(`Generated: ${metadata.generatedAt}`, {
    x: MARGIN,
    y: top - 80,
    size: 9,
    font: fontRegular,
    color: secondary,
  });

  page.drawText(`Prepared by: ${metadata.preparedBy}`, {
    x: 250,
    y: top - 80,
    size: 9,
    font: fontRegular,
    color: secondary,
  });

  page.drawText(`Filters: ${truncate(metadata.filtersApplied, 62)}`, {
    x: MARGIN,
    y: top - 94,
    size: 9,
    font: fontRegular,
    color: secondary,
  });
}

function drawFooter(
  page: PDFPage,
  fontRegular: PDFFont,
  branding: ReportBrandingSettings,
  pageNumber: number,
  pageCount: number,
) {
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_HEIGHT + 8 },
    end: { x: A4_WIDTH - MARGIN, y: FOOTER_HEIGHT + 8 },
    thickness: 1,
    color: hexToRgb(branding.surfaceColor),
  });

  page.drawText(branding.productName, {
    x: MARGIN,
    y: FOOTER_HEIGHT - 2,
    size: 8,
    font: fontRegular,
    color: hexToRgb(branding.secondaryColor),
  });

  page.drawText(`Page ${pageNumber} of ${pageCount}`, {
    x: A4_WIDTH - MARGIN - 60,
    y: FOOTER_HEIGHT - 2,
    size: 8,
    font: fontRegular,
    color: hexToRgb(branding.secondaryColor),
  });
}

function drawTablePage(
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  report: BuiltReport,
  branding: ReportBrandingSettings,
  rows: Array<Record<string, string | number | null>>,
  rowOffset: number,
) {
  const contentTop = A4_HEIGHT - MARGIN - HEADER_HEIGHT;
  const tableWidth = A4_WIDTH - MARGIN * 2;
  const columnCount = report.columns.length;
  const columnWidth = tableWidth / Math.max(1, columnCount);
  const fontSize = columnCount >= 9 ? 6.5 : columnCount >= 7 ? 7.5 : 8.5;
  const headerY = contentTop - ROW_HEIGHT;

  page.drawRectangle({
    x: MARGIN,
    y: headerY,
    width: tableWidth,
    height: ROW_HEIGHT,
    color: hexToRgb(branding.primaryColor),
  });

  report.columns.forEach((column, index) => {
    page.drawText(truncate(column, Math.max(8, Math.floor(columnWidth / 4))), {
      x: MARGIN + index * columnWidth + 4,
      y: headerY + 5,
      size: fontSize,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  });

  rows.forEach((row, rowIndex) => {
    const y = headerY - (rowIndex + 1) * ROW_HEIGHT;
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: MARGIN,
        y,
        width: tableWidth,
        height: ROW_HEIGHT,
        color: hexToRgb(branding.surfaceColor),
      });
    }

    report.columns.forEach((column, columnIndex) => {
      const value = row[column];
      page.drawText(
        truncate(value == null || value === "" ? "—" : String(value), Math.max(8, Math.floor(columnWidth / 4))),
        {
          x: MARGIN + columnIndex * columnWidth + 4,
          y: y + 5,
          size: fontSize,
          font: fontRegular,
          color: hexToRgb(branding.secondaryColor),
        },
      );
    });
  });

  return rowOffset + rows.length;
}

export async function generatePdfReport(
  report: BuiltReport,
  branding: ReportBrandingSettings,
  metadata: ReportExportMetadata,
) {
  const document = await PDFDocument.create();
  const fontRegular = await document.embedFont(StandardFonts.Helvetica);
  const fontBold = await document.embedFont(StandardFonts.HelveticaBold);
  const pdfMetadata = getReportPdfMetadata(report, branding, metadata);
  const rowsPerPage = 26;
  const chunks = Array.from(
    { length: Math.max(1, Math.ceil(report.rows.length / rowsPerPage)) },
    (_, index) => report.rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
  );

  document.setTitle(pdfMetadata.title);
  document.setAuthor(pdfMetadata.author);
  document.setCreator(pdfMetadata.creator);
  document.setProducer(pdfMetadata.producer);
  document.setSubject(pdfMetadata.subject);
  document.setKeywords(pdfMetadata.keywords);

  let rowOffset = 0;

  chunks.forEach((chunk) => {
    const page = document.addPage([A4_WIDTH, A4_HEIGHT]);
    drawHeader(page, fontBold, fontRegular, report, branding, metadata);
    rowOffset = drawTablePage(page, fontBold, fontRegular, report, branding, chunk, rowOffset);
  });

  const pages = document.getPages();
  pages.forEach((page, index) => {
    drawFooter(page, fontRegular, branding, index + 1, pages.length);
  });

  return document.save();
}
