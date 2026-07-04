import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Package, QrCode, Route, Truck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DashboardTile } from "@/components/dashboard/dashboard-tile";
import { PageHero } from "@/components/page-hero";
import { ShortcutLinks } from "@/components/shortcut-links";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getDashboardData, getDashboardPreviewData } from "@/lib/dashboard";
import { onboardingSteps } from "@/lib/navigation";

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
  const isAdmin = role === "system_admin";
  const dashboard = isPreview ? getDashboardPreviewData() : await getDashboardData(role);
  const savedViews = [
    {
      label: "Overdue maintenance",
      description: "Jump to the schedules that need attention first.",
      href: "/maintenance?alert=overdue",
    },
    {
      label: "Low stock",
      description: "Open the consumable batches that need replenishing.",
      href: "/consumables?alert=low-stock",
    },
    {
      label: "Active deployments",
      description: "Review gear and stock currently in the field.",
      href: "/deployments?status=active",
    },
    {
      label: "Assets by status",
      description: "See available, deployed, or maintenance items at a glance.",
      href: "/assets",
    },
  ];
  const attentionItems = [
    {
      label: "Overdue maintenance",
      value: dashboard.overdueMaintenance,
      href: "/maintenance?alert=overdue",
      cta: "Review maintenance",
    },
    {
      label: "Low stock items",
      value: dashboard.lowStockItems,
      href: "/consumables?alert=low-stock",
      cta: "Restock consumables",
    },
    {
      label: "Out-of-stock items",
      value: dashboard.outOfStockItems,
      href: "/consumables?alert=out-of-stock",
      cta: "Issue stock",
    },
    {
      label: "Assets overdue for return",
      value: dashboard.assetsOverdueForReturn,
      href: "/deployments?status=active&overdueReturn=1",
      cta: "Review deployments",
    },
  ].filter((item) => item.value > 0);

  return (
    <AppShell>
      <section className="grid gap-6">
        <PageHero
          actions={
            <>
              <Button asChild>
                <Link href="/scan">
                  <QrCode className="size-4" aria-hidden="true" />
                  Open scan
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/assets">
                  <Package className="size-4" aria-hidden="true" />
                  Review assets
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/maintenance">
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  Check maintenance
                </Link>
              </Button>
            </>
          }
          aside={
            <div className="grid gap-2 rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,white)] bg-white/70 p-4 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                Current context
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                {isPreview
                  ? "Preview mode"
                  : `Signed in as ${user?.displayName ?? user?.email ?? "Operational user"}`}
              </p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Live operational summary for assets, consumables, maintenance, deployments, and recent activity.
              </p>
            </div>
          }
          description="Live operational summary for assets, consumables, maintenance, deployments, and recent activity."
          eyebrow="Operational overview"
          title="Dashboard"
        />

        {dashboard.errorMessage ? (
          <Notice title="Dashboard data issue" variant="warning">
            {dashboard.errorMessage}
          </Notice>
        ) : null}

        <section className="page-hero grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr] lg:p-6">
          <div className="grid gap-3">
            <p className="section-kicker text-xs font-semibold text-[var(--brand-red)]">
              What needs attention now
            </p>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
                Start with the urgent work
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Keep the team moving by handling overdue maintenance, low stock, and live deployments before the
                rest of the register.
              </p>
            </div>
          </div>
          <div />
        </section>

        <ShortcutLinks
          description="Saved views for the work people repeat most often."
          items={savedViews}
          title="Saved views"
        />

        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="panel-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-[var(--ink)]">Priority queue</h2>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                {attentionItems.length > 0 ? `${attentionItems.length} items` : "All clear"}
              </span>
            </div>
            {attentionItems.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {attentionItems.map((item) => (
                  <Link
                    className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] p-4 transition-colors hover:bg-[var(--surface)]"
                    href={item.href}
                    key={item.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--ink)]">{item.label}</span>
                      <span className="text-2xl font-semibold text-[var(--brand-red)]">{item.value}</span>
                    </div>
                    <span className="mt-2 block text-sm text-[var(--muted)]">{item.cta}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-medium text-[var(--ink)]">Nothing is overdue right now.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Use the scan flow or create new records to keep the register moving.
                </p>
              </div>
            )}
          </div>

          <div className="panel-card-soft p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Getting started</h2>
            </div>
            {!dashboard.hasOperationalData ? (
              <div className="mt-4 grid gap-4">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Start with the setup order that matches the field workflow: locations first, then
                  categories, then assets and stock.
                </p>
                <div className="grid gap-3">
                  {onboardingSteps.map((step, index) => (
                    <Link
                      className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] bg-white/80 p-4 transition-colors hover:bg-[var(--surface)]"
                      href={step.href}
                      key={step.title}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                        Step {index + 1}
                      </span>
                      <span className="mt-1 block font-medium text-[var(--ink)]">{step.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                        {step.description}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/locations">Start with locations</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/settings">Set up categories</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  The register is live. Use the saved views above, then jump into the highest-value workflows.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/scan">Scan item</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/assets">Browse assets</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/maintenance">Open maintenance</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

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

        {dashboard.hasOperationalData ? (
          <section className="panel-card-soft p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">First-time checklist</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Useful when you are onboarding a new crew member or setting up a fresh site.
                </p>
              </div>
            </div>
            <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {onboardingSteps.map((step, index) => (
                <li
                  className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] bg-white/80 p-4"
                  key={step.title}
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                    Step {index + 1}
                  </span>
                  <span className="mt-1 block font-medium text-[var(--ink)]">{step.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{step.description}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <section className="panel-card p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Assets by status</h2>
            </div>
            {dashboard.assetStatusSummary.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dashboard.assetStatusSummary.map((item) => (
                  <Link
                    className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] p-4 hover:bg-[var(--surface)]"
                    href={item.href}
                    key={item.status}
                  >
                    <span className="block text-sm font-semibold capitalize text-[var(--ink)]">{item.label}</span>
                    <span className="mt-2 block text-2xl font-semibold text-[var(--ink)]">{item.count}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-medium text-[var(--ink)]">No active assets are available yet.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Once assets are added, this section will group them by status for quicker scanning.
                </p>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href="/assets">Add or review assets</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="panel-card-soft p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                {isAdmin ? "Admin context" : "Operational context"}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {isAdmin
                ? "You can manage users, categories, thresholds, and reports from Settings. Ordinary users do not see those screens."
                : "You are in the field operator view. Admin screens stay hidden so the daily workflow stays simple."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {isAdmin ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings">Open Settings</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href="/scan">Open scan flow</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reports">Open reports</Link>
              </Button>
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel-card p-5">
            <div className="flex items-center gap-2">
              <Route className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Recent asset movements</h2>
            </div>
            {dashboard.recentAssetMovements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {dashboard.recentAssetMovements.map((movement) => (
                  <Link
                    className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] p-4 hover:bg-[var(--surface)]"
                    href={movement.href}
                    key={movement.id}
                  >
                    <span className="block font-medium text-[var(--ink)]">{movement.title}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{movement.subtitle}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-medium text-[var(--ink)]">No asset movements have been recorded yet.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  When an asset is moved, returned, or deployed, the latest change will appear here.
                </p>
              </div>
            )}
          </section>

          <section className="panel-card-soft p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Recent stock movements</h2>
            </div>
            {dashboard.recentStockMovements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {dashboard.recentStockMovements.map((movement) => (
                  <Link
                    className="rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] p-4 hover:bg-[var(--surface)]"
                    href={movement.href}
                    key={movement.id}
                  >
                    <span className="block font-medium text-[var(--ink)]">{movement.title}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{movement.subtitle}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-medium text-[var(--ink)]">No stock movements have been recorded yet.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Issuing or receiving consumables will start the movement history for this register.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </AppShell>
  );
}
