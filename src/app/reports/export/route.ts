import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import {
  buildReport,
  buildReportFilename,
  canAccessReport,
  parseReportFilters,
  toCsvString,
} from "@/lib/reports";
import { getReportSnapshot } from "@/lib/reports/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = parseReportFilters(url.searchParams);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? "Invalid report filters." },
      { status: 400 },
    );
  }

  const filters = parseResult.data;
  const user = await getCurrentUserContext();
  const isPreview = filters.preview && !user;
  const role = isPreview ? "user" : user?.role ?? "user";

  if (!user && !isPreview) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessReport(filters.reportId, role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await getReportSnapshot(role, { preview: isPreview });
  const report = buildReport(snapshot, filters);
  const preparedBy =
    filters.preparedBy ||
    user?.displayName ||
    user?.email ||
    (isPreview ? "Preview team" : "Operations team");
  const csv = toCsvString(report, {
    generatedAt: new Date().toISOString(),
    preparedBy,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildReportFilename(filters.reportId)}"`,
      "Cache-Control": "no-store",
    },
  });
}
