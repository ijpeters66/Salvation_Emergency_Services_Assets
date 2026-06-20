import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  MUTATION_QUEUE_STORE,
  OFFLINE_DATABASE_NAME,
  OFFLINE_DATABASE_VERSION,
  REFERENCE_DATA_KEYS,
  REFERENCE_DATA_STORE,
  cacheOfflineBootstrapPayload,
  createOfflineMutation,
  getOfflineReferenceData,
  listOfflineReferenceData,
  listQueuedOfflineMutations,
  openOfflineDatabase,
  queueOfflineMutation,
} from "@/lib/offline/indexed-db";

describe("offline indexed db", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase(OFFLINE_DATABASE_NAME);
  });

  it("creates the offline stores", async () => {
    const database = await openOfflineDatabase();

    expect(database.version).toBe(OFFLINE_DATABASE_VERSION);
    expect(Array.from(database.objectStoreNames)).toEqual(
      expect.arrayContaining([REFERENCE_DATA_STORE, MUTATION_QUEUE_STORE]),
    );

    database.close();
  });

  it("caches bootstrap reference data", async () => {
    await cacheOfflineBootstrapPayload({
      generatedAt: "2026-06-20T00:00:00.000Z",
      referenceData: {
        locations: [{ id: "loc-1", name: "Ballarat" }],
        assetCategories: [{ id: "cat-1", name: "Vehicle" }],
        consumableCategories: [],
        consumableItems: [],
        recentAssets: [{ id: "asset-1", asset_name: "Support trailer" }],
        recentConsumableBatches: [],
      },
    });

    const locations = await getOfflineReferenceData<{ id: string; name: string }[]>("locations");
    const allRecords = await listOfflineReferenceData();

    expect(locations?.data).toEqual([{ id: "loc-1", name: "Ballarat" }]);
    expect(allRecords.map((record) => record.key).sort()).toEqual([...REFERENCE_DATA_KEYS].sort());
  });

  it("stores queued mutations in created order", async () => {
    await queueOfflineMutation(
      createOfflineMutation({
        id: "mutation-2",
        operation_type: "update",
        entity_type: "asset",
        entity_id: "asset-2",
        payload: { status: "deployed" },
        created_at: "2026-06-20T10:01:00.000Z",
      }),
    );

    await queueOfflineMutation(
      createOfflineMutation({
        id: "mutation-1",
        operation_type: "create",
        entity_type: "location",
        entity_id: "location-1",
        payload: { name: "Hamilton" },
        created_at: "2026-06-20T10:00:00.000Z",
      }),
    );

    const queue = await listQueuedOfflineMutations();

    expect(queue.map((record) => record.id)).toEqual(["mutation-1", "mutation-2"]);
    expect(queue[0]?.sync_status).toBe("pending");
  });
});
