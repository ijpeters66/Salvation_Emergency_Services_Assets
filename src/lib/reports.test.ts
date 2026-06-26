import { describe, expect, it } from "vitest";

import {
  buildPreviewReportSnapshot,
  buildReport,
  escapeCsvValue,
  parseReportFilters,
  toCsvString,
} from "@/lib/reports";

describe("reports", () => {
  it("escapes CSV values with commas, quotes, and newlines", () => {
    expect(escapeCsvValue('hello "team"')).toBe('"hello ""team"""');
    expect(escapeCsvValue("alpha,beta")).toBe('"alpha,beta"');
    expect(escapeCsvValue("line 1\nline 2")).toBe('"line 1\nline 2"');
  });

  it("validates report filter date ranges", () => {
    const result = parseReportFilters(
      new URLSearchParams({
        reportId: "asset-register",
        dateFrom: "2026-06-27",
        dateTo: "2026-06-26",
      }),
    );

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]?.message).toContain("Date from cannot be later");
  });

  it("builds asset register report rows from the report snapshot", () => {
    const snapshot = buildPreviewReportSnapshot();
    const report = buildReport(snapshot, {
      reportId: "asset-register",
      locationId: "",
      categoryId: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      preparedBy: "",
      preview: true,
    });

    expect(report.definition.title).toBe("Asset Register");
    expect(report.rows).toHaveLength(2);
    expect(report.rows[0]).toEqual(
      expect.objectContaining({
        Asset: "Support Vehicle 1",
        Category: "Vehicles",
        Location: "Ballarat Depot",
        Status: "Available",
      }),
    );
  });

  it("includes report metadata when generating CSV output", () => {
    const snapshot = buildPreviewReportSnapshot();
    const report = buildReport(snapshot, {
      reportId: "asset-register",
      locationId: "",
      categoryId: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      preparedBy: "",
      preview: true,
    });

    const csv = toCsvString(report, {
      generatedAt: "2026-06-26T10:00:00.000Z",
      preparedBy: "QA Preview",
    });

    expect(csv).toContain("Report Title,Asset Register");
    expect(csv).toContain("Prepared By,QA Preview");
    expect(csv).toContain("Asset,Asset ID,Category,Location,Status,Serial Number,Current Value,QR Code");
  });
});
