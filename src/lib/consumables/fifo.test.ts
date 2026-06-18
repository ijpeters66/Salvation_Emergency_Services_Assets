import { describe, expect, it, vi } from "vitest";

import { issueConsumablesFifo, selectFifoBatches } from "@/lib/consumables/fifo";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import type { StockMovementDependencies } from "@/lib/consumables/stock-movement";
import { ok } from "@/lib/result";

function batch(overrides: Partial<ConsumableBatchRow>): ConsumableBatchRow {
  return {
    id: "batch-1",
    item_id: "item-1",
    batch_lot_number: "LOT-1",
    quantity_received: 10,
    quantity_on_hand: 10,
    unit_cost: null,
    replacement_cost: null,
    date_received: "2026-06-01",
    supplier_donor: null,
    expiry_date: null,
    location_id: "location-1",
    qr_code_value: "SAES-CONSUMABLE:ITEM:LOT-1",
    archived_at: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDependencies(): StockMovementDependencies {
  return {
    insertStockMovement: vi.fn(async (payload) =>
      ok({
        id: `movement-${payload.consumable_batch_id}`,
        consumable_batch_id: payload.consumable_batch_id,
        movement_type: payload.movement_type,
        quantity: payload.quantity,
        from_location_id: payload.from_location_id ?? null,
        to_location_id: payload.to_location_id ?? null,
        reason: payload.reason,
        related_deployment_id: payload.related_deployment_id ?? null,
        notes: payload.notes ?? null,
        created_by: payload.created_by,
        created_at: "2026-06-18T00:00:00.000Z",
      }),
    ),
    updateBatch: vi.fn(async (id, payload) =>
      ok({
        ...batch({ id }),
        quantity_on_hand: payload.quantity_on_hand ?? 0,
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("FIFO consumable issuing", () => {
  it("selects earliest expiring batches first", () => {
    const result = selectFifoBatches(
      [
        batch({ id: "batch-later", batch_lot_number: "LATER", expiry_date: "2026-12-01" }),
        batch({ id: "batch-soon", batch_lot_number: "SOON", expiry_date: "2026-08-01" }),
      ],
      5,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]?.batch.id).toBe("batch-soon");
      expect(result.data[0]?.quantity).toBe(5);
    }
  });

  it("splits partial issue across batches", () => {
    const result = selectFifoBatches(
      [
        batch({ id: "batch-a", batch_lot_number: "A", quantity_on_hand: 3 }),
        batch({ id: "batch-b", batch_lot_number: "B", quantity_on_hand: 10 }),
      ],
      8,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((item) => [item.batch.id, item.quantity])).toEqual([
        ["batch-a", 3],
        ["batch-b", 5],
      ]);
    }
  });

  it("returns insufficient stock when requested quantity is unavailable", () => {
    const result = selectFifoBatches([batch({ quantity_on_hand: 2 })], 5);

    expect(result.ok).toBe(false);
  });

  it("creates one stock movement per affected batch", async () => {
    const dependencies = createDependencies();

    const result = await issueConsumablesFifo(
      dependencies,
      [
        batch({ id: "batch-a", batch_lot_number: "A", quantity_on_hand: 3 }),
        batch({ id: "batch-b", batch_lot_number: "B", quantity_on_hand: 10 }),
      ],
      {
        itemId: "item-1",
        locationId: "location-1",
        quantity: 8,
        reason: "Deployment issue",
        notes: null,
        userId: "user-1",
      },
    );

    expect(result.ok).toBe(true);
    expect(dependencies.insertStockMovement).toHaveBeenCalledTimes(2);
    expect(dependencies.insertStockMovement).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ consumable_batch_id: "batch-a", quantity: 3 }),
    );
    expect(dependencies.insertStockMovement).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ consumable_batch_id: "batch-b", quantity: 5 }),
    );
  });
});
