import { expect, test } from "@playwright/test";

test("pending sync indicator appears for queued offline work", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("offline-status-indicator")).toBeVisible();

  await page.evaluate(async () => {
    const openRequest = indexedDB.open("saes-offline", 2);

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;

        if (!db.objectStoreNames.contains("mutation_queue")) {
          const mutationStore = db.createObjectStore("mutation_queue", { keyPath: "id" });
          mutationStore.createIndex("created_at", "created_at", { unique: false });
          mutationStore.createIndex("sync_status", "sync_status", { unique: false });
        }

        if (!db.objectStoreNames.contains("reference_data")) {
          db.createObjectStore("reference_data", { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains("optimistic_record")) {
          const optimisticStore = db.createObjectStore("optimistic_record", { keyPath: "key" });
          optimisticStore.createIndex("entity_type", "entity_type", { unique: false });
          optimisticStore.createIndex("sync_status", "sync_status", { unique: false });
        }
      };
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => resolve(openRequest.result);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("mutation_queue", "readwrite");
      const store = transaction.objectStore("mutation_queue");

      store.put({
        id: "queued-1",
        operation_type: "create",
        entity_type: "asset",
        entity_id: "offline-asset-1",
        payload: { assetName: "Support trailer" },
        created_at: "2026-06-25T12:00:00.000Z",
        retry_count: 0,
        sync_status: "pending",
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    database.close();
    window.dispatchEvent(new CustomEvent("offline-store-changed"));
  });

  await expect(page.getByTestId("offline-status-indicator")).toContainText("1 queued");
});

test("offline indicator renders when the browser loses connectivity", async ({ page, context }) => {
  await page.goto("/login");

  await context.setOffline(true);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("offline"));
  });
  await expect(page.getByTestId("offline-status-indicator")).toContainText("Offline");
});
