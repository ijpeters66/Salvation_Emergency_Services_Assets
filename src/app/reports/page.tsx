import Link from "next/link";
import { BarChart3, Download, ExternalLink, FileSpreadsheet, FileText, Filter } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  buildReport,
  canAccessReport,
  getRelatedReportHref,
  parseReportFilters,
  reportDefinitions,
} from "@/lib/reports";
import {
  buildFormatAwareExportHref,
  supportsPdfExport,
  supportsXlsxExport,
} from "@/lib/reports/export";
import { getReportSnapshot } from "@/lib/reports/server";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const assetStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "deployed", label: "Deployed" },
  { value: "under_maintenance", label: "Under maintenance" },
  { value: "retired", label: "Retired" },
];

const lowStockStatusOptions = [
  { value: "", label: "All alert states" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const maintenanceStatusOptions = [
  { value: "", label: "All due states" },
  { value: "due_soon", label: "Due soon" },
  { value: "overdue", label: "Overdue" },
];

const deploymentStatusOptions = [
  { value: "", label: "All deployment statuses" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
  { value: "closed", label: "Closed" },
];

function getStatusOptions(reportId: string) {
  switch (reportId) {
    case "asset-register":
    case "asset-value":
    case "assets-by-location":
    case "assets-by-status":
      return assetStatusOptions;
    case "low-stock-report":
    case "consumables-by-location":
      return lowStockStatusOptions;
    case "maintenance-due-report":
      return maintenanceStatusOptions;
    case "deployment-history":
      return deploymentStatusOptions;
    default:
      return [{ value: "", label: "All statuses" }];
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const parseResult = parseReportFilters(params);
  const filters = parseResult.success
    ? parseResult.data
    : {
        reportId: "asset-register" as const,
        locationId: "",
        categoryId: "",
        status: "",
        dateFrom: "",
        dateTo: "",
        preparedBy: "",
        preview: false,
      };
  const isPreview = filters.preview && !user;
  const role = isPreview ? "user" : user?.role ?? "user";
  const snapshot = user || isPreview ? await getReportSnapshot(role, { preview: isPreview }) : null;
  const availableReports = reportDefinitions.filter((report) => canAccessReport(report.id, role));
  const selectedReport = snapshot ? buildReport(snapshot, filters) : null;
  const statusOptions = getStatusOptions(filters.reportId);
  const clearFiltersHref = isPreview ? "/reports?preview=1" : "/reports";

  return (
    <AppShell>
      <section className="grid gap-6">
        <PageHero
          aside={
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,white)] bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                {isPreview
                  ? "Preview mode"
                  : user
                    ? "Signed in"
                    : "Export access"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {user
                  ? `Signed in as ${user.displayName ?? user.email}`
                  : "Sign in to export live operational data"}
              </p>
            </div>
          }
          description="Generate operational CSV exports for assets, consumables, maintenance, deployments, and audit-ready reporting."
          eyebrow="Reporting and exports"
          title="Reports"
        />

        {!parseResult.success ? (
          <Notice title="Report filter issue" variant="error">
            {parseResult.error.issues[0]?.message ?? "Check the report filters and try again."}
          </Notice>
        ) : null}

        <section className="panel-card-soft p-5">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Filters</h2>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Report
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.reportId}
                name="reportId"
              >
                {availableReports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Location
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.locationId}
                name="locationId"
              >
                <option value="">All locations</option>
                {(snapshot?.locations ?? []).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Category
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.categoryId}
                name="categoryId"
              >
                <option value="">All categories</option>
                {filters.reportId.startsWith("asset")
                  ? (snapshot?.assetCategories ?? []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  : (snapshot?.consumableCategories ?? []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Status
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.status}
                name="status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Date from
              <input
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.dateFrom}
                name="dateFrom"
                type="date"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Date to
              <input
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.dateTo}
                name="dateTo"
                type="date"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Prepared by
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.preparedBy}
                name="preparedBy"
                placeholder={user?.displayName ?? user?.email ?? "Operations team"}
              />
            </label>
            {isPreview ? <input name="preview" type="hidden" value="1" /> : null}
            <div className="flex items-end gap-3 xl:col-span-1">
              <Button type="submit">Apply filters</Button>
              <Button asChild type="button" variant="outline">
                <Link href={isPreview ? "/reports?preview=1" : "/reports"}>Clear</Link>
              </Button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {availableReports.map((report) => {
            const relatedHref = getRelatedReportHref(report.id, filters);
            const isSelected = filters.reportId === report.id;

            return (
              <article
                className={`grid gap-3 rounded-md border bg-white p-5 ${
                  isSelected
                    ? "border-[var(--brand-red)]"
                    : "border-[var(--border)]"
                }`}
                key={report.id}
              >
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">{report.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{report.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={buildFormatAwareExportHref(report.id, filters, "csv")}>
                      <Download className="size-4" aria-hidden="true" />
                      CSV
                    </Link>
                  </Button>
                  {supportsXlsxExport(report.id) ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={buildFormatAwareExportHref(report.id, filters, "xlsx")}>
                        <FileSpreadsheet className="size-4" aria-hidden="true" />
                        XLSX
                      </Link>
                    </Button>
                  ) : null}
                  {supportsPdfExport(report.id) ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={buildFormatAwareExportHref(report.id, filters, "pdf")}>
                        <FileText className="size-4" aria-hidden="true" />
                        PDF
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={relatedHref}>
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Open module
                    </Link>
                  </Button>
                </div>
                {report.requiresAdmin ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    Admin only
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <BarChart3 className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              {selectedReport?.definition.title ?? "Report preview"}
            </h2>
            <div className="ml-auto hidden text-sm text-[var(--muted)] sm:block">
              PDF and XLSX pull from the same report query used for CSV exports.
            </div>
          </div>
          {selectedReport ? (
            selectedReport.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
                  <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      {selectedReport.columns.map((column) => (
                        <th className="px-5 py-3 font-semibold" key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {selectedReport.rows.slice(0, 12).map((row, index) => (
                      <tr key={`${selectedReport.definition.id}-${index}`}>
                        {selectedReport.columns.map((column) => (
                          <td className="px-5 py-4 text-[var(--muted)]" key={column}>
                            {row[column] == null || row[column] === "" ? "—" : String(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 px-5 py-8">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">No records match the current filters.</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Clear the current filters or choose a different report to get back to a useful dataset.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={clearFiltersHref}>Clear filters</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/reports?reportId=${availableReports[0]?.id ?? "asset-register"}${isPreview ? "&preview=1" : ""}`}>
                      Reset report
                    </Link>
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="grid gap-3 px-5 py-8">
              <p className="text-sm font-medium text-[var(--ink)]">
                Sign in or open preview mode to generate report data.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Reporting stays read-only until the data connection is available, so this view will wait for a live
                session or preview data.
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
