"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="System settings could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry settings"
      title="Settings unavailable"
    />
  );
}
