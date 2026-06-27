import {
  deleteOptimisticRecord,
  getOfflineMutation,
  getOptimisticRecord,
  listQueuedOfflineMutations,
  queueOfflineMutation,
  updateOptimisticRecord,
  type OfflineMutationRecord,
  type OfflineOptimisticRecord,
} from "@/lib/offline/indexed-db";
import {
  reportOfflineMutationFailure,
  reportOfflineSyncError,
} from "@/lib/observability";

export type OfflineSyncSuccess = {
  ok: true;
  mutationId: string;
  serverEntityId?: string | null;
  serverUpdatedAt?: string | null;
};

export type OfflineSyncConflict = {
  ok: false;
  mutationId: string;
  conflict: true;
  message: string;
};

export type OfflineSyncFailure = {
  ok: false;
  mutationId: string;
  conflict?: false;
  message: string;
};

export type OfflineSyncResult = OfflineSyncSuccess | OfflineSyncConflict | OfflineSyncFailure;

export function detectOfflineSyncConflict(
  baselineUpdatedAt: string | null | undefined,
  currentUpdatedAt: string | null | undefined,
) {
  if (!baselineUpdatedAt || !currentUpdatedAt) {
    return false;
  }

  return baselineUpdatedAt !== currentUpdatedAt;
}

export function shouldRetryOfflineMutation(record: Pick<OfflineMutationRecord, "retry_count" | "sync_status">) {
  return record.sync_status !== "sync_conflict" && record.retry_count < 3;
}

export async function markOfflineMutationFailed(
  mutationId: string,
  message: string,
  nextRetryCount: number,
) {
  const current = await getOfflineMutation(mutationId);

  if (!current) {
    return null;
  }

  const nextStatus = nextRetryCount >= 3 ? "failed" : "pending";
  const updatedRecord: OfflineMutationRecord = {
    ...current,
    retry_count: nextRetryCount,
    sync_status: nextStatus,
    last_error: message,
  };

  await queueOfflineMutation(updatedRecord);
  await updateOptimisticRecord(`${current.entity_type}:${current.entity_id}`, (record) => ({
    ...record,
    sync_status: "failed",
    last_error: message,
    updated_at: new Date().toISOString(),
  }));

  reportOfflineMutationFailure({
    mutationId,
    message,
    retryCount: nextRetryCount,
  });

  return updatedRecord;
}

async function markOfflineMutationConflict(mutation: OfflineMutationRecord, message: string) {
  const updatedRecord: OfflineMutationRecord = {
    ...mutation,
    sync_status: "sync_conflict",
    last_error: message,
  };

  await queueOfflineMutation(updatedRecord);
  await updateOptimisticRecord(`${mutation.entity_type}:${mutation.entity_id}`, (record) => ({
    ...record,
    sync_status: "sync_conflict",
    last_error: message,
    updated_at: new Date().toISOString(),
  }));

  reportOfflineSyncError({
    mutationId: mutation.id,
    message,
    status: 409,
  });
}

async function markOfflineMutationSynced(
  mutation: OfflineMutationRecord,
  result: OfflineSyncSuccess,
) {
  const nextStatusRecord: OfflineMutationRecord = {
    ...mutation,
    sync_status: "synced",
    last_error: null,
    server_entity_id: result.serverEntityId ?? mutation.server_entity_id ?? null,
    server_updated_at: result.serverUpdatedAt ?? mutation.server_updated_at ?? null,
  };

  await queueOfflineMutation(nextStatusRecord);

  const optimisticKey = `${mutation.entity_type}:${mutation.entity_id}`;
  const currentOptimistic = await getOptimisticRecord(optimisticKey);

  if (!currentOptimistic) {
    return;
  }

  const nextKey = `${currentOptimistic.entity_type}:${result.serverEntityId ?? currentOptimistic.entity_id}`;
  const nextOptimistic: OfflineOptimisticRecord = {
    ...currentOptimistic,
    entity_id: result.serverEntityId ?? currentOptimistic.entity_id,
    key: nextKey,
    sync_status: "synced",
    last_error: null,
    server_entity_id: result.serverEntityId ?? currentOptimistic.server_entity_id ?? null,
    server_updated_at: result.serverUpdatedAt ?? currentOptimistic.server_updated_at ?? null,
    updated_at: new Date().toISOString(),
  };

  await updateOptimisticRecord(optimisticKey, () => nextOptimistic);

  if (nextKey !== optimisticKey) {
    await deleteOptimisticRecord(optimisticKey);
  }
}

export async function syncQueuedOfflineMutations(
  submitter: (mutation: OfflineMutationRecord) => Promise<OfflineSyncResult>,
) {
  const queue = await listQueuedOfflineMutations();

  for (const mutation of queue) {
    if (mutation.sync_status === "synced") {
      continue;
    }

    if (!shouldRetryOfflineMutation(mutation)) {
      continue;
    }

    const result = await submitter(mutation);

    if (result.ok) {
      await markOfflineMutationSynced(mutation, result);
      continue;
    }

    if (result.conflict) {
      await markOfflineMutationConflict(mutation, result.message);
      continue;
    }

    reportOfflineSyncError({
      mutationId: mutation.id,
      message: result.message,
      status: null,
    });
    await markOfflineMutationFailed(mutation.id, result.message, mutation.retry_count + 1);
  }
}
