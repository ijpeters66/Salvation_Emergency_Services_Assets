import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type DashboardTileProps = {
  description: string;
  href?: string;
  icon: LucideIcon;
  label: string;
  tone?: "default" | "alert";
  value: string;
};

export function DashboardTile({
  description,
  href,
  icon: Icon,
  label,
  tone = "default",
  value,
}: DashboardTileProps) {
  const classes = [
    "group rounded-2xl border p-5 transition-all duration-200",
    tone === "alert"
      ? "border-amber-200 bg-amber-50/90 shadow-sm hover:-translate-y-0.5 hover:bg-amber-100"
      : "border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/90 shadow-sm hover:-translate-y-0.5 hover:bg-white",
  ].join(" ");

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</h2>
        <Icon className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </>
  );

  if (!href) {
    return <article className={classes}>{content}</article>;
  }

  return (
    <Link className={`block ${classes}`} href={href}>
      {content}
    </Link>
  );
}
