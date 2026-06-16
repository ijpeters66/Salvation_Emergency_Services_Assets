import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, PencilLine } from "lucide-react";

import { archiveAssetAction, updateAssetAction } from "@/app/assets/actions";
import { AssetFields } from "@/app/assets/asset-form";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getAssetById, listAssetCategories } from "@/lib/assets/server";
import { assetStatusLabels } from "@/lib/assets/validation";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions } from "@/lib/locations/service";

export const dynamic = "force-dynamic";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

  const [categories, locationRows] = await Promise.all([
    listAssetCategories(isAdmin, role),
    listLocations(false, role),
  ]);
  const locations = toLocationOptions(locationRows);
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const locationById = new Map(locations.map((location) => [location.value, location.label]));
  const statusMessage = getParam(query.statusMessage);

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

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit asset</h2>
          </div>
          <form action={updateAssetAction} className="mt-4 grid gap-4">
            <input name="id" type="hidden" value={asset.id} />
            <AssetFields asset={asset} categories={categories} locations={locations} />
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
