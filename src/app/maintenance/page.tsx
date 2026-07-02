import Link from "next/link";
import { Archive, PencilLine, Plus, Wrench } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  archiveMaintenanceVendorAction,
  createMaintenanceVendorAction,
  updateMaintenanceVendorAction,
} from "@/app/maintenance/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, FormSection } from "@/components/form-helpers";
import { getCurrentUserContext } from "@/lib/auth";
import { getPlantExpiryAlerts } from "@/lib/assets/plant";
import { listAssets, listPlantDetails } from "@/lib/assets/server";
import { getScheduleAlertState } from "@/lib/maintenance/schedules";
import { listMaintenanceSchedules, listMaintenanceVendors } from "@/lib/maintenance/server";
import {
  previewAssets,
  previewMaintenanceSchedules,
  previewMaintenanceVendors,
  previewPlantDetails,
} from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages: Record<string, string> = {
  "validation-error": "Check the maintenance vendor details and try again.",
  "auth-error": "You need an active signed-in session to update vendors.",
  "save-error": "The vendor could not be saved. Try again or check Supabase configuration.",
  "vendor-saved": "Approved vendor saved.",
  "vendor-archived": "Approved vendor archived.",
};

type MaintenancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function VendorFields({
  defaults,
}: {
  defaults?: {
    business_name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    notes: string | null;
  };
}) {
  return (
    <div className="grid gap-4">
      <FormSection
        description="Who the vendor is and how to contact them."
        title="Identity and contact"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Business name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.business_name ?? ""}
              name="businessName"
              placeholder="Acme Service Centre"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Contact name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.contact_name ?? ""}
              name="contactName"
              placeholder="Primary contact"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Phone
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.phone ?? ""}
              name="phone"
              placeholder="03 5555 5555"
              type="tel"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Email
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.email ?? ""}
              name="email"
              placeholder="service@example.com"
              type="email"
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Optional details to help staff recognise the vendor later."
        title="Address and website"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Address
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.address ?? ""}
              name="address"
              placeholder="Street or mailing address"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Website
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.website ?? ""}
              name="website"
              placeholder="https://..."
              type="url"
            />
            <FieldHint>Use the full URL so it opens correctly from the browser.</FieldHint>
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Notes can hold preferred contacts, SLA details, or job booking guidance."
        title="Notes"
      >
        <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
          Notes
          <textarea
            className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
            defaultValue={defaults?.notes ?? ""}
            name="notes"
            placeholder="Booking instructions or preferred contact method"
          />
        </label>
      </FormSection>
    </div>
  );
}

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const includeArchived = isAdmin && getParam(params.archived) === "1";
  const alertFilter = getParam(params.alert) ?? "";
  const isPreview = getParam(params.preview) === "1";
  const status = getParam(params.statusMessage);
  const message = status ? statusMessages[status] : null;
  const [schedules, assets, plantDetails, vendors] =
    isPreview && !user
      ? [
          [...previewMaintenanceSchedules],
          [...previewAssets],
          [...previewPlantDetails],
          [...previewMaintenanceVendors],
        ]
      : await Promise.all([
          listMaintenanceSchedules(),
          listAssets({}, role),
          listPlantDetails(),
          listMaintenanceVendors(includeArchived, role),
        ]);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const plantByAssetId = new Map(plantDetails.map((details) => [details.asset_id, details]));
  const actionable = schedules
    .map((schedule) => ({
      schedule,
      asset: assetById.get(schedule.asset_id),
      alertState: getScheduleAlertState(
        schedule,
        plantByAssetId.get(schedule.asset_id)?.odometer_reading ??
          plantByAssetId.get(schedule.asset_id)?.hour_meter_reading ??
          null,
      ),
    }))
    .filter((item) =>
      alertFilter === "due-soon"
        ? item.alertState === "due_soon"
        : alertFilter === "overdue"
          ? item.alertState === "overdue"
          : item.alertState !== "not_due",
    );
  const expiryAlerts = plantDetails
    .flatMap((details) =>
      getPlantExpiryAlerts(details).map((alert) => ({
        alert,
        assetId: details.asset_id,
        assetName: assetById.get(details.asset_id)?.asset_name ?? "Unknown asset",
      })),
    )
    .filter((item) =>
      alertFilter === "expiry"
        ? item.alert.status === "due_soon" || item.alert.status === "overdue"
        : true,
    );

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
          {isPreview ? (
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <Wrench className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Due maintenance</h2>
          </div>
          {actionable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Due maintenance schedule table showing asset, maintenance type, due date, due reading, and state.
                </caption>
                <thead className="sticky top-16 z-10 bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
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
                    <tr className="transition-colors hover:bg-[var(--surface)]" key={schedule.id}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={
                            isPreview ? `/assets/${schedule.asset_id}?preview=1` : `/assets/${schedule.asset_id}`
                          }
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

          {alertFilter === "expiry" ? (
          <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
              <Wrench className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Registration and insurance expiry</h2>
            </div>
            {expiryAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Registration and insurance expiry alerts showing asset, alert type, date, and state.
                  </caption>
                  <thead className="sticky top-16 z-10 bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Asset</th>
                      <th className="px-5 py-3 font-semibold">Alert</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {expiryAlerts.map((item, index) => (
                      <tr className="transition-colors hover:bg-[var(--surface)]" key={`${item.assetId}:${item.alert.label}:${index}`}>
                        <td className="px-5 py-4">
                          <Link
                            className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={isPreview ? `/assets/${item.assetId}?preview=1` : `/assets/${item.assetId}`}
                        >
                            {item.assetName}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{item.alert.label}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">{item.alert.date}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">{item.alert.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                No registration, insurance, or compliance expiries are due soon or overdue.
              </p>
            )}
          </section>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">Approved vendors</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Manage approved maintenance providers for vehicles, trailers, plant, and related equipment.
                </p>
              </div>
            </div>
            {isAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href={includeArchived ? "/maintenance" : "/maintenance?archived=1"}>
                  <Archive className="size-4" aria-hidden="true" />
                  {includeArchived ? "Hide archived" : "View archived"}
                </Link>
              </Button>
            ) : null}
          </div>

          <form action={createMaintenanceVendorAction} className="mt-5 grid gap-4">
            <VendorFields />
            <div>
              <Button type="submit">Add approved vendor</Button>
            </div>
          </form>

          {vendors.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Approved maintenance vendors showing business details, contact information, notes, and actions.
                </caption>
                <thead className="sticky top-16 z-10 bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Website</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {vendors.map((vendor) => (
                    <tr className="transition-colors hover:bg-[var(--surface)]" key={vendor.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--ink)]">{vendor.business_name}</div>
                        <div className="text-[var(--muted)]">{vendor.address || "No address"}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {vendor.contact_name || "Not recorded"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{vendor.phone || "Not recorded"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{vendor.email || "Not recorded"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {vendor.website ? (
                          <a
                            className="hover:text-[var(--brand-red)]"
                            href={vendor.website}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {vendor.website}
                          </a>
                        ) : (
                          "Not recorded"
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{vendor.notes || "Not recorded"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--ink)]">
                              <PencilLine className="size-4" aria-hidden="true" />
                              Edit
                            </summary>
                            <form
                              action={updateMaintenanceVendorAction}
                              className="mt-3 grid w-[min(42rem,85vw)] gap-4 rounded-md border border-[var(--border)] bg-white p-4 shadow-sm"
                            >
                              <input name="vendorId" type="hidden" value={vendor.id} />
                              <VendorFields defaults={vendor} />
                              <div>
                                <Button size="sm" type="submit">
                                  Save changes
                                </Button>
                              </div>
                            </form>
                          </details>
                          {isAdmin && !vendor.archived_at ? (
                            <form action={archiveMaintenanceVendorAction}>
                              <input name="id" type="hidden" value={vendor.id} />
                              <Button size="sm" type="submit" variant="outline">
                                <Archive className="size-4" aria-hidden="true" />
                                Archive
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm font-medium text-[var(--ink)]">
                No approved maintenance vendors have been added yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Add a preferred provider so maintenance jobs and handover records have somewhere to point.
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
