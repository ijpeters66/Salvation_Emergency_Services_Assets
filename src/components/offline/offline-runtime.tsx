"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff, CloudUpload } from "lucide-react";

import {
  cacheOfflineBootstrapPayload,
  listQueuedOfflineMutations,
  type OfflineBootstrapPayload,
} from "@/lib/offline/indexed-db";

function getNavigatorOnlineState() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

async function refreshOfflineBootstrap() {
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
  const [isOnline, setIsOnline] = useState(getNavigatorOnlineState);
  const [queuedMutations, setQueuedMutations] = useState(0);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await refreshOfflineBootstrap().catch(() => undefined);
      const queue = await listQueuedOfflineMutations().catch(() => []);
      setQueuedMutations(queue.length);
    };

    const handleOffline = async () => {
      setIsOnline(false);
      const queue = await listQueuedOfflineMutations().catch(() => []);
      setQueuedMutations(queue.length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    void refreshOfflineBootstrap().catch(() => undefined);
    void listQueuedOfflineMutations()
      .then((queue) => setQueuedMutations(queue.length))
      .catch(() => undefined);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
