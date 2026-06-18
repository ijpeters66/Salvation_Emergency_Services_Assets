import Link from "next/link";
import { Wrench } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { listAssets } from "@/lib/assets/server";
import { getScheduleAlertState } from "@/lib/maintenance/schedules";
import { listMaintenanceSchedules } from "@/lib/maintenance/server";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const [schedules, assets] = await Promise.all([
    listMaintenanceSchedules(),
    listAssets({}, "user"),
  ]);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const actionable = schedules
    .map((schedule) => ({
      schedule,
      asset: assetById.get(schedule.asset_id),
      alertState: getScheduleAlertState(schedule),
    }))
    .filter((item) => item.alertState !== "not_due");

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            Maintenance and compliance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            Maintenance
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Review due soon and overdue maintenance schedules for assets and plant/fleet items.
          </p>
        </div>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <Wrench className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Due maintenance</h2>
          </div>
          {actionable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Asset</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Due date</th>
                    <th className="px-5 py-3 font-semibold">Due reading</th>
                    <th className="px-5 py-3 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {actionable.map(({ schedule, asset, alertState }) => (
                    <tr key={schedule.id}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={`/assets/${schedule.asset_id}`}
                        >
                          {asset?.asset_name ?? "Unknown asset"}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{schedule.maintenance_type}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {schedule.next_service_due_date ?? "Not set"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {schedule.next_service_due_reading ?? "Not set"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{alertState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No due soon or overdue maintenance schedules are active.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
