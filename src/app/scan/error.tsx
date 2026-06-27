"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function ScanError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="The QR scan workflow could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry scan"
      title="Scan unavailable"
    />
  );
}
