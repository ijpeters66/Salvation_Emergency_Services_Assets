"use client";

import Link from "next/link";
import { AlertTriangle, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { Notice } from "@/components/notice";
import {
  listOptimisticRecords,
  type OfflineEntityType,
  type OfflineOptimisticRecord,
} from "@/lib/offline/indexed-db";

type OfflineSyncPanelProps = {
  title?: string;
  entityTypes?: OfflineEntityType[];
  entityId?: string;
  parentEntityId?: string;
};

function matchesRecord(
  record: OfflineOptimisticRecord,
  entityTypes: OfflineEntityType[] | undefined,
  entityId: string | undefined,
  parentEntityId: string | undefined,
) {
  if (record.sync_status === "synced") {
    return false;
  }

  if (entityTypes && !entityTypes.includes(record.entity_type)) {
    return false;
  }

  if (entityId && record.entity_id !== entityId) {
    return false;
  }

  if (parentEntityId && record.parent_entity_id !== parentEntityId && record.entity_id !== parentEntityId) {
    return false;
  }

  return true;
}

export function OfflineSyncPanel({
  title = "Pending sync",
  entityTypes,
  entityId,
  parentEntityId,
}: OfflineSyncPanelProps) {
  const [records, setRecords] = useState<OfflineOptimisticRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const nextRecords = await listOptimisticRecords().catch(() => []);

      if (!cancelled) {
        setRecords(
          nextRecords.filter((record) => matchesRecord(record, entityTypes, entityId, parentEntityId)),
        );
      }
    };

    void refresh();
    window.addEventListener("offline-store-changed", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("offline-store-changed", refresh);
    };
  }, [entityId, entityTypes, parentEntityId]);

  if (records.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <Notice title={title} variant="warning">
        Pending offline changes will sync when the device is back online.
      </Notice>
      <div className="mt-3 grid gap-3">
        {records.map((record) => (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm shadow-sm"
            key={record.key}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-[var(--ink)]">{record.display_label}</p>
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  record.sync_status === "sync_conflict"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {record.sync_status === "sync_conflict" ? (
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                ) : (
                  <Clock3 className="size-3.5" aria-hidden="true" />
                )}
                {record.sync_status === "sync_conflict" ? "Conflict" : "Pending sync"}
              </span>
            </div>
            {record.last_error ? (
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{record.last_error}</p>
            ) : null}
            <div className="mt-2">
              <Link className="text-xs font-medium text-[var(--brand-red)]" href={record.route}>
                Open related page
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
