import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { getDefaultReportBrandingSettings } from "@/lib/report-branding";
import { buildPreviewReportSnapshot, buildReport } from "@/lib/reports";
import {
  buildReportExportMetadata,
  getReportPdfMetadata,
} from "@/lib/reports/export";
import { generateXlsxReport } from "@/lib/reports/xlsx";

function createReport() {
  return buildReport(buildPreviewReportSnapshot(), {
    reportId: "asset-register",
    locationId: "",
    categoryId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    preparedBy: "",
    preview: true,
  });
}

describe("report exports", () => {
  it("creates branded PDF metadata", () => {
    const branding = getDefaultReportBrandingSettings();
    const report = createReport();
    const metadata = buildReportExportMetadata(report, "QA Preview", "2026-06-26T10:00:00.000Z");

    expect(getReportPdfMetadata(report, branding, metadata)).toEqual(
      expect.objectContaining({
        title: "SAES Asset Register - Asset Register",
        author: "QA Preview",
        creator: "SAES Asset Register",
      }),
    );
  });

  it("creates an XLSX workbook with metadata and report headers", async () => {
    const branding = getDefaultReportBrandingSettings();
    const report = createReport();
    const metadata = buildReportExportMetadata(report, "QA Preview", "2026-06-26T10:00:00.000Z");
    const buffer = await generateXlsxReport(report, branding, metadata);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer));
    const worksheet = workbook.getWorksheet("Report");

    expect(worksheet).toBeDefined();
    expect(worksheet?.getCell("A1").value).toBe("Salvation Emergency Services");
    expect(worksheet?.getCell("A2").value).toBe("Asset Register");
    expect(worksheet?.getCell("B3").value).toBe("QA Preview");
    expect(worksheet?.getCell("A6").value).toBe("Asset");
  });

  it("applies custom branding settings to the generated workbook", async () => {
    const branding = {
      ...getDefaultReportBrandingSettings(),
      organizationName: "Custom Ops",
      productName: "Custom Register",
      primaryColor: "#112233",
    };
    const report = createReport();
    const metadata = buildReportExportMetadata(report, "QA Preview", "2026-06-26T10:00:00.000Z");
    const buffer = await generateXlsxReport(report, branding, metadata);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer));
    const worksheet = workbook.getWorksheet("Report");

    expect(worksheet?.getCell("A1").value).toBe("Custom Ops");
    expect(workbook.creator).toBe("Custom Register");
  });
});
