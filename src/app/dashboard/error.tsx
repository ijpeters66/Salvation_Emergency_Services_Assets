"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/notice";

export default function DashboardError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Notice title="Dashboard unavailable" variant="error">
          The operational overview could not be loaded just now. Try again in a moment.
        </Notice>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Retry dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}
