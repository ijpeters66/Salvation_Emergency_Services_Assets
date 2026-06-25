export const OFFLINE_DATABASE_NAME = "saes-offline";
export const OFFLINE_DATABASE_VERSION = 2;
export const REFERENCE_DATA_STORE = "reference_data";
export const MUTATION_QUEUE_STORE = "mutation_queue";
export const OPTIMISTIC_RECORD_STORE = "optimistic_record";

export const REFERENCE_DATA_KEYS = [
  "locations",
  "assetCategories",
  "consumableCategories",
  "consumableItems",
  "recentAssets",
  "recentConsumableBatches",
] as const;

export const OFFLINE_ENTITY_TYPES = [
  "asset",
  "location",
  "stock_movement",
  "maintenance_record",
  "deployment",
] as const;

export const OFFLINE_MUTATION_OPERATIONS = ["create", "update"] as const;
export const OFFLINE_SYNC_STATUSES = ["pending", "synced", "sync_conflict", "failed"] as const;

export type OfflineReferenceDataKey = (typeof REFERENCE_DATA_KEYS)[number];
export type OfflineEntityType = (typeof OFFLINE_ENTITY_TYPES)[number];
export type OfflineMutationOperation = (typeof OFFLINE_MUTATION_OPERATIONS)[number];
export type OfflineSyncStatus = (typeof OFFLINE_SYNC_STATUSES)[number];

export type OfflineReferenceDataRecord<T = unknown> = {
  key: OfflineReferenceDataKey;
  data: T;
  updatedAt: string;
};

export type OfflineMutationRecord = {
  id: string;
  operation_type: OfflineMutationOperation;
  entity_type: OfflineEntityType;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  sync_status: OfflineSyncStatus;
  display_label?: string | null;
  route?: string | null;
  parent_entity_type?: string | null;
  parent_entity_id?: string | null;
  last_error?: string | null;
  server_entity_id?: string | null;
  server_updated_at?: string | null;
};

export type OfflineOptimisticRecord = {
  key: string;
  entity_type: OfflineEntityType;
  entity_id: string;
  display_label: string;
  route: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sync_status: OfflineSyncStatus;
  parent_entity_type?: string | null;
  parent_entity_id?: string | null;
  last_error?: string | null;
  server_entity_id?: string | null;
  server_updated_at?: string | null;
};

export type OfflineBootstrapPayload = {
  generatedAt: string;
  referenceData: Record<OfflineReferenceDataKey, unknown[]>;
};

function createIndexedDbUnavailableError() {
  return new Error("IndexedDB is not available in this runtime.");
}

function notifyOfflineStoreChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("offline-store-changed"));
}

export function createOfflineMutation(
  input: Partial<OfflineMutationRecord> & {
    operation_type: OfflineMutationOperation;
    entity_type: OfflineEntityType;
    entity_id: string;
    payload: Record<string, unknown>;
  },
): OfflineMutationRecord {
  return {
    id: input.id ?? crypto.randomUUID(),
    operation_type: input.operation_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    payload: input.payload,
    created_at: input.created_at ?? new Date().toISOString(),
    retry_count: input.retry_count ?? 0,
    sync_status: input.sync_status ?? "pending",
    display_label: input.display_label ?? null,
    route: input.route ?? null,
    parent_entity_type: input.parent_entity_type ?? null,
    parent_entity_id: input.parent_entity_id ?? null,
    last_error: input.last_error ?? null,
    server_entity_id: input.server_entity_id ?? null,
    server_updated_at: input.server_updated_at ?? null,
  };
}

export function createOfflineOptimisticRecord(
  input: Omit<OfflineOptimisticRecord, "key" | "created_at" | "updated_at" | "sync_status"> & {
    key?: string;
    created_at?: string;
    updated_at?: string;
    sync_status?: OfflineSyncStatus;
  },
): OfflineOptimisticRecord {
  return {
    key: input.key ?? `${input.entity_type}:${input.entity_id}`,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    display_label: input.display_label,
    route: input.route,
    payload: input.payload,
    created_at: input.created_at ?? new Date().toISOString(),
    updated_at: input.updated_at ?? new Date().toISOString(),
    sync_status: input.sync_status ?? "pending",
    parent_entity_type: input.parent_entity_type ?? null,
    parent_entity_id: input.parent_entity_id ?? null,
    last_error: input.last_error ?? null,
    server_entity_id: input.server_entity_id ?? null,
    server_updated_at: input.server_updated_at ?? null,
  };
}

export function serializeOfflineMutation(record: OfflineMutationRecord) {
  return JSON.stringify(record);
}

export function deserializeOfflineMutation(value: string) {
  return JSON.parse(value) as OfflineMutationRecord;
}

export async function openOfflineDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    throw createIndexedDbUnavailableError();
  }

  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DATABASE_NAME, OFFLINE_DATABASE_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Unable to open offline database."));
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(REFERENCE_DATA_STORE)) {
        database.createObjectStore(REFERENCE_DATA_STORE, { keyPath: "key" });
      }

      if (!database.objectStoreNames.contains(MUTATION_QUEUE_STORE)) {
        const mutationStore = database.createObjectStore(MUTATION_QUEUE_STORE, { keyPath: "id" });
        mutationStore.createIndex("created_at", "created_at", { unique: false });
        mutationStore.createIndex("sync_status", "sync_status", { unique: false });
      }

      if (!database.objectStoreNames.contains(OPTIMISTIC_RECORD_STORE)) {
        const optimisticStore = database.createObjectStore(OPTIMISTIC_RECORD_STORE, {
          keyPath: "key",
        });
        optimisticStore.createIndex("entity_type", "entity_type", { unique: false });
        optimisticStore.createIndex("sync_status", "sync_status", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

async function runTransaction<T>(
  storeName:
    | typeof REFERENCE_DATA_STORE
    | typeof MUTATION_QUEUE_STORE
    | typeof OPTIMISTIC_RECORD_STORE,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openOfflineDatabase();

  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = executor(store);

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

export async function setOfflineReferenceData<T>(
  key: OfflineReferenceDataKey,
  data: T,
  updatedAt = new Date().toISOString(),
) {
  const record: OfflineReferenceDataRecord<T> = { key, data, updatedAt };
  await runTransaction(REFERENCE_DATA_STORE, "readwrite", (store) => store.put(record));
  notifyOfflineStoreChanged();
  return record;
}

export async function getOfflineReferenceData<T>(key: OfflineReferenceDataKey) {
  return await runTransaction<OfflineReferenceDataRecord<T> | undefined>(REFERENCE_DATA_STORE, "readonly", (store) =>
    store.get(key),
  );
}

export async function listOfflineReferenceData() {
  return await runTransaction<OfflineReferenceDataRecord[]>(REFERENCE_DATA_STORE, "readonly", (store) =>
    store.getAll(),
  );
}

export async function queueOfflineMutation(record: OfflineMutationRecord) {
  await runTransaction(MUTATION_QUEUE_STORE, "readwrite", (store) => store.put(record));
  notifyOfflineStoreChanged();
  return record;
}

export async function getOfflineMutation(id: string) {
  return await runTransaction<OfflineMutationRecord | undefined>(MUTATION_QUEUE_STORE, "readonly", (store) =>
    store.get(id),
  );
}

export async function updateOfflineMutation(
  id: string,
  updater: (record: OfflineMutationRecord) => OfflineMutationRecord,
) {
  const current = await getOfflineMutation(id);

  if (!current) {
    return null;
  }

  const nextRecord = updater(current);
  await queueOfflineMutation(nextRecord);
  return nextRecord;
}

export async function listQueuedOfflineMutations() {
  const records = await runTransaction<OfflineMutationRecord[]>(MUTATION_QUEUE_STORE, "readonly", (store) =>
    store.getAll(),
  );

  return records.sort((left, right) => left.created_at.localeCompare(right.created_at));
}

export async function saveOptimisticRecord(record: OfflineOptimisticRecord) {
  await runTransaction(OPTIMISTIC_RECORD_STORE, "readwrite", (store) => store.put(record));
  notifyOfflineStoreChanged();
  return record;
}

export async function getOptimisticRecord(key: string) {
  return await runTransaction<OfflineOptimisticRecord | undefined>(OPTIMISTIC_RECORD_STORE, "readonly", (store) =>
    store.get(key),
  );
}

export async function listOptimisticRecords() {
  const records = await runTransaction<OfflineOptimisticRecord[]>(OPTIMISTIC_RECORD_STORE, "readonly", (store) =>
    store.getAll(),
  );

  return records.sort((left, right) => left.updated_at.localeCompare(right.updated_at));
}

export async function updateOptimisticRecord(
  key: string,
  updater: (record: OfflineOptimisticRecord) => OfflineOptimisticRecord,
) {
  const current = await getOptimisticRecord(key);

  if (!current) {
    return null;
  }

  const nextRecord = updater(current);
  await saveOptimisticRecord(nextRecord);
  return nextRecord;
}

export async function deleteOptimisticRecord(key: string) {
  await runTransaction(OPTIMISTIC_RECORD_STORE, "readwrite", (store) => store.delete(key));
  notifyOfflineStoreChanged();
}

export async function cacheOfflineBootstrapPayload(payload: OfflineBootstrapPayload) {
  const entries = Object.entries(payload.referenceData) as Array<[OfflineReferenceDataKey, unknown[]]>;
  await Promise.all(entries.map(([key, value]) => setOfflineReferenceData(key, value, payload.generatedAt)));
}
