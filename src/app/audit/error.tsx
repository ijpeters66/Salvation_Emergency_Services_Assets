"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function AuditError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="The audit trail could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry audit"
      title="Audit unavailable"
    />
  );
}
