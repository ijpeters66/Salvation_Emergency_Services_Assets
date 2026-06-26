import type { BuiltReport, ReportFilters, ReportId } from "@/lib/reports";
import type { ReportBrandingSettings } from "@/lib/report-branding";

export const reportExportFormats = ["csv", "pdf", "xlsx"] as const;

export type ReportExportFormat = (typeof reportExportFormats)[number];

export type ReportExportMetadata = {
  generatedAt: string;
  preparedBy: string;
  filtersApplied: string;
};

export function buildReportExportMetadata(
  report: BuiltReport,
  preparedBy: string,
  generatedAt = new Date().toISOString(),
): ReportExportMetadata {
  return {
    generatedAt,
    preparedBy,
    filtersApplied:
      report.appliedFilters.length > 0 ? report.appliedFilters.join("; ") : "None",
  };
}

export function getReportPdfTitle(
  report: BuiltReport,
  branding: ReportBrandingSettings,
) {
  return `${branding.productName} - ${report.definition.title}`;
}

export function getReportPdfMetadata(
  report: BuiltReport,
  branding: ReportBrandingSettings,
  metadata: ReportExportMetadata,
) {
  return {
    title: getReportPdfTitle(report, branding),
    author: metadata.preparedBy,
    creator: branding.productName,
    producer: branding.organizationName,
    subject: `${report.definition.title} export`,
    keywords: [branding.logoText, report.definition.title, "report export", "asset register"],
  };
}

export function supportsPdfExport(reportId: ReportId) {
  return reportId !== "assets-by-location" && reportId !== "assets-by-status";
}

export function supportsXlsxExport(reportId: ReportId) {
  void reportId;
  return true;
}

export function buildFormatAwareExportHref(
  reportId: ReportId,
  filters: ReportFilters,
  format: ReportExportFormat,
) {
  const params = new URLSearchParams();
  params.set("reportId", reportId);
  params.set("format", format);

  if (filters.locationId) params.set("locationId", filters.locationId);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.preparedBy) params.set("preparedBy", filters.preparedBy);
  if (filters.preview) params.set("preview", "1");

  return `/reports/export?${params.toString()}`;
}
