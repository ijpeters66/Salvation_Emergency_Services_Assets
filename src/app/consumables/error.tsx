"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function ConsumablesError({ reset }: { reset: () => void }) {
  return (
    <RouteErrorState
      description="Consumable stock data could not be loaded just now. Try again in a moment."
      reset={reset}
      retryLabel="Retry consumables"
      title="Consumables unavailable"
    />
  );
}
