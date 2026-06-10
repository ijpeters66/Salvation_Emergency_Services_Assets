import { AppShell } from "@/components/app-shell";

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
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">{title}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{summary}</p>
        </div>

        <div className="rounded-md border border-dashed border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Protected content placeholder</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Business logic will be added in a later vertical slice. This route is wired into the app
            shell, navigation, styling, and testable route surface.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
