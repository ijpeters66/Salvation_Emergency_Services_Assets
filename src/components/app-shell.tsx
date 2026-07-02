import Link from "next/link";
import { LogOut, QrCode, ShieldCheck, UserRound } from "lucide-react";

import { AppShellNav } from "@/components/app-shell-nav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/login/actions";
import { getCurrentUserContext } from "@/lib/auth";
import { getProfileLabel, getRoleAwareNavItems } from "@/lib/auth-state";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUserContext();
  const profileLabel = getProfileLabel(user);
  const navItems = getRoleAwareNavItems(user?.role ?? "user");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--ink)] focus:shadow-lg"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/95 backdrop-blur">
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
            <div className="hidden min-w-0 items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 sm:flex">
              <UserRound className="size-4 shrink-0 text-[var(--brand-red)]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block max-w-44 truncate text-xs font-medium text-[var(--ink)]">
                  {profileLabel.primary}
                </span>
                <span className="block text-xs text-[var(--muted)]">{profileLabel.secondary}</span>
              </span>
            </div>
            {user ? (
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm" aria-label="Logout">
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Login</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href="/scan">
                <QrCode className="size-4" aria-hidden="true" />
                Scan
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-[var(--border)] bg-white lg:border-b-0 lg:border-r">
          <AppShellNav items={navItems} />
        </aside>
        <main id="main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
