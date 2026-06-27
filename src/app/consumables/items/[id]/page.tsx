import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { upsertStockThresholdAction } from "@/app/consumables/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  getConsumableItemById,
  listConsumableBatches,
  listStockThresholds,
} from "@/lib/consumables/server";
import { buildStockAlerts } from "@/lib/consumables/thresholds";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";
import {
  getPreviewConsumableItemById,
  getPreviewLocationOptions,
  previewConsumableBatches,
  previewStockThresholds,
} from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

type ConsumableItemPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsumableItemPage({
  params,
  searchParams,
}: ConsumableItemPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const isPreview = getParam(query.preview) === "1";
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";

  if (isPreview && !user) {
    const item = getPreviewConsumableItemById(id);

    if (!item) {
      notFound();
    }

    const locations = getPreviewLocationOptions();
    const itemThresholds = previewStockThresholds.filter((threshold) => threshold.consumable_item_id === id);
    const itemBatches = previewConsumableBatches.filter((batch) => batch.item_id === id);
    const alerts = buildStockAlerts(itemThresholds as never[], itemBatches as never[]);

    return (
      <AppShell>
        <section className="grid gap-6">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/consumables?preview=1">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Consumables
              </Link>
            </Button>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Consumable item
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              {item.name}
            </h1>
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
          </div>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Threshold management</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Location
                <select className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base">
                  {locations.map((location) => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Minimum quantity
                <input className="h-10 rounded-md border border-[var(--border)] px-3 text-base" defaultValue="4" />
              </label>
              <div className="flex items-end">
                <Button type="button">Save threshold</Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-lg font-semibold text-[var(--ink)]">Stock by location</h2>
            </div>
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                  <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Location</th>
                      <th className="px-5 py-3 font-semibold">Current</th>
                      <th className="px-5 py-3 font-semibold">Minimum</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {alerts.map((alert) => (
                      <tr key={alert.threshold.id}>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {locations.find((location) => location.value === alert.threshold.location_id)?.label}
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{alert.currentQuantity}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">{alert.threshold.minimum_quantity}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">{alert.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                No thresholds have been set for this item yet.
              </p>
            )}
          </section>
        </section>
      </AppShell>
    );
  }

  const item = await getConsumableItemById(id);

  if (!item) {
    notFound();
  }

  const [locationRows, thresholds, batches] = await Promise.all([
    listLocations(false, role),
    listStockThresholds(),
    listConsumableBatches({}, role),
  ]);
  const locations = toLocationOptions(locationRows);
  const itemThresholds = thresholds.filter((threshold) => threshold.consumable_item_id === id);
  const itemBatches = batches.filter((batch) => batch.item_id === id);
  const alerts = buildStockAlerts(itemThresholds, itemBatches);
  const statusMessage = getParam(query.statusMessage);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/consumables">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Consumables
            </Link>
          </Button>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            Consumable item
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {item.name}
          </h1>
        </div>

        {statusMessage === "threshold-saved" ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            Stock threshold saved.
          </p>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Threshold management</h2>
          <form action={upsertStockThresholdAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input name="consumableItemId" type="hidden" value={item.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Location
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="locationId"
                required
              >
                <option value="">Choose location</option>
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Minimum quantity
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                min="0"
                name="minimumQuantity"
                required
                type="number"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit">Save threshold</Button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Stock by location</h2>
          </div>
          {alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Current</th>
                    <th className="px-5 py-3 font-semibold">Minimum</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {alerts.map((alert) => (
                    <tr key={alert.threshold.id}>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {locations.find(
                          (location) => location.value === alert.threshold.location_id,
                        )?.label ?? "Unknown location"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{alert.currentQuantity}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {alert.threshold.minimum_quantity}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{alert.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No thresholds have been set for this item yet.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
