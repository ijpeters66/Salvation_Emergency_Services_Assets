import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";

import { AttachmentSection } from "@/components/attachment-section";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { listDocumentAttachments } from "@/lib/attachments/server";
import { getCurrentUserContext } from "@/lib/auth";
import { getAssetById } from "@/lib/assets/server";
import { getMaintenanceRecordById } from "@/lib/maintenance/server";

export const dynamic = "force-dynamic";

type MaintenanceRecordDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export default async function MaintenanceRecordDetailPage({
  params,
  searchParams,
}: MaintenanceRecordDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getCurrentUserContext();
  const role = user?.role ?? "user";
  const record = await getMaintenanceRecordById(id);

  if (!record) {
    notFound();
  }

  const [asset, attachments] = await Promise.all([
    getAssetById(record.asset_id),
    listDocumentAttachments("maintenance_record", id, role),
  ]);
  const attachmentStatus = getParam(query.attachmentStatus);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href={asset ? `/assets/${asset.id}` : "/maintenance"}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {asset ? "Back to asset" : "Maintenance"}
            </Link>
          </Button>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            Maintenance record
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {record.service_type}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {asset ? `${asset.asset_name} (${asset.unique_asset_id})` : "Asset reference unavailable"}
          </p>
        </div>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Record details</h2>
          </div>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">Date</dt>
              <dd className="mt-1 text-[var(--ink)]">{record.date}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Supplier/provider</dt>
              <dd className="mt-1 text-[var(--ink)]">{record.supplier_provider}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Description</dt>
              <dd className="mt-1 text-[var(--ink)]">{record.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Cost</dt>
              <dd className="mt-1 text-[var(--ink)]">{money(record.cost)}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Reading</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {record.odometer_hour_reading ?? "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Notes</dt>
              <dd className="mt-1 text-[var(--ink)]">{record.notes || "Not recorded"}</dd>
            </div>
          </dl>
        </section>

        <AttachmentSection
          attachments={attachments}
          ownerId={record.id}
          ownerType="maintenance_record"
          redirectPath={`/maintenance/records/${record.id}`}
          role={role}
          status={attachmentStatus}
          subtitle="Upload invoices, service sheets, and photo evidence linked to this maintenance record."
          title="Maintenance record attachments"
        />
      </section>
    </AppShell>
  );
}
