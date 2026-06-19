import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, MapPinned, Package } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AttachmentSection } from "@/components/attachment-section";
import { Button } from "@/components/ui/button";
import { PrintableQrLabel, QrCodeCard } from "@/components/qr-code-card";
import { listDocumentAttachments } from "@/lib/attachments/server";
import { getCurrentUserContext } from "@/lib/auth";
import { listAssets } from "@/lib/assets/server";
import { listConsumableBatches } from "@/lib/consumables/server";
import { buildLocationQrCodeValue } from "@/lib/qr";
import { getLocationById, listLocations } from "@/lib/locations/server";
import { locationTypeLabels } from "@/lib/locations/validation";

export const dynamic = "force-dynamic";

type LocationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const scanActionMessages: Record<string, string> = {
  move: "Scan action: this location can now be used as the destination for an asset move.",
  stocktake: "Scan action: stocktake workflow placeholder.",
};

export default async function LocationDetailPage({
  params,
  searchParams,
}: LocationDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const location = await getLocationById(id);

  if (!location) {
    notFound();
  }

  const [assetRows, batchRows, locationRows] = await Promise.all([
    listAssets({ locationId: id }, role),
    listConsumableBatches({ locationId: id }, role),
    listLocations(role === "system_admin", role),
  ]);
  const attachments = await listDocumentAttachments("location", id, role);

  const qrPayload = buildLocationQrCodeValue(location.id);
  const activeLocations = locationRows.filter((candidate) => !candidate.archived_at).length;
  const scanAction = getParam(query.scanAction);
  const attachmentStatus = getParam(query.attachmentStatus);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/locations">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Locations
            </Link>
          </Button>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {locationTypeLabels[location.type as keyof typeof locationTypeLabels] ?? location.type}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {location.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {location.address || "Address not recorded"} | {location.state}
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Boxes className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-sm font-medium text-[var(--muted)]">Assets at location</h2>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{assetRows.length}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-sm font-medium text-[var(--muted)]">Consumable batches</h2>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{batchRows.length}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <MapPinned className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-sm font-medium text-[var(--muted)]">Active locations</h2>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{activeLocations}</p>
          </article>
        </section>

        {scanAction ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {scanActionMessages[scanAction] ?? "Scan action received."}
          </p>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Location details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">Location type</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {locationTypeLabels[location.type as keyof typeof locationTypeLabels] ??
                  location.type}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">QR code value</dt>
              <dd className="mt-1 break-all text-[var(--ink)]">{qrPayload}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Address</dt>
              <dd className="mt-1 text-[var(--ink)]">{location.address || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Notes</dt>
              <dd className="mt-1 text-[var(--ink)]">{location.notes || "Not recorded"}</dd>
            </div>
          </dl>
        </section>

        <QrCodeCard
          label="Location QR payload"
          payload={qrPayload}
          subtitle="Use this label for site signage, stocktake packs, or future scan-to-location workflows."
          title="Location QR label"
        />

        <PrintableQrLabel
          meta={`${location.name} | ${location.state}`}
          name="Location label"
          payload={qrPayload}
        />

        <AttachmentSection
          attachments={attachments}
          ownerId={location.id}
          ownerType="location"
          redirectPath={`/locations/${location.id}`}
          role={role}
          status={attachmentStatus}
          subtitle="Store site photos, access notes, floor plans, or local operating instructions."
          title="Location attachments"
        />
      </section>
    </AppShell>
  );
}
