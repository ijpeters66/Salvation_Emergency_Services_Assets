export type ObservabilitySeverity = "info" | "warn" | "error";

export type ObservabilityEvent = {
  event: string;
  severity: ObservabilitySeverity;
  message: string;
  context?: Record<string, unknown>;
};

function consoleForSeverity(severity: ObservabilitySeverity) {
  switch (severity) {
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    default:
      return console.info;
  }
}

export function reportObservabilityEvent(event: ObservabilityEvent) {
  const logger = consoleForSeverity(event.severity);
  logger(`[saes:${event.event}] ${event.message}`, event.context ?? {});

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("saes:observability", {
        detail: event,
      }),
    );
  }
}

export function reportOfflineSyncError({
  message,
  mutationId,
  status,
}: {
  message: string;
  mutationId?: string | null;
  status?: number | null;
}) {
  reportObservabilityEvent({
    event: "offline.sync_error",
    severity: "error",
    message,
    context: {
      mutationId: mutationId ?? null,
      status: status ?? null,
    },
  });
}

export function reportOfflineMutationFailure({
  message,
  mutationId,
  retryCount,
}: {
  message: string;
  mutationId: string;
  retryCount: number;
}) {
  reportObservabilityEvent({
    event: "offline.mutation_failed",
    severity: retryCount >= 3 ? "error" : "warn",
    message,
    context: {
      mutationId,
      retryCount,
    },
  });
}
