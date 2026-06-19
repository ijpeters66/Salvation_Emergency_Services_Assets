import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, History, PencilLine, Plus } from "lucide-react";

import {
  archiveConsumableBatchAction,
  recordStockMovementAction,
  updateConsumableBatchAction,
} from "@/app/consumables/actions";
import { BatchFields } from "@/app/consumables/batch-form";
import { AppShell } from "@/components/app-shell";
import { PrintableQrLabel, QrCodeCard } from "@/components/qr-code-card";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  getConsumableBatchById,
  listConsumableCategories,
  listConsumableItems,
  listStockMovements,
} from "@/lib/consumables/server";
import { calculateBatchValue } from "@/lib/consumables/service";
import { stockMovementLabels } from "@/lib/consumables/stock-movement";
import { listDeployments } from "@/lib/deployments/server";
import { stockMovementTypes } from "@/lib/domain-types";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

type BatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const batch = await getConsumableBatchById(id);
  if (!batch) notFound();

  const [categories, items, locationRows, movements, deployments] = await Promise.all([
    listConsumableCategories(isAdmin, role),
    listConsumableItems(isAdmin, role),
    listLocations(false, role),
    listStockMovements(id),
    listDeployments(),
  ]);
  const locations = toLocationOptions(locationRows);
  const item = items.find((candidate) => candidate.id === batch.item_id);
  const category = categories.find((candidate) => candidate.id === item?.category_id);
  const location = locations.find((candidate) => candidate.value === batch.location_id);
  const totalValue = calculateBatchValue(batch.quantity_on_hand, batch.unit_cost);
  const deploymentById = new Map(deployments.map((deployment) => [deployment.id, deployment]));

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/consumables">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Consumables
              </Link>
            </Button>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              {batch.batch_lot_number}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              {item?.name ?? "Consumable batch"}
            </h1>
          </div>
          {isAdmin && !batch.archived_at ? (
            <form action={archiveConsumableBatchAction}>
              <input name="id" type="hidden" value={batch.id} />
              <Button type="submit" variant="outline" size="sm">
                <Archive className="size-4" aria-hidden="true" />
                Archive
              </Button>
            </form>
          ) : null}
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Quantity on hand</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {batch.quantity_on_hand} / {batch.quantity_received}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Batch value</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{money(totalValue)}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Location</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {location?.label ?? "Unknown"}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Expiry</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {batch.expiry_date ?? "No expiry"}
            </p>
          </article>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Traceability</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">Category</dt>
              <dd className="mt-1 text-[var(--ink)]">{category?.name ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">QR code value</dt>
              <dd className="mt-1 text-[var(--ink)]">{batch.qr_code_value}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Supplier/donor</dt>
              <dd className="mt-1 text-[var(--ink)]">{batch.supplier_donor ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Date received</dt>
              <dd className="mt-1 text-[var(--ink)]">{batch.date_received}</dd>
            </div>
          </dl>
        </section>

        <QrCodeCard
          label="Consumable QR payload"
          payload={batch.qr_code_value}
          subtitle="Print this batch label for stock bins, issue packs, and future scan-led stock actions."
          title="Batch QR label"
        />

        <PrintableQrLabel
          meta={`${item?.name ?? "Consumable batch"} | ${batch.batch_lot_number}`}
          name="Consumable batch label"
          payload={batch.qr_code_value}
        />

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Record stock movement</h2>
          </div>
          <form action={recordStockMovementAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="batchId" type="hidden" value={batch.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Movement type
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="movementType"
                required
              >
                {stockMovementTypes.map((movementType) => (
                  <option key={movementType} value={movementType}>
                    {stockMovementLabels[movementType]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Quantity
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                min="1"
                name="quantity"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              From location
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                defaultValue={batch.location_id}
                name="fromLocationId"
              >
                <option value="">None</option>
                {locations.map((candidate) => (
                  <option key={candidate.value} value={candidate.value}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              To location
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="toLocationId"
              >
                <option value="">None</option>
                {locations.map((candidate) => (
                  <option key={candidate.value} value={candidate.value}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Reason
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="reason"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Related deployment
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="relatedDeploymentId"
                placeholder="Optional deployment ID"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Record movement</Button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <History className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Stock movement ledger</h2>
          </div>
          {movements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Qty</th>
                    <th className="px-5 py-3 font-semibold">From</th>
                    <th className="px-5 py-3 font-semibold">To</th>
                    <th className="px-5 py-3 font-semibold">Deployment</th>
                    <th className="px-5 py-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {dateTime(movement.created_at)}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {stockMovementLabels[
                          movement.movement_type as keyof typeof stockMovementLabels
                        ] ?? movement.movement_type}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{movement.quantity}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {locations.find(
                          (candidate) => candidate.value === movement.from_location_id,
                        )?.label ?? "None"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {locations.find((candidate) => candidate.value === movement.to_location_id)
                          ?.label ?? "None"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {movement.related_deployment_id
                          ? (deploymentById.get(movement.related_deployment_id)?.deployment_name ??
                            movement.related_deployment_id)
                          : "None"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{movement.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No stock movements have been recorded for this batch yet.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit batch</h2>
          </div>
          <form action={updateConsumableBatchAction} className="mt-4 grid gap-4">
            <input name="id" type="hidden" value={batch.id} />
            <BatchFields batch={batch} items={items} locations={locations} lockQuantityOnHand />
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
