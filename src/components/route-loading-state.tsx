import { AppShell } from "@/components/app-shell";

export function RouteLoadingState({ title }: { title: string }) {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="grid gap-2">
          <div className="h-4 w-32 rounded bg-[var(--surface)]" />
          <div className="h-10 w-56 rounded bg-[var(--surface)]" />
          <div className="h-5 w-full max-w-2xl rounded bg-[var(--surface)]" />
        </div>
        <div className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="h-6 w-48 rounded bg-[var(--surface)]" />
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-12 rounded bg-[var(--surface)]" key={`${title}-${index}`} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
