import Link from "next/link";
import { QrCode, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appNavItems } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--brand-red)] text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                SAES Asset Register
              </span>
              <span className="block truncate text-xs text-[var(--muted)]">
                Victoria emergency services logistics
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">
                <QrCode className="size-4" aria-hidden="true" />
                Scan
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-[var(--border)] bg-white lg:border-b-0 lg:border-r">
          <nav aria-label="Main navigation" className="grid gap-1 p-3 lg:sticky lg:top-16">
            {appNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="grid grid-cols-[2rem_1fr] gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)]"
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="mt-0.5 size-4 text-[var(--brand-red)]" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="hidden text-xs leading-5 text-[var(--muted)] sm:block lg:hidden xl:block">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
