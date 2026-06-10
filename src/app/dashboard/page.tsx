import { AlertTriangle, ClipboardCheck, Package, PackageCheck, Truck, Wrench } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { setupChecks } from "@/lib/navigation";

const dashboardTiles = [
  { label: "Total assets", value: "0", helper: "Register setup pending", icon: Package },
  { label: "Consumable stock", value: "0", helper: "Batch tracking pending", icon: PackageCheck },
  { label: "Active deployments", value: "0", helper: "Deployment workflow pending", icon: Truck },
  { label: "Maintenance alerts", value: "0", helper: "Schedules pending", icon: Wrench },
] as const;

export default function DashboardPage() {
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
              Foundation route for asset, consumable, deployment, maintenance, and reporting alerts.
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            Protected app shell placeholder
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardTiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <article
                className="rounded-md border border-[var(--border)] bg-white p-5"
                key={tile.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-[var(--muted)]">{tile.label}</h2>
                  <Icon className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-[var(--ink)]">{tile.value}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{tile.helper}</p>
              </article>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Alert placeholders</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Low stock, overdue maintenance, registration expiry, active deployments, and recent
              movements will appear here once their data slices are implemented.
            </p>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Foundation checks</h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              {setupChecks.map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <span
                    className="size-1.5 rounded-full bg-[var(--brand-red)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
