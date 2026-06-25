import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, History, PencilLine, Route, Wrench } from "lucide-react";

import {
  archiveAssetAction,
  assignChildAssetAction,
  recordAssetMovementAction,
  unassignChildAssetAction,
  updateAssetAction,
} from "@/app/assets/actions";
import {
  createMaintenanceRecordAction,
  upsertMaintenanceScheduleAction,
} from "@/app/maintenance/actions";
import { AssetFields } from "@/app/assets/asset-form";
import { AppShell } from "@/components/app-shell";
import { AttachmentSection } from "@/components/attachment-section";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { PrintableQrLabel, QrCodeCard } from "@/components/qr-code-card";
import { Button } from "@/components/ui/button";
import { listDocumentAttachments } from "@/lib/attachments/server";
import { getCurrentUserContext } from "@/lib/auth";
import { getAssignableChildAssets } from "@/lib/assets/assignment";
import { getMovementReasons } from "@/lib/assets/movement";
import {
  getAssetById,
  getPlantDetailsByAssetId,
  listAssetAssignments,
  listAssetCategories,
  listAssetMovements,
  listAssets,
} from "@/lib/assets/server";
import { assetStatusLabels } from "@/lib/assets/validation";
import { getPlantExpiryAlerts } from "@/lib/assets/plant";
import { assetStatuses } from "@/lib/domain-types";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";
import { getScheduleAlertState } from "@/lib/maintenance/schedules";
import {
  listMaintenanceRecords,
  listMaintenanceSchedules,
  listMaintenanceVendors,
} from "@/lib/maintenance/server";
import { toMaintenanceVendorNames } from "@/lib/maintenance/vendors";
import { listAssetDeploymentHistory, listDeployments } from "@/lib/deployments/server";

export const dynamic = "force-dynamic";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const scanActionMessages: Record<string, string> = {
  move: "Scan action: ready to record an asset movement.",
  stocktake: "Scan action: stocktake workflow placeholder.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(value: number | null) {
  if (value == null) {
    return "Not recorded";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
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

export default async function AssetDetailPage({ params, searchParams }: AssetDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const asset = await getAssetById(id);

  if (!asset) {
    notFound();
  }

  const [
    categories,
    locationRows,
    movements,
    assignments,
    allAssets,
    plantDetails,
    schedules,
    maintenanceRecords,
    deploymentHistory,
    deployments,
    assetAttachments,
    plantAttachments,
    maintenanceVendors,
  ] = await Promise.all([
    listAssetCategories(isAdmin, role),
    listLocations(false, role),
    listAssetMovements(id),
    listAssetAssignments(id),
    listAssets({}, role),
    getPlantDetailsByAssetId(id),
    listMaintenanceSchedules(id),
    listMaintenanceRecords(id),
    listAssetDeploymentHistory(id),
    listDeployments(),
    listDocumentAttachments("asset", id, role),
    listDocumentAttachments("plant", id, role),
    listMaintenanceVendors(false, role),
  ]);
  const locations = toLocationOptions(locationRows);
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const locationById = new Map(locations.map((location) => [location.value, location.label]));
  const assetById = new Map(allAssets.map((item) => [item.id, item]));
  const activeParentAssignment = assignments.find(
    (assignment) => assignment.child_asset_id === id && !assignment.unassigned_at,
  );
  const activeChildAssignments = assignments.filter(
    (assignment) => assignment.parent_asset_id === id && !assignment.unassigned_at,
  );
  const assignableChildren = getAssignableChildAssets(asset, allAssets).filter(
    (item) => !activeChildAssignments.some((assignment) => assignment.child_asset_id === item.id),
  );
  const statusMessage = getParam(query.statusMessage);
  const attachmentStatus = getParam(query.attachmentStatus);
  const plantAlerts = getPlantExpiryAlerts(plantDetails);
  const currentMaintenanceReading =
    plantDetails?.odometer_reading ?? plantDetails?.hour_meter_reading ?? null;
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const totalMaintenanceCost = maintenanceRecords.reduce((total, record) => total + record.cost, 0);
  const deploymentById = new Map(deployments.map((deployment) => [deployment.id, deployment]));
  const maintenanceVendorNames = toMaintenanceVendorNames(maintenanceVendors);
  const scanAction = getParam(query.scanAction);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/assets">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Assets
              </Link>
            </Button>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              {asset.unique_asset_id}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              {asset.asset_name}
            </h1>
          </div>
          {isAdmin && !asset.archived_at ? (
            <form action={archiveAssetAction}>
              <input name="id" type="hidden" value={asset.id} />
              <Button type="submit" variant="outline" size="sm">
                <Archive className="size-4" aria-hidden="true" />
                Archive
              </Button>
            </form>
          ) : null}
        </div>

        {statusMessage ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            Asset {statusMessage}.
          </p>
        ) : null}

        <OfflineSyncPanel
          entityId={asset.id}
          entityTypes={["asset", "maintenance_record"]}
          parentEntityId={asset.id}
          title="Offline asset sync status"
        />

        {scanAction ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {scanActionMessages[scanAction] ?? "Scan action received."}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Status</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ?? asset.status}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Location</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {locationById.get(asset.current_location_id) ?? "Unknown location"}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Category</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {categoryById.get(asset.category_id) ?? "Unknown category"}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Current value</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {money(asset.current_value)}
            </p>
          </article>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Asset details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">QR code value</dt>
              <dd className="mt-1 text-[var(--ink)]">{asset.qr_code_value}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Serial number</dt>
              <dd className="mt-1 text-[var(--ink)]">{asset.serial_number || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Make/model</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {[asset.make, asset.model].filter(Boolean).join(" ") || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Purchase date</dt>
              <dd className="mt-1 text-[var(--ink)]">{asset.purchase_date || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Purchase cost</dt>
              <dd className="mt-1 text-[var(--ink)]">{money(asset.purchase_cost)}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Replacement value</dt>
              <dd className="mt-1 text-[var(--ink)]">{money(asset.replacement_value)}</dd>
            </div>
          </dl>
        </section>

        <QrCodeCard
          label="Asset QR payload"
          payload={asset.qr_code_value}
          subtitle="This label is ready for detail screens, equipment tags, and future scan-to-action workflows."
          title="Asset QR label"
        />

        <PrintableQrLabel
          meta={`${asset.unique_asset_id} | ${assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ?? asset.status}`}
          name={asset.asset_name}
          payload={asset.qr_code_value}
        />

        <AttachmentSection
          attachments={assetAttachments}
          ownerId={asset.id}
          ownerType="asset"
          redirectPath={`/assets/${asset.id}`}
          role={role}
          status={attachmentStatus}
          subtitle="Upload photos, manuals, inspection sheets, or other asset documents."
          title="Asset attachments"
        />

        {plantDetails ? (
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Plant/fleet details</h2>
            <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-[var(--muted)]">Registration number</dt>
                <dd className="mt-1 text-[var(--ink)]">
                  {plantDetails.registration_number || "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--muted)]">Fuel type</dt>
                <dd className="mt-1 text-[var(--ink)]">
                  {plantDetails.fuel_type || "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--muted)]">Odometer</dt>
                <dd className="mt-1 text-[var(--ink)]">
                  {plantDetails.odometer_reading ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--muted)]">Hour meter</dt>
                <dd className="mt-1 text-[var(--ink)]">
                  {plantDetails.hour_meter_reading ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--muted)]">Service provider</dt>
                <dd className="mt-1 text-[var(--ink)]">
                  {plantDetails.service_provider || "Not recorded"}
                </dd>
              </div>
            </dl>
            {plantAlerts.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                {plantAlerts.map((alert) => (
                  <li key={alert.label}>
                    {alert.label}: {alert.date} ({alert.status})
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {plantDetails ? (
          <AttachmentSection
          attachments={plantAttachments}
          ownerId={asset.id}
          ownerType="plant"
          redirectPath={`/assets/${asset.id}`}
          role={role}
          subtitle="Store registration papers, insurance documents, and compliance records for plant and fleet assets."
          title="Plant and fleet attachments"
        />
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Maintenance schedules</h2>
          </div>

          {schedules.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {schedules.map((schedule) => {
                const alertState = getScheduleAlertState(
                  schedule,
                  schedule.service_interval_hours
                    ? (plantDetails?.hour_meter_reading ?? null)
                    : currentMaintenanceReading,
                );

                return (
                  <form
                    action={upsertMaintenanceScheduleAction}
                    className="grid gap-3 rounded-md border border-[var(--border)] p-4"
                    key={schedule.id}
                  >
                    <input name="scheduleId" type="hidden" value={schedule.id} />
                    <input name="assetId" type="hidden" value={asset.id} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-[var(--ink)]">{schedule.maintenance_type}</p>
                      <span className="text-sm font-medium text-[var(--brand-red)]">
                        {alertState.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Type
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="maintenanceType"
                          defaultValue={schedule.maintenance_type}
                          required
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Due date
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="nextServiceDueDate"
                          type="date"
                          defaultValue={schedule.next_service_due_date ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Due reading
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="nextServiceDueReading"
                          type="number"
                          step="0.1"
                          defaultValue={schedule.next_service_due_reading ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Interval days
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="serviceIntervalDate"
                          type="number"
                          defaultValue={schedule.service_interval_date ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Interval odometer
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="serviceIntervalOdometer"
                          type="number"
                          defaultValue={schedule.service_interval_odometer ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Interval hours
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="serviceIntervalHours"
                          type="number"
                          step="0.1"
                          defaultValue={schedule.service_interval_hours ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Provider
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="serviceProvider"
                          defaultValue={schedule.service_provider ?? ""}
                          list="maintenance-vendor-options"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Reminder days
                        <input
                          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="reminderThresholdDays"
                          type="number"
                          defaultValue={schedule.reminder_threshold_days ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                        Status
                        <select
                          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                          name="status"
                          defaultValue={schedule.status}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="archived">Archived</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <Button type="submit" variant="outline" size="sm">
                        Save schedule
                      </Button>
                    </div>
                  </form>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              No maintenance schedules have been recorded for this asset.
            </p>
          )}

          <form
            action={upsertMaintenanceScheduleAction}
            className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-3"
          >
            <input name="assetId" type="hidden" value={asset.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Type
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="maintenanceType"
                placeholder="Annual service"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Due date
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="nextServiceDueDate"
                type="date"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Due reading
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="nextServiceDueReading"
                type="number"
                step="0.1"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Interval days
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="serviceIntervalDate"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Interval odometer
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="serviceIntervalOdometer"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Interval hours
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="serviceIntervalHours"
                type="number"
                step="0.1"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Provider
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="serviceProvider"
                list="maintenance-vendor-options"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Reminder days
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="reminderThresholdDays"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Status
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="status"
                defaultValue="active"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <div className="md:col-span-3">
              <Button type="submit">Add schedule</Button>
            </div>
          </form>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Maintenance records</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Total recorded cost:{" "}
            <span className="font-semibold text-[var(--ink)]">{money(totalMaintenanceCost)}</span>
          </p>

          <OfflineMutationForm
            action={createMaintenanceRecordAction}
            className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-3"
            displayLabelFields={["serviceType", "description"]}
            entityType="maintenance_record"
            operationType="create"
            parentEntityIdField="assetId"
            parentEntityType="asset"
            redirectPath={`/assets/${asset.id}`}
          >
            <input name="assetId" type="hidden" value={asset.id} />
            <input name="offlineUpdatedAt" type="hidden" value={asset.updated_at} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Linked schedule
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="maintenanceScheduleId"
              >
                <option value="">None</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.maintenance_type}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Date
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="date"
                type="date"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Service type
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="serviceType"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
              Description
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="description"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Cost
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="cost"
                step="0.01"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Supplier/provider
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="supplierProvider"
                required
                list="maintenance-vendor-options"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Odometer/hour reading
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="odometerHourReading"
                step="0.1"
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
            <div className="md:col-span-3">
              <Button type="submit">Record maintenance</Button>
            </div>
          </OfflineMutationForm>
          {maintenanceVendorNames.length > 0 ? (
            <datalist id="maintenance-vendor-options">
              {maintenanceVendorNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          ) : null}

          {maintenanceRecords.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Schedule</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Cost</th>
                    <th className="px-4 py-3 font-semibold">Reading</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {maintenanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 text-[var(--ink)]">{record.date}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {record.maintenance_schedule_id
                          ? (scheduleById.get(record.maintenance_schedule_id)?.maintenance_type ??
                            "Linked schedule")
                          : "None"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={`/maintenance/records/${record.id}`}
                        >
                          {record.service_type}
                        </Link>
                        <span className="block">{record.description}</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{record.supplier_provider}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{money(record.cost)}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {record.odometer_hour_reading ?? "Not recorded"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              No maintenance records have been logged for this asset.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment history</h2>
          {deploymentHistory.length > 0 ? (
            <ol className="mt-4 grid gap-3">
              {deploymentHistory.map((deploymentAsset) => {
                const deployment = deploymentById.get(deploymentAsset.deployment_id);

                return (
                  <li
                    className="rounded-md border border-[var(--border)] p-4"
                    key={deploymentAsset.id}
                  >
                    <p className="font-medium text-[var(--ink)]">
                      {deployment?.deployment_name ?? "Unknown deployment"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Checked out {dateTime(deploymentAsset.checked_out_at)}
                      {deploymentAsset.checked_in_at
                        ? `; checked in ${dateTime(deploymentAsset.checked_in_at)}`
                        : "; currently deployed"}
                    </p>
                    {deploymentAsset.notes ? (
                      <p className="mt-2 text-sm text-[var(--foreground)]">
                        {deploymentAsset.notes}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              No deployment history has been recorded for this asset.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Route className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              Record status or location change
            </h2>
          </div>
          <form action={recordAssetMovementAction} className="mt-4 grid gap-4 md:grid-cols-2">
            <input name="id" type="hidden" value={asset.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              New status
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                defaultValue={asset.status}
                name="toStatus"
                required
              >
                {assetStatuses.map((status) => (
                  <option key={status} value={status}>
                    {assetStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              New location
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                defaultValue={asset.current_location_id}
                name="toLocationId"
                required
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Reason
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="reason"
                required
              >
                {getMovementReasons().map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Record movement</Button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Parent asset</h2>
            {activeParentAssignment ? (
              <div className="mt-4 rounded-md border border-[var(--border)] p-4">
                <p className="font-medium text-[var(--ink)]">
                  {assetById.get(activeParentAssignment.parent_asset_id)?.asset_name ??
                    "Unknown parent"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Assigned {dateTime(activeParentAssignment.assigned_at)}
                </p>
                <form action={unassignChildAssetAction} className="mt-3">
                  <input name="assetId" type="hidden" value={asset.id} />
                  <input name="assignmentId" type="hidden" value={activeParentAssignment.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Remove parent
                  </Button>
                </form>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                This asset is not currently assigned to a parent asset.
              </p>
            )}
          </div>

          <div className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Child assets</h2>
            {activeChildAssignments.length > 0 ? (
              <ul className="mt-4 grid gap-3">
                {activeChildAssignments.map((assignment) => {
                  const child = assetById.get(assignment.child_asset_id);

                  return (
                    <li
                      className="rounded-md border border-[var(--border)] p-4"
                      key={assignment.id}
                    >
                      <p className="font-medium text-[var(--ink)]">
                        {child?.asset_name ?? "Unknown child"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {child?.unique_asset_id ?? assignment.child_asset_id}
                      </p>
                      <form action={unassignChildAssetAction} className="mt-3">
                        <input name="assetId" type="hidden" value={asset.id} />
                        <input name="assignmentId" type="hidden" value={assignment.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Remove child
                        </Button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                No active child assets are assigned.
              </p>
            )}

            <form action={assignChildAssetAction} className="mt-5 grid gap-3">
              <input name="parentAssetId" type="hidden" value={asset.id} />
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Assign child asset
                <select
                  className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                  name="childAssetId"
                  required
                >
                  <option value="">Choose asset</option>
                  {assignableChildren.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.asset_name} ({child.unique_asset_id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Notes
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                  name="notes"
                />
              </label>
              <div>
                <Button type="submit" disabled={assignableChildren.length === 0}>
                  Assign child
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Assignment history</h2>
          {assignments.length > 0 ? (
            <ol className="mt-4 grid gap-3">
              {assignments.map((assignment) => {
                const isParent = assignment.parent_asset_id === id;
                const relatedAsset = assetById.get(
                  isParent ? assignment.child_asset_id : assignment.parent_asset_id,
                );

                return (
                  <li className="rounded-md border border-[var(--border)] p-4" key={assignment.id}>
                    <p className="font-medium text-[var(--ink)]">
                      {isParent ? "Child" : "Parent"}: {relatedAsset?.asset_name ?? "Unknown asset"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Assigned {dateTime(assignment.assigned_at)}
                      {assignment.unassigned_at
                        ? `; removed ${dateTime(assignment.unassigned_at)}`
                        : "; active"}
                    </p>
                    {assignment.notes ? (
                      <p className="mt-2 text-sm text-[var(--foreground)]">{assignment.notes}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              No assignment history has been recorded for this asset.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <History className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Movement history</h2>
          </div>
          {movements.length > 0 ? (
            <ol className="mt-4 grid gap-3">
              {movements.map((movement) => (
                <li className="rounded-md border border-[var(--border)] p-4" key={movement.id}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-[var(--ink)]">{movement.reason}</p>
                    <time className="text-xs text-[var(--muted)]">
                      {dateTime(movement.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {assetStatusLabels[movement.from_status as keyof typeof assetStatusLabels] ??
                      movement.from_status ??
                      "Unknown"}{" "}
                    to{" "}
                    {assetStatusLabels[movement.to_status as keyof typeof assetStatusLabels] ??
                      movement.to_status}
                    {"; "}
                    {locationById.get(movement.from_location_id ?? "") ??
                      "Unknown location"} to{" "}
                    {locationById.get(movement.to_location_id ?? "") ?? "Unknown location"}
                  </p>
                  {movement.notes ? (
                    <p className="mt-2 text-sm text-[var(--foreground)]">{movement.notes}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              No movement history has been recorded for this asset yet.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit asset</h2>
          </div>
          <OfflineMutationForm
            action={updateAssetAction}
            className="mt-4 grid gap-4"
            displayLabelFields={["assetName", "uniqueAssetId"]}
            entityIdField="id"
            entityType="asset"
            operationType="update"
            redirectPath={`/assets/${asset.id}`}
          >
            <input name="id" type="hidden" value={asset.id} />
            <input name="offlineUpdatedAt" type="hidden" value={asset.updated_at} />
            <AssetFields
              asset={asset}
              plantDetails={plantDetails}
              categories={categories}
              locations={locations}
            />
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </OfflineMutationForm>
        </section>
      </section>
    </AppShell>
  );
}
