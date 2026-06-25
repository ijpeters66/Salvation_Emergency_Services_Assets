import { AppShell } from "@/components/app-shell";

export default function DashboardLoading() {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="grid gap-2">
          <div className="h-4 w-32 rounded bg-[var(--surface)]" />
          <div className="h-10 w-52 rounded bg-[var(--surface)]" />
          <div className="h-5 w-full max-w-2xl rounded bg-[var(--surface)]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div className="rounded-md border border-[var(--border)] bg-white p-5" key={index}>
              <div className="h-4 w-28 rounded bg-[var(--surface)]" />
              <div className="mt-4 h-10 w-20 rounded bg-[var(--surface)]" />
              <div className="mt-3 h-4 w-full rounded bg-[var(--surface)]" />
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
