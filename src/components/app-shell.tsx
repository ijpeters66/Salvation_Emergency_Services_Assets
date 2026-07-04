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
  const roleContext =
    user?.role === "system_admin" ? "Admin tools visible" : user ? "Operational user view" : "Login required";

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(225,45,60,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,127,175,0.08),transparent_24%)]"
      />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--ink)] focus:shadow-lg"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/82 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-red)] text-white shadow-sm">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-[var(--ink)]">
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
              <span className="rounded-full border border-[color-mix(in_srgb,var(--brand-red)_20%,var(--border))] bg-[color-mix(in_srgb,var(--brand-red)_7%,white)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-red-dark)]">
                {roleContext}
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
        <aside className="border-b border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/72 backdrop-blur lg:border-b-0 lg:border-r">
          <AppShellNav items={navItems} />
        </aside>
        <main id="main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
