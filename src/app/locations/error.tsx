"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function LocationsError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Location data could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry locations"
      title="Locations unavailable"
    />
  );
}
