import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Package, Route, Truck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DashboardTile } from "@/components/dashboard/dashboard-tile";
import { getCurrentUserContext } from "@/lib/auth";
import { getDashboardData, getDashboardPreviewData } from "@/lib/dashboard";
import { setupChecks } from "@/lib/navigation";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const isPreview = getParam(params.preview) === "1";
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const dashboard = isPreview ? getDashboardPreviewData() : await getDashboardData(role);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Operational overview
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
              Live operational summary for assets, consumables, maintenance, deployments, and recent activity.
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            {isPreview
              ? "Preview mode"
              : `Signed in as ${user?.displayName ?? user?.email ?? "Operational user"}`}
          </div>
        </div>

        {dashboard.errorMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {dashboard.errorMessage}
          </p>
        ) : null}

        {!dashboard.hasOperationalData ? (
          <section className="rounded-md border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">No live operational data yet</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Start by creating locations, assets, consumable batches, or maintenance schedules. The dashboard will
              fill in as the register becomes operational.
            </p>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {dashboard.metrics.map((metric) => (
            <DashboardTile
              description={metric.description}
              href={metric.href}
              icon={
                metric.label.includes("Deployment")
                  ? Truck
                  : metric.label.includes("Return")
                    ? Route
                    : metric.tone === "alert"
                      ? AlertTriangle
                      : Package
              }
              key={metric.label}
              label={metric.label}
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Assets by status</h2>
            </div>
            {dashboard.assetStatusSummary.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dashboard.assetStatusSummary.map((item) => (
                  <Link
                    className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--surface)]"
                    href={item.href}
                    key={item.status}
                  >
                    <span className="block text-sm font-semibold capitalize text-[var(--ink)]">{item.label}</span>
                    <span className="mt-2 block text-2xl font-semibold text-[var(--ink)]">{item.count}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">No active assets are available yet.</p>
            )}
          </section>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Foundation checks</h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              {setupChecks.map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <span className="size-1.5 rounded-full bg-[var(--brand-red)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Route className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Recent asset movements</h2>
            </div>
            {dashboard.recentAssetMovements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {dashboard.recentAssetMovements.map((movement) => (
                  <Link
                    className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--surface)]"
                    href={movement.href}
                    key={movement.id}
                  >
                    <span className="block font-medium text-[var(--ink)]">{movement.title}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{movement.subtitle}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">No asset movements have been recorded yet.</p>
            )}
          </section>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Recent stock movements</h2>
            </div>
            {dashboard.recentStockMovements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {dashboard.recentStockMovements.map((movement) => (
                  <Link
                    className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--surface)]"
                    href={movement.href}
                    key={movement.id}
                  >
                    <span className="block font-medium text-[var(--ink)]">{movement.title}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{movement.subtitle}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">No stock movements have been recorded yet.</p>
            )}
          </section>
        </div>
      </section>
    </AppShell>
  );
}
