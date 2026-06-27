"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function ReportsError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Reports could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry reports"
      title="Reports unavailable"
    />
  );
}
