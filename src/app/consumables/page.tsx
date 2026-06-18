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
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  listConsumableBatches,
  listConsumableCategories,
  listConsumableItems,
} from "@/lib/consumables/server";
import { calculateBatchValue } from "@/lib/consumables/service";
import { getPublicEnvStatus } from "@/lib/env";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";

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
  const statusMessage = getParam(params.statusMessage);
  const issuedSummary = getParam(params.issuedSummary);
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const envConfigured = getPublicEnvStatus().configured;

  const [categories, items, locationRows, rawBatches] = user
    ? await Promise.all([
        listConsumableCategories(includeArchived, role),
        listConsumableItems(includeArchived, role),
        listLocations(false, role),
        listConsumableBatches({ locationId, search, lowQuantity, includeArchived }, role),
      ])
    : [[], [], [], []];

  const locations = toLocationOptions(locationRows);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const locationById = new Map(locations.map((location) => [location.value, location.label]));
  const batches = categoryId
    ? rawBatches.filter((batch) => itemById.get(batch.item_id)?.category_id === categoryId)
    : rawBatches;

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Consumable stock
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              Consumables
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
              Manage consumable items and batches with quantities, value, expiry, location, and QR
              traceability.
            </p>
          </div>
          {isAdmin ? (
            <Button asChild variant="outline" size="sm">
              <Link href={includeArchived ? "/consumables" : "/consumables?archived=1"}>
                <Archive className="size-4" aria-hidden="true" />
                {includeArchived ? "Hide archived" : "View archived"}
              </Link>
            </Button>
          ) : null}
        </div>

        {!envConfigured ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
            Supabase is not configured yet, so live consumable records cannot be loaded.
          </p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
            {issuedSummary ? (
              <span className="mt-1 block text-[var(--muted)]">
                Issued batches: {issuedSummary}
              </span>
            ) : null}
          </p>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
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
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                name="reason"
                required
              />
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

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
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

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create batch</h2>
          </div>
          <form action={createConsumableBatchAction} className="mt-4 grid gap-4">
            <BatchFields items={items} locations={locations} />
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
          <form className="mt-4 grid gap-3 md:grid-cols-5">
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
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <PackageCheck className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Batch list</h2>
          </div>
          {batches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
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
                  {batches.map((batch) => {
                    const item = itemById.get(batch.item_id);
                    return (
                      <tr key={batch.id}>
                        <td className="px-5 py-4">
                          <Link
                            className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                            href={`/consumables/${batch.id}`}
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
                              <Link href={`/consumables/${batch.id}`}>View</Link>
                            </Button>
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
