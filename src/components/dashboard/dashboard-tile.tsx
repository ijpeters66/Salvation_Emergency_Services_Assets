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
    "rounded-md border p-5 transition-colors",
    tone === "alert"
      ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
      : "border-[var(--border)] bg-white hover:bg-[var(--surface)]",
  ].join(" ");

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">{label}</h2>
        <Icon className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-[var(--ink)]">{value}</p>
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
