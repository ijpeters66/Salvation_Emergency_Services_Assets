"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function MaintenanceError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Maintenance data could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry maintenance"
      title="Maintenance unavailable"
    />
  );
}
