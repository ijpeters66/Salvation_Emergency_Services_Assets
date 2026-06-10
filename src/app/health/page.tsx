import { CheckCircle2, XCircle } from "lucide-react";

import { getPublicEnvStatus } from "@/lib/env";

export default function HealthPage() {
  const envStatus = getPublicEnvStatus();
  const Icon = envStatus.configured ? CheckCircle2 : XCircle;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10">
      <section className="w-full max-w-2xl rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Icon
            className={`mt-1 size-6 ${envStatus.configured ? "text-emerald-600" : "text-[var(--brand-red)]"}`}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Health check
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--ink)]">Application status</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The app can load safely. Supabase configuration is{" "}
              <strong>{envStatus.configured ? "configured" : "not configured"}</strong>.
            </p>
          </div>
        </div>

        {!envStatus.configured && (
          <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Missing configuration</h2>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
              {envStatus.missing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
