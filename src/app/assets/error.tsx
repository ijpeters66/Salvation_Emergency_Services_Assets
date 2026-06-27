"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function AssetsError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="The asset register could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry assets"
      title="Assets unavailable"
    />
  );
}
