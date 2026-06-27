import { AppShell } from "@/components/app-shell";

import { ScanClient } from "./scan-client";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const params = (await searchParams) ?? {};
  const isPreview = getParam(params.preview) === "1";

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            QR scanning
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">Scan</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Scan to open a record, move an asset, issue consumables, or prepare a stocktake
            workflow.
          </p>
          {isPreview ? (
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">Preview mode</p>
          ) : null}
        </div>
        <ScanClient preview={isPreview} />
      </section>
    </AppShell>
  );
}
