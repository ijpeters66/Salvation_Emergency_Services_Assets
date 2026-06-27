import Link from "next/link";
import { Archive, MapPinned, PencilLine, Plus } from "lucide-react";

import {
  createLocationAction,
  updateLocationAction,
  archiveLocationAction,
} from "@/app/locations/actions";
import { AppShell } from "@/components/app-shell";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getPublicEnvStatus } from "@/lib/env";
import { listLocations } from "@/lib/locations/server";
import { locationTypeLabels, locationTypes } from "@/lib/locations/validation";
import { previewLocations } from "@/lib/workflow-preview";

export const dynamic = "force-dynamic";

type LocationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  created: "Location created.",
  updated: "Location updated.",
  archived: "Location archived.",
  "queued-offline": "Location change saved offline and queued for sync.",
  "validation-error": "Check the location details and try again.",
  "auth-error": "You need an active signed-in session to change locations.",
  "save-error": "The location could not be saved. Try again or check Supabase configuration.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Active";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function LocationFields({
  defaults,
}: {
  defaults?: {
    name: string;
    type: string;
    address: string | null;
    state: string;
    notes: string | null;
  };
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Name
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={defaults?.name}
          name="name"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Type
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={defaults?.type ?? "warehouse"}
          name="type"
          required
        >
          {locationTypes.map((type) => (
            <option key={type} value={type}>
              {locationTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Address
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={defaults?.address ?? ""}
          name="address"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        State
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={defaults?.state ?? "Victoria"}
          name="state"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
        Notes
        <textarea
          className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={defaults?.notes ?? ""}
          name="notes"
        />
      </label>
    </div>
  );
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const isAdmin = user?.role === "system_admin";
  const isPreview = getParam(params.preview) === "1";
  const includeArchived = isAdmin && getParam(params.archived) === "1";
  const locations =
    isPreview && !user ? [...previewLocations] : user ? await listLocations(includeArchived, user.role) : [];
  const status = getParam(params.status) ?? getParam(params.statusMessage);
  const message = status ? statusMessages[status] : null;
  const envConfigured = getPublicEnvStatus().configured;

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Location management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
              Locations
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
              Manage warehouses, storage facilities, and temporary deployment locations.
            </p>
            {isPreview ? (
              <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
            ) : null}
          </div>
          {isAdmin ? (
            <Button asChild variant="outline" size="sm">
              <Link href={includeArchived ? "/locations" : "/locations?archived=1"}>
                <Archive className="size-4" aria-hidden="true" />
                {includeArchived ? "Hide archived" : "View archived"}
              </Link>
            </Button>
          ) : null}
        </div>

        {!envConfigured ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted)]">
            Supabase is not configured yet, so live location records cannot be loaded.
          </p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create location</h2>
          </div>
          <OfflineMutationForm
            action={createLocationAction}
            className="mt-4 grid gap-4"
            displayLabelFields={["name"]}
            entityType="location"
            operationType="create"
            redirectPath="/locations"
          >
            <LocationFields />
            <div>
              <Button type="submit">Create location</Button>
            </div>
          </OfflineMutationForm>
        </section>

        <OfflineSyncPanel entityTypes={["location"]} title="Offline location changes" />

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
            <MapPinned className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Location register</h2>
          </div>

          {locations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Location register showing name, type, address, state, status, and actions.
                </caption>
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Address</th>
                    <th className="px-5 py-3 font-semibold">State</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-5 py-4 font-medium text-[var(--ink)]">
                        <Link
                          className="hover:text-[var(--brand-red)]"
                          href={isPreview ? `/locations/${location.id}?preview=1` : `/locations/${location.id}`}
                        >
                          {location.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {locationTypeLabels[location.type as keyof typeof locationTypeLabels] ??
                          location.type}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {location.address || "Not recorded"}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{location.state}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {formatDate(location.archived_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--ink)]">
                              <PencilLine className="size-4" aria-hidden="true" />
                              Edit
                            </summary>
                            <OfflineMutationForm
                              action={updateLocationAction}
                              className="mt-3 grid w-[min(34rem,80vw)] gap-4 rounded-md border border-[var(--border)] bg-white p-4 shadow-sm"
                              displayLabelFields={["name"]}
                              entityIdField="id"
                              entityType="location"
                              operationType="update"
                              redirectPath="/locations"
                            >
                              <input name="id" type="hidden" value={location.id} />
                              <input name="offlineUpdatedAt" type="hidden" value={location.updated_at} />
                              <LocationFields defaults={location} />
                              <div>
                                <Button type="submit" size="sm">
                                  Save changes
                                </Button>
                              </div>
                            </OfflineMutationForm>
                          </details>
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={isPreview ? `/locations/${location.id}?preview=1` : `/locations/${location.id}`}
                            >
                              View
                            </Link>
                          </Button>
                          {isAdmin && !location.archived_at ? (
                            <form action={archiveLocationAction}>
                              <input name="id" type="hidden" value={location.id} />
                              <Button type="submit" variant="outline" size="sm">
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
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No locations are available yet. Create the first warehouse, storage facility, or
              temporary deployment location to start the register.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
