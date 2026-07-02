import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  summary: string;
};

export function ModulePlaceholder({ eyebrow, title, summary }: ModulePlaceholderProps) {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{title}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{summary}</p>
        </div>

        <div className="grid gap-5 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">This module is wired and ready</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The shell, navigation, and responsive layout are already in place. The next slice can drop in the
              workflow without rebuilding the page structure.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/scan">
                <QrCode className="size-4" aria-hidden="true" />
                Open scan flow
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
