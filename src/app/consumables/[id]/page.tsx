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
import { AttachmentSection } from "@/components/attachment-section";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { PrintableQrLabel, QrCodeCard } from "@/components/qr-code-card";
import { Button } from "@/components/ui/button";
import { listDocumentAttachments } from "@/lib/attachments/server";
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
import { getMovementReasonLabels } from "@/lib/settings";
import { listMovementReasons } from "@/lib/settings/server";
import {
  getPreviewConsumableBatchById,
  getPreviewLocationOptions,
  previewConsumableCategories,
  previewConsumableItems,
  previewDeployments,
  previewLocations,
  previewMovementReasons,
  previewStockMovements,
} from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

type BatchDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const scanActionMessages: Record<string, string> = {
  issue: "Scan action: ready to record a consumable issue.",
  stocktake: "Scan action: stocktake workflow placeholder.",
};

const statusMessages: Record<string, string> = {
  "queued-offline": "Stock movement saved offline and queued for sync.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

function PreviewBatchDetailPage({
  batchId,
  attachmentStatus,
  statusMessage,
  scanAction,
}: {
  batchId: string;
  attachmentStatus: string | undefined;
  statusMessage: string | undefined;
  scanAction: string | undefined;
}) {
  const batch = getPreviewConsumableBatchById(batchId);

  if (!batch) {
    notFound();
  }

  const locations = getPreviewLocationOptions();
  const item = previewConsumableItems.find((candidate) => candidate.id === batch.item_id);
  const category = previewConsumableCategories.find((candidate) => candidate.id === item?.category_id);
  const movements = previewStockMovements.filter(
    (movement) => movement.consumable_batch_id === batch.id,
  );
  const deploymentById = new Map(previewDeployments.map((deployment) => [deployment.id, deployment]));
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const movementReasonLabels = [...previewMovementReasons];

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
            {batch.batch_lot_number}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {item?.name ?? "Consumable batch"}
          </h1>
          <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
        </div>

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        {scanAction ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {scanActionMessages[scanAction] ?? "Scan action received."}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Quantity on hand</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {batch.quantity_on_hand} / {batch.quantity_received}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Category</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{category?.name ?? "Unknown"}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Location</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {previewLocations.find((location) => location.id === batch.location_id)?.name ?? "Unknown"}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Expiry</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{batch.expiry_date ?? "No expiry"}</p>
          </article>
        </section>

        <QrCodeCard
          label="Consumable QR payload"
          payload={batch.qr_code_value}
          subtitle="Preview QR payload for issue and stocktake workflow checks."
          title="Batch QR label"
        />

        <PrintableQrLabel
          meta={`${item?.name ?? "Consumable batch"} | ${batch.batch_lot_number}`}
          name="Consumable batch label"
          payload={batch.qr_code_value}
        />

        <AttachmentSection
          attachments={[]}
          ownerId={batch.id}
          ownerType="consumable_batch"
          redirectPath={`/consumables/${batch.id}?preview=1`}
          role="user"
          status={attachmentStatus}
          subtitle="Upload donation paperwork, batch documentation, and expiry evidence."
          title="Batch attachments"
        />

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Record stock movement</h2>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Movement type
              <select className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base">
                {stockMovementTypes.map((movementType) => (
                  <option key={movementType} value={movementType}>
                    {stockMovementLabels[movementType]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Quantity
              <input className="h-10 rounded-md border border-[var(--border)] px-3 text-base" defaultValue="4" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              From location
              <select className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base">
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Reason
              <select className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base">
                {movementReasonLabels.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2">
              <Button type="button">Record movement</Button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <History className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Stock movement ledger</h2>
          </div>
          <div className="grid gap-3 p-5">
            {movements.map((movement) => (
              <div className="rounded-md border border-[var(--border)] p-4" key={movement.id}>
                <p className="font-medium text-[var(--ink)]">{movement.reason}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {stockMovementLabels[movement.movement_type]} · qty {movement.quantity} · {dateTime(movement.created_at)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Related deployment:{" "}
                  {(movement.related_deployment_id
                    ? deploymentById.get(movement.related_deployment_id)?.deployment_name
                    : null) ?? "None"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

export default async function BatchDetailPage({ params, searchParams }: BatchDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const isPreview = getParam(query.preview) === "1";
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";

  if (isPreview && !user) {
    return (
      <PreviewBatchDetailPage
        attachmentStatus={getParam(query.attachmentStatus)}
        batchId={id}
        scanAction={getParam(query.scanAction)}
        statusMessage={getParam(query.statusMessage)}
      />
    );
  }

  const batch = await getConsumableBatchById(id);
  if (!batch) notFound();

  const [categories, items, locationRows, movements, deployments, attachments, movementReasons] =
    await Promise.all([
      listConsumableCategories(isAdmin, role),
      listConsumableItems(isAdmin, role),
      listLocations(false, role),
      listStockMovements(id),
      listDeployments(),
      listDocumentAttachments("consumable_batch", id, role),
      listMovementReasons(),
    ]);
  const locations = toLocationOptions(locationRows);
  const item = items.find((candidate) => candidate.id === batch.item_id);
  const category = categories.find((candidate) => candidate.id === item?.category_id);
  const location = locations.find((candidate) => candidate.value === batch.location_id);
  const totalValue = calculateBatchValue(batch.quantity_on_hand, batch.unit_cost);
  const deploymentById = new Map(deployments.map((deployment) => [deployment.id, deployment]));
  const scanAction = getParam(query.scanAction);
  const attachmentStatus = getParam(query.attachmentStatus);
  const statusMessage = getParam(query.statusMessage);
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const movementReasonLabels = getMovementReasonLabels(movementReasons);

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

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

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

        {scanAction ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {scanActionMessages[scanAction] ?? "Scan action received."}
          </p>
        ) : null}

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

        <AttachmentSection
          attachments={attachments}
          ownerId={batch.id}
          ownerType="consumable_batch"
          redirectPath={`/consumables/${batch.id}`}
          role={role}
          status={attachmentStatus}
          subtitle="Upload donation paperwork, batch documentation, expiry evidence, or handling guidance."
          title="Batch attachments"
        />

        <OfflineSyncPanel
          entityTypes={["stock_movement"]}
          parentEntityId={batch.id}
          title="Offline stock movement sync status"
        />

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Record stock movement</h2>
          </div>
          <OfflineMutationForm
            action={recordStockMovementAction}
            className="mt-4 grid gap-3 md:grid-cols-2"
            displayLabelFields={["movementType", "reason"]}
            entityType="stock_movement"
            operationType="create"
            parentEntityIdField="batchId"
            redirectPath={`/consumables/${batch.id}`}
          >
            <input name="batchId" type="hidden" value={batch.id} />
            <input name="offlineUpdatedAt" type="hidden" value={batch.updated_at} />
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
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="reason"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Choose reason
                </option>
                {movementReasonLabels.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
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
          </OfflineMutationForm>
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
