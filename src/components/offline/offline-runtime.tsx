"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloudOff, CloudUpload } from "lucide-react";

import {
  cacheOfflineBootstrapPayload,
  listQueuedOfflineMutations,
  type OfflineBootstrapPayload,
} from "@/lib/offline/indexed-db";
import { getPublicEnvStatus } from "@/lib/env";
import { syncQueuedOfflineMutations, type OfflineSyncResult } from "@/lib/offline/sync";
import { reportOfflineSyncError } from "@/lib/observability";

function getNavigatorOnlineState() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

async function refreshOfflineBootstrap() {
  if (!getPublicEnvStatus().configured) {
    return;
  }

  const response = await fetch("/api/offline/bootstrap", {
    credentials: "include",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return;
  }

  const payload = (await response.json()) as OfflineBootstrapPayload;
  await cacheOfflineBootstrapPayload(payload);
}

export function OfflineRuntime() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedMutations, setQueuedMutations] = useState(0);
  const syncInFlight = useRef(false);

  useEffect(() => {
    const refreshQueueCount = async () => {
      const queue = await listQueuedOfflineMutations().catch(() => []);
      setQueuedMutations(queue.filter((record) => record.sync_status !== "synced").length);
    };

    const syncQueue = async () => {
      if (syncInFlight.current || !getNavigatorOnlineState() || !getPublicEnvStatus().configured) {
        return;
      }

      syncInFlight.current = true;

      try {
        await syncQueuedOfflineMutations(async (mutation): Promise<OfflineSyncResult> => {
          const response = await fetch("/api/offline/sync", {
            method: "POST",
            credentials: "include",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(mutation),
          });

          return (await response.json()) as OfflineSyncResult;
        });
      } catch {
        reportOfflineSyncError({
          message: "Queued offline mutations could not be synchronised.",
          mutationId: null,
          status: null,
        });
      } finally {
        syncInFlight.current = false;
        await refreshQueueCount().catch(() => undefined);
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await refreshOfflineBootstrap().catch(() => {
        reportOfflineSyncError({
          message: "Offline bootstrap refresh failed after reconnect.",
          mutationId: null,
          status: null,
        });
      });
      await syncQueue().catch(() => undefined);
    };

    const handleOffline = async () => {
      setIsOnline(false);
      await refreshQueueCount().catch(() => undefined);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-store-changed", refreshQueueCount);

    const timer = window.setTimeout(() => {
      setIsOnline(getNavigatorOnlineState());
      void refreshOfflineBootstrap().catch(() => {
        reportOfflineSyncError({
          message: "Offline bootstrap refresh failed during startup.",
          mutationId: null,
          status: null,
        });
      });
      void refreshQueueCount().catch(() => undefined);
      void syncQueue().catch(() => undefined);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-store-changed", refreshQueueCount);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const label = useMemo(() => {
    if (!isOnline) {
      return queuedMutations > 0 ? `Offline · ${queuedMutations} queued` : "Offline";
    }

    return queuedMutations > 0 ? `Online · ${queuedMutations} queued` : "Online";
  }, [isOnline, queuedMutations]);

  const Icon = isOnline ? CloudUpload : CloudOff;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <div
        aria-live="polite"
        className={[
          "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-sm",
          isOnline
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900",
        ].join(" ")}
        data-testid="offline-status-indicator"
      >
        <Icon className="size-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
