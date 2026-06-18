import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, PencilLine } from "lucide-react";

import {
  archiveConsumableBatchAction,
  updateConsumableBatchAction,
} from "@/app/consumables/actions";
import { BatchFields } from "@/app/consumables/batch-form";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import {
  getConsumableBatchById,
  listConsumableCategories,
  listConsumableItems,
} from "@/lib/consumables/server";
import { calculateBatchValue } from "@/lib/consumables/service";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

type BatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const batch = await getConsumableBatchById(id);
  if (!batch) notFound();

  const [categories, items, locationRows] = await Promise.all([
    listConsumableCategories(isAdmin, role),
    listConsumableItems(isAdmin, role),
    listLocations(false, role),
  ]);
  const locations = toLocationOptions(locationRows);
  const item = items.find((candidate) => candidate.id === batch.item_id);
  const category = categories.find((candidate) => candidate.id === item?.category_id);
  const location = locations.find((candidate) => candidate.value === batch.location_id);
  const totalValue = calculateBatchValue(batch.quantity_on_hand, batch.unit_cost);

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

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit batch</h2>
          </div>
          <form action={updateConsumableBatchAction} className="mt-4 grid gap-4">
            <input name="id" type="hidden" value={batch.id} />
            <BatchFields batch={batch} items={items} locations={locations} />
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
