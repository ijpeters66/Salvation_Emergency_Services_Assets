import ExcelJS from "exceljs";

import type { ReportBrandingSettings } from "@/lib/report-branding";
import type { BuiltReport } from "@/lib/reports";
import type { ReportExportMetadata } from "@/lib/reports/export";

function asExcelColor(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

export async function generateXlsxReport(
  report: BuiltReport,
  branding: ReportBrandingSettings,
  metadata: ReportExportMetadata,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = branding.productName;
  workbook.lastModifiedBy = metadata.preparedBy;
  workbook.created = new Date(metadata.generatedAt);
  workbook.modified = new Date(metadata.generatedAt);
  workbook.subject = `${report.definition.title} export`;
  workbook.title = `${branding.productName} - ${report.definition.title}`;
  workbook.company = branding.organizationName;

  const worksheet = workbook.addWorksheet("Report", {
    views: [{ state: "frozen", ySplit: 6 }],
    properties: { defaultColWidth: 18 },
  });

  worksheet.mergeCells("A1", "D1");
  worksheet.getCell("A1").value = branding.organizationName;
  worksheet.getCell("A1").font = {
    name: branding.fontFamily,
    bold: true,
    size: 16,
    color: { argb: asExcelColor(branding.secondaryColor) },
  };

  worksheet.mergeCells("A2", "F2");
  worksheet.getCell("A2").value = report.definition.title;
  worksheet.getCell("A2").font = {
    name: branding.fontFamily,
    bold: true,
    size: 13,
    color: { argb: asExcelColor(branding.primaryColor) },
  };

  worksheet.getCell("A3").value = "Prepared by";
  worksheet.getCell("B3").value = metadata.preparedBy;
  worksheet.getCell("C3").value = "Generated";
  worksheet.getCell("D3").value = metadata.generatedAt;

  worksheet.getCell("A4").value = "Filters";
  worksheet.mergeCells("B4", "F4");
  worksheet.getCell("B4").value = metadata.filtersApplied;

  const headerRowIndex = 6;
  const headerRow = worksheet.getRow(headerRowIndex);
  report.columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column;
    cell.font = {
      name: branding.fontFamily,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: asExcelColor(branding.primaryColor) },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9DEE8" } },
      left: { style: "thin", color: { argb: "FFD9DEE8" } },
      bottom: { style: "thin", color: { argb: "FFD9DEE8" } },
      right: { style: "thin", color: { argb: "FFD9DEE8" } },
    };
  });

  report.rows.forEach((row, rowIndex) => {
    const worksheetRow = worksheet.getRow(headerRowIndex + 1 + rowIndex);
    report.columns.forEach((column, columnIndex) => {
      const cell = worksheetRow.getCell(columnIndex + 1);
      cell.value = row[column] == null ? "" : String(row[column]);
      cell.font = { name: branding.fontFamily, size: 11 };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9DEE8" } },
        left: { style: "thin", color: { argb: "FFD9DEE8" } },
        bottom: { style: "thin", color: { argb: "FFD9DEE8" } },
        right: { style: "thin", color: { argb: "FFD9DEE8" } },
      };
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: asExcelColor(branding.surfaceColor) },
        };
      }
    });
  });

  report.columns.forEach((column, index) => {
    const maxValueLength = Math.max(
      column.length,
      ...report.rows.map((row) => String(row[column] ?? "").length),
    );
    worksheet.getColumn(index + 1).width = Math.min(Math.max(maxValueLength + 2, 14), 28);
  });

  return workbook.xlsx.writeBuffer();
}
