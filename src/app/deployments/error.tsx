"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function DeploymentsError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Deployment data could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry deployments"
      title="Deployments unavailable"
    />
  );
}
