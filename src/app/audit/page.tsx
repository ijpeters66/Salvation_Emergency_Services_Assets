import Link from "next/link";
import { redirect } from "next/navigation";
import { FileClock, Filter, PanelRightOpen } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  formatAuditAction,
  formatAuditJson,
  formatAuditRecordType,
  formatAuditTimestamp,
} from "@/lib/audit";
import { getAuditFilterOptions, listAuditLogs } from "@/lib/audit/server";
import { previewAuditEntries } from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSearchParams(
  params: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const normalised = getParam(value);
    if (normalised) {
      next.set(key, normalised);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  const query = next.toString();
  return query ? `/audit?${query}` : "/audit";
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = (await searchParams) ?? {};
  const isPreview = getParam(params.preview) === "1";
  const user = await getCurrentUserContext();

  if (!isPreview && user?.role !== "system_admin") {
    redirect("/dashboard");
  }

  const filters = {
    userId: getParam(params.userId) ?? "",
    actionType: getParam(params.actionType) ?? "",
    recordType: getParam(params.recordType) ?? "",
    dateFrom: getParam(params.dateFrom) ?? "",
    dateTo: getParam(params.dateTo) ?? "",
  };
  const selectedId = getParam(params.auditId) ?? "";
  const [entries, options] = isPreview
    ? [
        previewAuditEntries.filter((entry) => {
          if (filters.userId && entry.user_id !== filters.userId) return false;
          if (filters.actionType && entry.action_type !== filters.actionType) return false;
          if (filters.recordType && entry.record_type !== filters.recordType) return false;
          if (filters.dateFrom && entry.created_at.slice(0, 10) < filters.dateFrom) return false;
          if (filters.dateTo && entry.created_at.slice(0, 10) > filters.dateTo) return false;
          return true;
        }),
        {
          users: [
            { id: "preview-admin", label: "Alex Admin" },
            { id: "preview-user", label: "Operations User" },
          ],
          actionTypes: [...new Set(previewAuditEntries.map((entry) => entry.action_type))],
          recordTypes: [...new Set(previewAuditEntries.map((entry) => entry.record_type))],
        },
      ]
    : await Promise.all([
        listAuditLogs({
          userId: filters.userId || undefined,
          actionType: filters.actionType || undefined,
          recordType: filters.recordType || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }),
        getAuditFilterOptions(),
      ]);
  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? null;

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            Audit trail
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">Audit</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Review system activity, filter important changes, and inspect before/after values for
            compliance and troubleshooting.
          </p>
          {isPreview ? (
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
          ) : null}
        </div>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Filters</h2>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-5">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              User
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.userId}
                name="userId"
              >
                <option value="">All users</option>
                {options.users.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Action type
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.actionType}
                name="actionType"
              >
                <option value="">All actions</option>
                {options.actionTypes.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {formatAuditAction(actionType)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Record type
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={filters.recordType}
                name="recordType"
              >
                <option value="">All record types</option>
                {options.recordTypes.map((recordType) => (
                  <option key={recordType} value={recordType}>
                    {formatAuditRecordType(recordType)}
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
            <div className="flex items-end gap-3 md:col-span-5">
              <Button type="submit">Apply filters</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/audit">Clear</Link>
              </Button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
              <FileClock className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Audit events</h2>
            </div>
            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Audit events table showing timestamp, user, action, record type, record reference, and detail link.
                  </caption>
                  <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">When</th>
                      <th className="px-5 py-3 font-semibold">User</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold">Record</th>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {formatAuditTimestamp(entry.created_at)}
                        </td>
                        <td className="px-5 py-4 text-[var(--ink)]">{entry.userLabel}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {formatAuditAction(entry.action_type)}
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {formatAuditRecordType(entry.record_type)}
                        </td>
                        <td className="px-5 py-4">
                          {entry.recordHref ? (
                            <Link
                              className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                              href={entry.recordHref}
                            >
                              {entry.record_id}
                            </Link>
                          ) : (
                            <span className="text-[var(--muted)]">{entry.record_id}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Button asChild size="sm" variant="outline">
                            <Link href={buildSearchParams(params, { auditId: entry.id })}>
                              <PanelRightOpen className="size-4" aria-hidden="true" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                No audit records matched the current filters.
              </p>
            )}
          </section>

          <aside className="rounded-md border border-[var(--border)] bg-white p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center gap-2">
              <PanelRightOpen className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Audit detail</h2>
            </div>

            {selectedEntry ? (
              <div className="mt-4 grid gap-4">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="font-medium text-[var(--muted)]">When</dt>
                    <dd className="mt-1 text-[var(--ink)]">
                      {formatAuditTimestamp(selectedEntry.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--muted)]">User</dt>
                    <dd className="mt-1 text-[var(--ink)]">{selectedEntry.userLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--muted)]">Action</dt>
                    <dd className="mt-1 text-[var(--ink)]">
                      {formatAuditAction(selectedEntry.action_type)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--muted)]">Record type</dt>
                    <dd className="mt-1 text-[var(--ink)]">
                      {formatAuditRecordType(selectedEntry.record_type)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--muted)]">Record reference</dt>
                    <dd className="mt-1 break-all text-[var(--ink)]">
                      {selectedEntry.recordHref ? (
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={selectedEntry.recordHref}
                        >
                          {selectedEntry.record_id}
                        </Link>
                      ) : (
                        selectedEntry.record_id
                      )}
                    </dd>
                  </div>
                </dl>

                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">Old value</p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-6 text-[var(--ink)]">
                    {formatAuditJson(selectedEntry.old_value)}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">New value</p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-6 text-[var(--ink)]">
                    {formatAuditJson(selectedEntry.new_value)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Select an audit event to inspect its before/after payloads.
              </p>
            )}
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
