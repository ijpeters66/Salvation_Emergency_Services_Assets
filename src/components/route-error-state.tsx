"use client";

import { Button } from "@/components/ui/button";

export function RouteErrorState({
  title,
  description,
  retryLabel,
  reset,
}: {
  title: string;
  description: string;
  retryLabel: string;
  reset: () => void;
}) {
  return (
    <section className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">{description}</p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            {retryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
