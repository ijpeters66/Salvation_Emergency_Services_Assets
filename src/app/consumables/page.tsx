import Link from "next/link";
import { Archive, Filter, PackageCheck, Plus } from "lucide-react";

import {
  archiveConsumableBatchAction,
  createConsumableBatchAction,
  createConsumableItemAction,
  issueConsumablesFifoAction,
} from "@/app/consumables/actions";
import { BatchFields } from "@/app/consumables/batch-form";
import { AppShell } from "@/components/app-shell";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { Notice } from "@/components/notice";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  listConsumableBatches,
  listConsumableCategories,
  listConsumableItems,
  listStockThresholds,
} from "@/lib/consumables/server";
import { calculateBatchValue } from "@/lib/consumables/service";
import { buildStockAlerts } from "@/lib/consumables/thresholds";
import { getPublicEnvStatus } from "@/lib/env";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";
import { getMovementReasonLabels } from "@/lib/settings";
import { listMovementReasons } from "@/lib/settings/server";

export const dynamic = "force-dynamic";

type ConsumablesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  "item-created": "Consumable item created.",
  archived: "Consumable batch archived.",
  "validation-error": "Check the consumable details and try again.",
  "auth-error": "You need an active signed-in session to change consumables.",
  "save-error": "The consumable record could not be saved.",
  "fifo-issued": "Consumables issued.",
  "fifo-error": "There is not enough eligible stock for that FIFO issue.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export default async function ConsumablesPage({ searchParams }: ConsumablesPageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const includeArchived = isAdmin && getParam(params.archived) === "1";
  const locationId = getParam(params.locationId) ?? "";
  const categoryId = getParam(params.categoryId) ?? "";
  const search = getParam(params.search) ?? "";
  const lowQuantity = getParam(params.lowQuantity) === "1";
  const alertFilter = getParam(params.alert) ?? "";
  const isPreview = getParam(params.preview) === "1";
  const statusMessage = getParam(params.statusMessage);
  const issuedSummary = getParam(params.issuedSummary);
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const envConfigured = getPublicEnvStatus().configured;

  const previewData = {
    categories: [
      { id: "preview-cat-1", name: "Material Aid", archived_at: null },
      { id: "preview-cat-2", name: "PPE", archived_at: null },
      { id: "preview-cat-3", name: "Food/Water", archived_at: null },
    ],
    items: [
      {
        id: "preview-item-1",
        name: "Trauma dressing",
        category_id: "preview-cat-1",
        archived_at: null,
      },
      { id: "preview-item-2", name: "Saline", category_id: "preview-cat-1", archived_at: null },
    ],
    locationRows: [
      { id: "preview-loc-1", name: "Ballarat depot", archived_at: null },
      { id: "preview-loc-2", name: "Hamilton truck", archived_at: null },
    ],
    rawBatches: [
      {
        id: "preview-batch-1",
        item_id: "preview-item-1",
        batch_lot_number: "LOT-A",
        quantity_received: 12,
        quantity_on_hand: 2,
        unit_cost: 18,
        replacement_cost: 20,
        date_received: "2026-06-01",
        supplier_donor: "Preview supplier",
        expiry_date: "2027-01-01",
        location_id: "preview-loc-1",
        qr_code_value: "PREVIEW-1",
        archived_at: null,
      },
      {
        id: "preview-batch-2",
        item_id: "preview-item-2",
        batch_lot_number: "LOT-B",
        quantity_received: 8,
        quantity_on_hand: 0,
        unit_cost: 12,
        replacement_cost: 15,
        date_received: "2026-06-03",
        supplier_donor: "Preview supplier",
        expiry_date: "2027-03-01",
        location_id: "preview-loc-2",
        qr_code_value: "PREVIEW-2",
        archived_at: null,
      },
    ],
    thresholds: [
      {
        id: "preview-threshold-1",
        consumable_item_id: "preview-item-1",
        location_id: "preview-loc-1",
        minimum_quantity: 4,
      },
      {
        id: "preview-threshold-2",
        consumable_item_id: "preview-item-2",
        location_id: "preview-loc-2",
        minimum_quantity: 3,
      },
    ],
  };

  const [categories, items, locationRows, rawBatches, thresholds, movementReasons] =
    isPreview && !user
      ? [
          previewData.categories as never[],
          previewData.items as never[],
          previewData.locationRows.map((location) => ({
            ...location,
            type: "warehouse",
            address: null,
            state: "Victoria",
            notes: null,
            created_at: "",
            updated_at: "",
            created_by: "preview",
            updated_by: "preview",
          })) as never[],
          previewData.rawBatches.map((batch) => ({
            ...batch,
            created_at: "",
            updated_at: "",
            created_by: "preview",
            updated_by: "preview",
          })) as never[],
          previewData.thresholds.map((threshold) => ({
            ...threshold,
            created_at: "",
            updated_at: "",
            created_by: "preview",
            updated_by: "preview",
          })) as never[],
          [] as never[],
        ]
      : user
        ? await Promise.all([
            listConsumableCategories(includeArchived, role),
            listConsumableItems(includeArchived, role),
            listLocations(false, role),
            listConsumableBatches({ locationId, search, lowQuantity, includeArchived }, role),
            listStockThresholds(),
            listMovementReasons(),
          ])
        : [[], [], [], [], [], []];

  const locations = toLocationOptions(locationRows);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const locationById = new Map(locations.map((location) => [location.value, location.label]));
  const batches = categoryId
    ? rawBatches.filter((batch) => itemById.get(batch.item_id)?.category_id === categoryId)
    : rawBatches;
  const stockAlerts = buildStockAlerts(thresholds, rawBatches).filter(
    (alert) => alert.status !== "normal",
  );
  const filteredStockAlerts =
    alertFilter === "low-stock"
      ? stockAlerts.filter((alert) => alert.status === "low_stock")
      : alertFilter === "out-of-stock"
        ? stockAlerts.filter((alert) => alert.status === "out_of_stock")
        : stockAlerts;
  const filteredAlertKeys = new Set(
    filteredStockAlerts.map(
      (alert) => `${alert.threshold.consumable_item_id}:${alert.threshold.location_id}`,
    ),
  );
  const visibleBatches =
    alertFilter.length > 0
      ? batches.filter((batch) => filteredAlertKeys.has(`${batch.item_id}:${batch.location_id}`))
      : batches;
  const movementReasonLabels = getMovementReasonLabels(movementReasons);

  return (
    <AppShell>
      <section className="grid gap-6">
        <PageHero
          actions={
            isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href={includeArchived ? "/consumables" : "/consumables?archived=1"}>
                  <Archive className="size-4" aria-hidden="true" />
                  {includeArchived ? "Hide archived" : "View archived"}
                </Link>
              </Button>
            ) : null
          }
          aside={
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,white)] bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                {isPreview ? "Preview mode" : "Consumable stock"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Manage consumable items and batches with quantities, value, expiry, location, and QR traceability.
              </p>
            </div>
          }
          description="Manage consumable items and batches with quantities, value, expiry, location, and QR traceability."
          eyebrow="Consumable stock"
          title="Consumables"
        />

        {!envConfigured ? (
          <Notice title="Live data unavailable" variant="warning">
            Supabase is not configured yet, so live consumable records cannot be loaded.
          </Notice>
        ) : null}

        {message ? (
          <Notice title="Consumable update" variant="info">
            {message}
            {issuedSummary ? (
              <span className="mt-1 block text-[var(--muted)]">
                Issued batches: {issuedSummary}
              </span>
            ) : null}
          </Notice>
        ) : null}

        <section className="panel-card p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Stock alerts</h2>
          {filteredStockAlerts.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {filteredStockAlerts.map((alert) => {
                const item = itemById.get(alert.threshold.consumable_item_id);
                const alertLocation = locationById.get(alert.threshold.location_id);

                return (
                  <Link
                    className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--surface)]"
                    href={
                      isPreview
                        ? `/consumables/items/${alert.threshold.consumable_item_id}?preview=1`
                        : `/consumables/items/${alert.threshold.consumable_item_id}`
                    }
                    key={alert.threshold.id}
                  >
                    <span className="block text-sm font-semibold text-[var(--ink)]">
                      {item?.name ?? "Unknown item"} at {alertLocation ?? "Unknown location"}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      {alert.status === "out_of_stock" ? "Out of stock" : "Low stock"}:{" "}
                      {alert.currentQuantity} on hand, minimum {alert.threshold.minimum_quantity}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              {alertFilter === "low-stock"
                ? "No low-stock threshold alerts are active."
                : alertFilter === "out-of-stock"
                  ? "No out-of-stock threshold alerts are active."
                  : "No low-stock or out-of-stock threshold alerts are active."}
            </p>
          )}
        </section>

        <section className="panel-card-soft p-5">
          <div className="flex items-center gap-2">
            <PackageCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Issue consumables</h2>
          </div>
          <form action={issueConsumablesFifoAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Item
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="itemId"
                required
              >
                <option value="">Choose item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
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
              Quantity
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                min="1"
                name="quantity"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
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
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <details className="rounded-md border border-[var(--border)] p-3 text-sm text-[var(--muted)] md:col-span-3">
              <summary className="cursor-pointer font-medium text-[var(--ink)]">
                Confirmation summary
              </summary>
              <p className="mt-2 leading-6">
                The system will issue from the earliest expiring eligible batches first, then from
                the oldest received batches, and will stop if stock is insufficient.
              </p>
            </details>
            <div className="md:col-span-3">
              <Button type="submit" disabled={items.length === 0 || locations.length === 0}>
                Issue consumables
              </Button>
            </div>
          </form>
        </section>

        <section className="panel-card p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create consumable item</h2>
          </div>
          <form action={createConsumableItemAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Item name
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Category
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="categoryId"
                required
              >
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Description
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="description"
              />
            </label>
            <div className="md:col-span-3">
              <Button type="submit" disabled={categories.length === 0}>
                Create item
              </Button>
            </div>
          </form>
        </section>

        <section className="panel-card-soft p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create batch</h2>
          </div>
          <form action={createConsumableBatchAction} className="mt-4 grid gap-4">
            <BatchFields items={items} locations={locations} mode="create" />
            <div>
              <Button type="submit" disabled={items.length === 0 || locations.length === 0}>
                Create batch
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Filters</h2>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-6">
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={search}
              name="search"
              placeholder="Search batches"
            />
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={categoryId}
              name="categoryId"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={locationId}
              name="locationId"
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <input defaultChecked={lowQuantity} name="lowQuantity" type="checkbox" value="1" />
              Low quantity
            </label>
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={alertFilter}
              name="alert"
            >
              <option value="">All stock alerts</option>
              <option value="low-stock">Low stock only</option>
              <option value="out-of-stock">Out of stock only</option>
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/88 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <PackageCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Batch list</h2>
          </div>
          {visibleBatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Consumable batch register showing item, batch, location, quantity, value, expiry,
                  and actions.
                </caption>
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Item</th>
                    <th className="px-5 py-3 font-semibold">Batch</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Qty</th>
                    <th className="px-5 py-3 font-semibold">Value</th>
                    <th className="px-5 py-3 font-semibold">Expiry</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {visibleBatches.map((batch) => {
                    const item = itemById.get(batch.item_id);
                    return (
                      <tr key={batch.id}>
                        <td className="px-5 py-4">
                          <Link
                            className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                            href={
                              isPreview
                                ? `/consumables/items/${item?.id ?? batch.item_id}?preview=1`
                                : `/consumables/items/${item?.id ?? batch.item_id}`
                            }
                          >
                            {item?.name ?? "Unknown item"}
                          </Link>
                          <span className="block text-xs text-[var(--muted)]">
                            {categoryById.get(item?.category_id ?? "") ?? "Unknown category"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">{batch.batch_lot_number}</td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {locationById.get(batch.location_id) ?? "Unknown location"}
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {batch.quantity_on_hand} / {batch.quantity_received}
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {money(calculateBatchValue(batch.quantity_on_hand, batch.unit_cost))}
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          {batch.expiry_date ?? "No expiry"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={
                                  isPreview
                                    ? `/consumables/${batch.id}?preview=1`
                                    : `/consumables/${batch.id}`
                                }
                              >
                                View
                              </Link>
                            </Button>
                            {isAdmin && !batch.archived_at ? (
                              <ConfirmActionForm
                                action={archiveConsumableBatchAction}
                                confirmMessage={`Archive batch ${batch.batch_lot_number}?`}
                              >
                                <input name="id" type="hidden" value={batch.id} />
                                <Button type="submit" variant="outline" size="sm">
                                  <Archive className="size-4" aria-hidden="true" />
                                  Archive
                                </Button>
                              </ConfirmActionForm>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No consumable batches match the current view.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
