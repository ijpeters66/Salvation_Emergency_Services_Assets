import Link from "next/link";
import { Archive, Filter, Package, Plus } from "lucide-react";

import { archiveAssetAction, createAssetAction } from "@/app/assets/actions";
import { AssetFields } from "@/app/assets/asset-form";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { AppShell } from "@/components/app-shell";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { listAssetCategories, listAssets } from "@/lib/assets/server";
import type { AssetCategoryRow, AssetRow } from "@/lib/assets/service";
import { assetStatusLabels } from "@/lib/assets/validation";
import { assetStatuses, isAssetStatus } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { listLocations } from "@/lib/locations/server";
import { toLocationOptions, type LocationOption } from "@/lib/locations/service";
import {
  previewAssetCategories,
  previewAssets,
  getPreviewLocationOptions,
} from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

type AssetsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  archived: "Asset archived.",
  "queued-offline": "Asset change saved offline and queued for sync.",
  "validation-error": "Check the asset details and try again.",
  "auth-error": "You need an active signed-in session to change assets.",
  "save-error": "The asset could not be saved. Check for duplicate IDs or Supabase setup.",
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

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const isAdmin = role === "system_admin";
  const includeArchived = isAdmin && getParam(params.archived) === "1";
  const rawStatus = getParam(params.status);
  const status = rawStatus && isAssetStatus(rawStatus) ? rawStatus : "all";
  const locationId = getParam(params.locationId) ?? "";
  const categoryId = getParam(params.categoryId) ?? "";
  const search = getParam(params.search) ?? "";
  const plantOnly = getParam(params.plantOnly) === "1";
  const isPreview = getParam(params.preview) === "1";
  const statusMessage = getParam(params.statusMessage);
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const envConfigured = getPublicEnvStatus().configured;
  const hasActiveFilters = Boolean(
    search || status !== "all" || categoryId || locationId || plantOnly || includeArchived,
  );
  const clearFiltersHref = isPreview ? "/assets?preview=1" : "/assets";

  let categories: AssetCategoryRow[] = [];
  let locations: LocationOption[] = [];
  let assets: AssetRow[] = [];

  if (isPreview && !user) {
    categories = [...previewAssetCategories] as AssetCategoryRow[];
    locations = getPreviewLocationOptions();
    assets = previewAssets.filter((asset) => {
      if (status !== "all" && asset.status !== status) return false;
      if (locationId && asset.current_location_id !== locationId) return false;
      if (categoryId && asset.category_id !== categoryId) return false;
      if (
        search &&
        !`${asset.asset_name} ${asset.unique_asset_id}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (plantOnly && asset.category_id !== "preview-asset-cat-2") return false;
      return true;
    }) as AssetRow[];
  } else if (user) {
    const [loadedCategories, locationRows, loadedAssets] = await Promise.all([
      listAssetCategories(includeArchived, role),
      listLocations(false, role),
      listAssets(
        {
          status,
          locationId,
          categoryId,
          search,
          includeArchived,
          plantOnly,
        },
        role,
      ),
    ]);

    categories = loadedCategories;
    locations = toLocationOptions(locationRows);
    assets = loadedAssets;
  }

  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const locationById = new Map(locations.map((location) => [location.value, location.label]));

  return (
    <AppShell>
      <section className="grid gap-6">
        <PageHero
          actions={
            isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href={includeArchived ? "/assets" : "/assets?archived=1"}>
                  <Archive className="size-4" aria-hidden="true" />
                  {includeArchived ? "Hide archived" : "View archived"}
                </Link>
              </Button>
            ) : null
          }
          aside={
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,white)] bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                {isPreview ? "Preview mode" : "Live register"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Track individual assets, QR codes, category, location, status, values, and history.
              </p>
            </div>
          }
          description="Track individual assets, QR codes, category, location, status, values, and history."
          eyebrow="Asset register"
          title="Assets"
        />

        {!envConfigured ? (
          <p className="panel-card-soft p-4 text-sm leading-6 text-[var(--muted)]">
            Supabase is not configured yet, so live asset records cannot be loaded.
          </p>
        ) : null}

        {message ? (
          <p className="panel-card p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section id="create-asset" className="panel-card p-5 scroll-mt-24">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create asset</h2>
          </div>
          <OfflineMutationForm
            action={createAssetAction}
            className="mt-4 grid gap-4"
            displayLabelFields={["assetName", "uniqueAssetId"]}
            entityType="asset"
            operationType="create"
            redirectPath="/assets"
          >
            <AssetFields categories={categories} locations={locations} />
            <div>
              <Button type="submit" disabled={categories.length === 0 || locations.length === 0}>
                Create asset
              </Button>
            </div>
          </OfflineMutationForm>
        </section>

        <OfflineSyncPanel entityTypes={["asset"]} title="Offline asset changes" />

        <section className="panel-card-soft p-5">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Filters</h2>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-6">
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={search}
              name="search"
              placeholder="Search assets"
            />
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
              defaultValue={status}
              name="status"
            >
              <option value="all">All statuses</option>
              {assetStatuses.map((item) => (
                <option key={item} value={item}>
                  {assetStatusLabels[item]}
                </option>
              ))}
            </select>
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
              <input defaultChecked={plantOnly} name="plantOnly" type="checkbox" value="1" />
              Plant/fleet
            </label>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
          {hasActiveFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
              <span className="font-medium text-[var(--ink)]">Active filters</span>
              {search ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Search: {search}
                </span>
              ) : null}
              {status !== "all" ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Status: {assetStatusLabels[status]}
                </span>
              ) : null}
              {categoryId ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Category selected
                </span>
              ) : null}
              {locationId ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Location selected
                </span>
              ) : null}
              {plantOnly ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Plant/fleet only
                </span>
              ) : null}
              {includeArchived ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                  Archived included
                </span>
              ) : null}
              <Button asChild className="ml-auto" size="sm" variant="outline">
                <Link href={clearFiltersHref}>Clear filters</Link>
              </Button>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/88 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Asset list</h2>
          </div>

          {assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Asset register showing asset name, category, location, status, value, and actions.
                </caption>
                <thead className="sticky top-16 z-10 bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Asset</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Current value</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {assets.map((asset) => (
                    <tr className="transition-colors hover:bg-[var(--surface)]" key={asset.id}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={isPreview ? `/assets/${asset.id}?preview=1` : `/assets/${asset.id}`}
                        >
                          {asset.asset_name}
                        </Link>
                        <span className="block text-xs text-[var(--muted)]">
                          {asset.unique_asset_id}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {categoryById.get(asset.category_id) ?? "Unknown category"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {locationById.get(asset.current_location_id) ?? "Unknown location"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ??
                          asset.status}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {money(asset.current_value)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={isPreview ? `/assets/${asset.id}?preview=1` : `/assets/${asset.id}`}>
                              View
                            </Link>
                          </Button>
                          {isAdmin && !asset.archived_at ? (
                            <ConfirmActionForm
                              action={archiveAssetAction}
                              confirmMessage={`Archive ${asset.asset_name}?`}
                            >
                              <input name="id" type="hidden" value={asset.id} />
                              <Button type="submit" variant="outline" size="sm">
                                <Archive className="size-4" aria-hidden="true" />
                                Archive
                              </Button>
                            </ConfirmActionForm>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 px-5 py-8">
              <p className="text-sm font-medium text-[var(--ink)]">No assets match the current view.</p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Create the first asset once at least one location exists, or clear the active filters
                to widen the list.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="#create-asset">Jump to create asset</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={isPreview ? "/assets?preview=1" : "/assets"}>Clear filters</Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
