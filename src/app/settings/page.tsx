import Image from "next/image";
import { redirect } from "next/navigation";
import { Palette, Settings2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { getReportBrandingSettings } from "@/lib/report-branding";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUserContext();

  if (user?.role !== "system_admin") {
    redirect("/dashboard");
  }

  const branding = getReportBrandingSettings();

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            System administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            Settings
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Report branding is available now. User management, categories, and configurable
            movement reasons will follow in the next settings phase.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Report branding</h2>
            </div>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-[var(--muted)]">Organisation</dt>
                <dd className="mt-1 text-[var(--ink)]">{branding.organizationName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--muted)]">Product</dt>
                <dd className="mt-1 text-[var(--ink)]">{branding.productName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--muted)]">Logo text</dt>
                <dd className="mt-1 text-[var(--ink)]">{branding.logoText}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--muted)]">Font family</dt>
                <dd className="mt-1 text-[var(--ink)]">{branding.fontFamily}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-[var(--muted)]">Tagline</dt>
                <dd className="mt-1 text-[var(--ink)]">{branding.tagline}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                { label: "Primary", value: branding.primaryColor },
                { label: "Secondary", value: branding.secondaryColor },
                { label: "Accent", value: branding.accentColor },
                { label: "Surface", value: branding.surfaceColor },
              ].map((swatch) => (
                <div className="grid gap-2" key={swatch.label}>
                  <span className="text-sm font-medium text-[var(--muted)]">{swatch.label}</span>
                  <div className="flex items-center gap-3 rounded-md border border-[var(--border)] p-3">
                    <span
                      aria-hidden="true"
                      className="size-8 rounded-md border border-black/10"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span className="text-sm text-[var(--ink)]">{swatch.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Settings2 className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Export preview</h2>
            </div>
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <Image
                  alt="SAES report mark"
                  height={40}
                  src="/saes-report-mark.svg"
                  width={40}
                />
                <div>
                  <p className="font-semibold text-[var(--ink)]">{branding.organizationName}</p>
                  <p className="text-sm text-[var(--muted)]">{branding.productName}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                PDF and XLSX exports now use the same brand settings, generated metadata, and
                report titles as the CSV export module.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
