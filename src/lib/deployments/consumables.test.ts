import { describe, expect, it, vi } from "vitest";

import type { ConsumableBatchRow } from "@/lib/consumables/service";
import {
  issueDeploymentConsumables,
  type DeploymentConsumableDependencies,
} from "@/lib/deployments/consumables";
import { ok } from "@/lib/result";

function createBatch(overrides: Partial<ConsumableBatchRow> = {}): ConsumableBatchRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    item_id: "22222222-2222-4222-8222-222222222222",
    batch_lot_number: "LOT-001",
    qr_code_value: "BATCH-001",
    supplier_donor: null,
    date_received: "2026-06-01",
    expiry_date: "2026-12-01",
    quantity_received: 20,
    quantity_on_hand: 20,
    unit_cost: 12,
    location_id: "33333333-3333-4333-8333-333333333333",
    archived_at: null,
    created_at: "2026-06-19T00:00:00.000Z",
    updated_at: "2026-06-19T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDependencies(): DeploymentConsumableDependencies {
  return {
    insertStockMovement: vi.fn(async (payload) =>
      ok({
        id: "44444444-4444-4444-8444-444444444444",
        created_at: "2026-06-19T00:00:00.000Z",
        ...payload,
      }),
    ),
    updateBatch: vi.fn(async (_id, payload) =>
      ok(createBatch({ quantity_on_hand: payload.quantity_on_hand ?? 20 })),
    ),
    insertDeploymentConsumable: vi.fn(async (payload) =>
      ok({
        id: "55555555-5555-4555-8555-555555555555",
        issued_at: "2026-06-19T00:00:00.000Z",
        ...payload,
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("deployment consumables", () => {
  it("issues FIFO stock for a deployment request", async () => {
    const dependencies = createDependencies();
    const batches = [createBatch()];

    const result = await issueDeploymentConsumables(dependencies, batches, {
      deploymentId: "66666666-6666-4666-8666-666666666666",
      itemId: "22222222-2222-4222-8222-222222222222",
      locationId: "33333333-3333-4333-8333-333333333333",
      quantity: 5,
      notes: "Crew restock",
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertStockMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        related_deployment_id: "66666666-6666-4666-8666-666666666666",
        movement_type: "issued",
        quantity: 5,
      }),
    );
    expect(dependencies.insertDeploymentConsumable).toHaveBeenCalledWith(
      expect.objectContaining({
        deployment_id: "66666666-6666-4666-8666-666666666666",
        quantity: 5,
      }),
    );
  });

  it("splits issue quantities across multiple FIFO batches", async () => {
    const dependencies = createDependencies();
    const batches = [
      createBatch({ id: "batch-a", batch_lot_number: "LOT-A", quantity_on_hand: 2 }),
      createBatch({
        id: "batch-b",
        batch_lot_number: "LOT-B",
        quantity_on_hand: 4,
        expiry_date: "2026-12-02",
      }),
    ];

    const result = await issueDeploymentConsumables(dependencies, batches, {
      deploymentId: "66666666-6666-4666-8666-666666666666",
      itemId: "22222222-2222-4222-8222-222222222222",
      locationId: "33333333-3333-4333-8333-333333333333",
      quantity: 5,
      notes: null,
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertDeploymentConsumable).toHaveBeenCalledTimes(2);
  });
});
