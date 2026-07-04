import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ShortcutLink = {
  description: string;
  href: string;
  label: string;
  selected?: boolean;
};

type ShortcutLinksProps = {
  description?: string;
  items: readonly ShortcutLink[];
  title: string;
};

export function ShortcutLinks({ description, items, title }: ShortcutLinksProps) {
  return (
    <section className="panel-card-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            aria-current={item.selected ? "page" : undefined}
            className={cn(
              "group grid gap-2 rounded-xl border border-[color-mix(in_srgb,var(--border)_84%,white)] bg-white/80 p-4 transition-colors hover:border-[var(--brand-red)] hover:bg-white",
              item.selected && "border-[var(--brand-red)] bg-[color-mix(in_srgb,var(--brand-red)_8%,white)]",
            )}
            href={item.href}
            key={item.href}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-[var(--ink)]">{item.label}</span>
              <ArrowRight
                className={cn(
                  "mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  item.selected ? "text-[var(--brand-red-dark)]" : "text-[var(--brand-red)]",
                )}
                aria-hidden="true"
              />
            </div>
            <span className="text-sm leading-6 text-[var(--muted)]">{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
