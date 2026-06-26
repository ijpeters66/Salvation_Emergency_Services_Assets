import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import {
  buildReport,
  buildReportFilename,
  canAccessReport,
  parseReportRequest,
  toCsvString,
} from "@/lib/reports";
import { buildReportExportMetadata } from "@/lib/reports/export";
import { generatePdfReport } from "@/lib/reports/pdf";
import { getReportSnapshot } from "@/lib/reports/server";
import { generateXlsxReport } from "@/lib/reports/xlsx";
import { getStoredReportBrandingSettings } from "@/lib/settings/server";

export const dynamic = "force-dynamic";

function buildDownloadResponse(
  body: BodyInit,
  contentType: string,
  filename: string,
) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = parseReportRequest(url.searchParams);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? "Invalid report export request." },
      { status: 400 },
    );
  }

  const reportRequest = parseResult.data;
  const user = await getCurrentUserContext();
  const isPreview = reportRequest.preview && !user;
  const role = isPreview ? "user" : user?.role ?? "user";

  if (!user && !isPreview) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessReport(reportRequest.reportId, role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await getReportSnapshot(role, { preview: isPreview });
  const report = buildReport(snapshot, reportRequest);
  const preparedBy =
    reportRequest.preparedBy ||
    user?.displayName ||
    user?.email ||
    (isPreview ? "Preview team" : "Operations team");
  const metadata = buildReportExportMetadata(report, preparedBy);
  const branding = await getStoredReportBrandingSettings();
  const baseFilename = buildReportFilename(reportRequest.reportId);

  switch (reportRequest.format) {
    case "csv": {
      const csv = toCsvString(report, metadata);
      return buildDownloadResponse(csv, "text/csv; charset=utf-8", `${baseFilename}.csv`);
    }
    case "pdf": {
      const pdfBytes = await generatePdfReport(report, branding, metadata);
      return buildDownloadResponse(
        Buffer.from(pdfBytes),
        "application/pdf",
        `${baseFilename}.pdf`,
      );
    }
    case "xlsx": {
      const xlsxBuffer = await generateXlsxReport(report, branding, metadata);
      return buildDownloadResponse(
        Buffer.from(xlsxBuffer),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `${baseFilename}.xlsx`,
      );
    }
  }
}
