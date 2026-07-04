"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

type AppShellNavProps = {
  items: readonly NavItem[];
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavContent({ items }: AppShellNavProps) {
  const pathname = usePathname();

  return (
    <div className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "grid min-h-11 grid-cols-[2rem_1fr] gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "border border-[var(--brand-red)] bg-[color-mix(in_srgb,var(--brand-red)_10%,white)] text-[var(--ink)] shadow-sm"
                : "text-[var(--foreground)] hover:bg-[var(--surface)]",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon
              className={cn("mt-0.5 size-4", active ? "text-[var(--brand-red-dark)]" : "text-[var(--brand-red)]")}
              aria-hidden="true"
            />
            <span>
              <span className={cn("block font-medium", active && "text-[var(--ink)]")}>{item.title}</span>
              <span className="hidden text-xs leading-5 text-[var(--muted)] sm:block lg:hidden xl:block">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppShellNav(props: AppShellNavProps) {
  const pathname = usePathname();
  const activeItem = props.items.find((item) => isActive(pathname, item.href));

  return (
    <>
      <details className="group border-b border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/70 lg:hidden">
        <summary className="flex h-14 list-none items-center justify-between gap-3 px-4 text-sm font-medium text-[var(--ink)] outline-none">
          <span className="truncate">Menu</span>
          <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <span className="truncate">{activeItem?.title ?? "Navigation"}</span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
        </summary>
        <div className="border-t border-[var(--border)] p-3">
          <NavContent {...props} />
        </div>
      </details>

      <nav aria-label="Main navigation" className="hidden gap-1 p-3 lg:grid">
        <NavContent {...props} />
      </nav>
    </>
  );
}
