import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  OFFLINE_DATABASE_NAME,
  createOfflineMutation,
  createOfflineOptimisticRecord,
  getOfflineMutation,
  getOptimisticRecord,
  queueOfflineMutation,
  saveOptimisticRecord,
} from "@/lib/offline/indexed-db";
import {
  detectOfflineSyncConflict,
  markOfflineMutationFailed,
  syncQueuedOfflineMutations,
} from "@/lib/offline/sync";

describe("offline sync engine", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase(OFFLINE_DATABASE_NAME);
  });

  it("detects updated_at conflicts", () => {
    expect(
      detectOfflineSyncConflict("2026-06-25T10:00:00.000Z", "2026-06-25T10:00:00.000Z"),
    ).toBe(false);
    expect(
      detectOfflineSyncConflict("2026-06-25T10:00:00.000Z", "2026-06-25T11:00:00.000Z"),
    ).toBe(true);
  });

  it("increments retry behavior after a failed sync", async () => {
    await queueOfflineMutation(
      createOfflineMutation({
        id: "mutation-retry",
        operation_type: "create",
        entity_type: "location",
        entity_id: "offline-location-1",
        payload: { name: "Hamilton" },
      }),
    );
    await saveOptimisticRecord(
      createOfflineOptimisticRecord({
        entity_type: "location",
        entity_id: "offline-location-1",
        display_label: "Hamilton",
        route: "/locations",
        payload: { name: "Hamilton" },
      }),
    );

    await markOfflineMutationFailed("mutation-retry", "Temporary network issue", 1);

    const updatedMutation = await getOfflineMutation("mutation-retry");
    const updatedOptimistic = await getOptimisticRecord("location:offline-location-1");

    expect(updatedMutation?.retry_count).toBe(1);
    expect(updatedMutation?.sync_status).toBe("pending");
    expect(updatedOptimistic?.sync_status).toBe("failed");
  });

  it("syncs an offline asset creation when online", async () => {
    await queueOfflineMutation(
      createOfflineMutation({
        id: "mutation-asset-create",
        operation_type: "create",
        entity_type: "asset",
        entity_id: "offline-asset-1",
        payload: {
          uniqueAssetId: "A-100",
          assetName: "Support trailer",
          categoryId: "category-1",
          currentLocationId: "location-1",
          status: "available",
          description: "",
          serialNumber: "",
          make: "",
          model: "",
          purchaseDate: "",
          purchaseCost: "",
          replacementValue: "",
          currentValue: "",
          notes: "",
          qrCodeValue: "",
        },
      }),
    );
    await saveOptimisticRecord(
      createOfflineOptimisticRecord({
        entity_type: "asset",
        entity_id: "offline-asset-1",
        display_label: "Support trailer",
        route: "/assets",
        payload: { assetName: "Support trailer" },
      }),
    );

    await syncQueuedOfflineMutations(async (mutation) => ({
      ok: true,
      mutationId: mutation.id,
      serverEntityId: "asset-server-1",
      serverUpdatedAt: "2026-06-25T12:30:00.000Z",
    }));

    const updatedMutation = await getOfflineMutation("mutation-asset-create");
    const updatedOptimistic = await getOptimisticRecord("asset:asset-server-1");

    expect(updatedMutation?.sync_status).toBe("synced");
    expect(updatedMutation?.server_entity_id).toBe("asset-server-1");
    expect(updatedOptimistic?.sync_status).toBe("synced");
    expect(updatedOptimistic?.server_entity_id).toBe("asset-server-1");
  });
});
