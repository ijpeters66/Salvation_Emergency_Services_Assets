import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";

import {
  checkInDeploymentAssetAction,
  checkOutDeploymentAssetAction,
  issueDeploymentConsumablesAction,
  updateDeploymentAction,
} from "@/app/deployments/actions";
import { AttachmentSection } from "@/components/attachment-section";
import { DeploymentFields } from "@/app/deployments/deployment-fields";
import { AppShell } from "@/components/app-shell";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { Button } from "@/components/ui/button";
import { listAssets } from "@/lib/assets/server";
import { listDocumentAttachments } from "@/lib/attachments/server";
import { getCurrentUserContext } from "@/lib/auth";
import { listConsumableBatches, listConsumableItems } from "@/lib/consumables/server";
import { deploymentStatusLabels, type DeploymentStatus } from "@/lib/deployments/service";
import {
  getDeploymentById,
  listDeploymentAssets,
  listDeploymentConsumables,
} from "@/lib/deployments/server";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

type DeploymentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages: Record<string, string> = {
  "queued-offline": "Deployment change saved offline and queued for sync.",
};

function dateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DeploymentDetailPage({
  params,
  searchParams,
}: DeploymentDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const [
    deployment,
    deploymentAssets,
    availableAssets,
    deploymentConsumables,
    consumableItems,
    consumableBatches,
    locationRows,
    attachments,
  ] = await Promise.all([
    getDeploymentById(id),
    listDeploymentAssets(id),
    listAssets({ status: "available" }, role),
    listDeploymentConsumables(id),
    listConsumableItems(false, role),
    listConsumableBatches({}, role),
    listLocations(false, role),
    listDocumentAttachments("deployment", id, role),
  ]);

  if (!deployment) {
    notFound();
  }
  const relatedAssets = await listAssets({}, role);
  const assetById = new Map(relatedAssets.map((asset) => [asset.id, asset]));
  const itemById = new Map(consumableItems.map((item) => [item.id, item]));
  const batchById = new Map(consumableBatches.map((batch) => [batch.id, batch]));
  const locations = toLocationOptions(locationRows);
  const activeDeploymentAssets = deploymentAssets.filter(
    (deploymentAsset) => !deploymentAsset.checked_in_at,
  );
  const activeAssetIds = new Set(
    activeDeploymentAssets.map((deploymentAsset) => deploymentAsset.asset_id),
  );
  const assignableAssets = availableAssets.filter((asset) => !activeAssetIds.has(asset.id));
  const attachmentStatus = getParam(query.attachmentStatus);
  const statusMessage = getParam(query.statusMessage);
  const message = statusMessage ? statusMessages[statusMessage] : null;

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/deployments">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Deployments
            </Link>
          </Button>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {deployment.deployment_id}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {deployment.deployment_name}
          </h1>
        </div>

        <OfflineSyncPanel
          entityId={deployment.id}
          entityTypes={["deployment"]}
          title="Offline deployment sync status"
        />

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Status</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {deploymentStatusLabels[deployment.status as DeploymentStatus] ?? deployment.status}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Location/site</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {deployment.deployment_location_site}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Team</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{deployment.team_name}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Start</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {dateTime(deployment.start_datetime)}
            </p>
          </article>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">Purpose/reason</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.purpose_reason}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Team leader</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.team_leader || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Contact number</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {deployment.contact_number || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Expected return</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {dateTime(deployment.expected_return_datetime)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Actual return</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {dateTime(deployment.actual_return_datetime)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Notes</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.notes || "Not recorded"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-[var(--muted)]">Damage/fault notes</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {deployment.damage_fault_notes || "Not recorded"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment assets</h2>
          <form action={checkOutDeploymentAssetAction} className="mt-4 grid gap-4 md:grid-cols-3">
            <input name="deploymentId" type="hidden" value={deployment.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Available asset
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="assetId"
                required
              >
                <option value="">Choose asset</option>
                {assignableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_name} ({asset.unique_asset_id})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <div className="md:col-span-3">
              <Button type="submit" disabled={assignableAssets.length === 0}>
                Check out asset
              </Button>
            </div>
          </form>

          {activeDeploymentAssets.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {activeDeploymentAssets.map((deploymentAsset) => {
                const asset = assetById.get(deploymentAsset.asset_id);

                return (
                  <form
                    action={checkInDeploymentAssetAction}
                    className="grid gap-3 rounded-md border border-[var(--border)] p-4 md:grid-cols-4"
                    key={deploymentAsset.id}
                  >
                    <input name="deploymentId" type="hidden" value={deployment.id} />
                    <input name="deploymentAssetId" type="hidden" value={deploymentAsset.id} />
                    <div className="md:col-span-2">
                      <p className="font-medium text-[var(--ink)]">
                        {asset?.asset_name ?? "Unknown asset"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Checked out {dateTime(deploymentAsset.checked_out_at)}
                      </p>
                    </div>
                    <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                      Return status
                      <select
                        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                        name="returnStatus"
                        defaultValue="available"
                      >
                        <option value="available">Available</option>
                        <option value="damaged">Damaged</option>
                        <option value="under_maintenance">Under maintenance</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                      Notes
                      <input
                        className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                        name="notes"
                      />
                    </label>
                    <div className="md:col-span-4">
                      <Button type="submit" variant="outline" size="sm">
                        Check in asset
                      </Button>
                    </div>
                  </form>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              No assets are currently checked out to this deployment.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment consumables</h2>
          <form
            action={issueDeploymentConsumablesAction}
            className="mt-4 grid gap-4 md:grid-cols-4"
          >
            <input name="deploymentId" type="hidden" value={deployment.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Consumable item
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="itemId"
                required
              >
                <option value="">Choose item</option>
                {consumableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Issue from
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
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
              Quantity
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                min="1"
                name="quantity"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <div className="md:col-span-4">
              <Button type="submit">Issue consumables</Button>
            </div>
          </form>

          {deploymentConsumables.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Issued</th>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {deploymentConsumables.map((deploymentConsumable) => {
                    const batch = batchById.get(deploymentConsumable.consumable_batch_id);
                    const item = batch ? itemById.get(batch.item_id) : null;

                    return (
                      <tr key={deploymentConsumable.id}>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {dateTime(deploymentConsumable.issued_at)}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {item?.name ?? "Unknown item"}
                        </td>
                        <td className="px-4 py-3">
                          {batch ? (
                            <Link
                              className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                              href={`/consumables/${batch.id}`}
                            >
                              {batch.batch_lot_number}
                            </Link>
                          ) : (
                            <span className="text-[var(--muted)]">Unknown batch</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {deploymentConsumable.quantity}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {deploymentConsumable.stock_movement_id}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              No consumables have been issued to this deployment yet.
            </p>
          )}
        </section>

        <AttachmentSection
          attachments={attachments}
          ownerId={deployment.id}
          ownerType="deployment"
          redirectPath={`/deployments/${deployment.id}`}
          role={role}
          status={attachmentStatus}
          subtitle="Upload deployment paperwork, photos, situation reports, or return documentation."
          title="Deployment attachments"
        />

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit deployment</h2>
          </div>
          <OfflineMutationForm
            action={updateDeploymentAction}
            className="mt-4 grid gap-4 md:grid-cols-3"
            displayLabelFields={["deploymentName", "deploymentId"]}
            entityIdField="id"
            entityType="deployment"
            operationType="update"
            redirectPath={`/deployments/${deployment.id}`}
          >
            <input name="id" type="hidden" value={deployment.id} />
            <input name="offlineUpdatedAt" type="hidden" value={deployment.updated_at} />
            <DeploymentFields deployment={deployment} />
            <div className="md:col-span-3">
              <Button type="submit">Save deployment</Button>
            </div>
          </OfflineMutationForm>
        </section>
      </section>
    </AppShell>
  );
}
