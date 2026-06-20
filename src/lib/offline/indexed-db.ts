export const OFFLINE_DATABASE_NAME = "saes-offline";
export const OFFLINE_DATABASE_VERSION = 1;
export const REFERENCE_DATA_STORE = "reference_data";
export const MUTATION_QUEUE_STORE = "mutation_queue";

export const REFERENCE_DATA_KEYS = [
  "locations",
  "assetCategories",
  "consumableCategories",
  "consumableItems",
  "recentAssets",
  "recentConsumableBatches",
] as const;

export type OfflineReferenceDataKey = (typeof REFERENCE_DATA_KEYS)[number];
export type OfflineSyncStatus = "pending" | "synced" | "sync_conflict" | "failed";

export type OfflineReferenceDataRecord<T = unknown> = {
  key: OfflineReferenceDataKey;
  data: T;
  updatedAt: string;
};

export type OfflineMutationRecord = {
  id: string;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  sync_status: OfflineSyncStatus;
};

export type OfflineBootstrapPayload = {
  generatedAt: string;
  referenceData: Record<OfflineReferenceDataKey, unknown[]>;
};

function createIndexedDbUnavailableError() {
  return new Error("IndexedDB is not available in this runtime.");
}

export function createOfflineMutation(input: Partial<OfflineMutationRecord> & {
  operation_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
}): OfflineMutationRecord {
  return {
    id: input.id ?? crypto.randomUUID(),
    operation_type: input.operation_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    payload: input.payload,
    created_at: input.created_at ?? new Date().toISOString(),
    retry_count: input.retry_count ?? 0,
    sync_status: input.sync_status ?? "pending",
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
        const store = database.createObjectStore(MUTATION_QUEUE_STORE, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("sync_status", "sync_status", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

async function runTransaction<T>(
  storeName: typeof REFERENCE_DATA_STORE | typeof MUTATION_QUEUE_STORE,
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
  const record: OfflineReferenceDataRecord<T> = {
    key,
    data,
    updatedAt,
  };

  await runTransaction(REFERENCE_DATA_STORE, "readwrite", (store) => store.put(record));
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
  return record;
}

export async function listQueuedOfflineMutations() {
  const records = await runTransaction<OfflineMutationRecord[]>(MUTATION_QUEUE_STORE, "readonly", (store) =>
    store.getAll(),
  );

  return records.sort((left, right) => left.created_at.localeCompare(right.created_at));
}

export async function cacheOfflineBootstrapPayload(payload: OfflineBootstrapPayload) {
  const entries = Object.entries(payload.referenceData) as Array<[OfflineReferenceDataKey, unknown[]]>;

  await Promise.all(entries.map(([key, value]) => setOfflineReferenceData(key, value, payload.generatedAt)));
}
