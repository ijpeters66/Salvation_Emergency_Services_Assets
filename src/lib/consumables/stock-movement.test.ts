import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import {
  calculateNextQuantityOnHand,
  recordStockMovement,
  type StockMovementDependencies,
} from "@/lib/consumables/stock-movement";

const batch: ConsumableBatchRow = {
  id: "batch-1",
  item_id: "item-1",
  batch_lot_number: "LOT-1",
  quantity_received: 20,
  quantity_on_hand: 12,
  unit_cost: 2.5,
  replacement_cost: null,
  date_received: "2026-06-18",
  supplier_donor: null,
  expiry_date: null,
  location_id: "location-1",
  qr_code_value: "SAES-CONSUMABLE:GLOVES:LOT-1",
  archived_at: null,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): StockMovementDependencies {
  return {
    insertStockMovement: vi.fn(async () =>
      ok({
        id: "movement-1",
        consumable_batch_id: "batch-1",
        movement_type: "issued",
        quantity: 5,
        from_location_id: "location-1",
        to_location_id: null,
        reason: "Training restock",
        related_deployment_id: null,
        notes: null,
        created_by: "user-1",
        created_at: "2026-06-18T00:00:00.000Z",
      }),
    ),
    updateBatch: vi.fn(async () =>
      ok({
        ...batch,
        quantity_on_hand: 7,
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("stock movements", () => {
  it("calculates inbound and outbound stock movements", () => {
    expect(calculateNextQuantityOnHand(10, "received", 5)).toEqual(ok(15));
    expect(calculateNextQuantityOnHand(10, "issued", 4)).toEqual(ok(6));
    expect(calculateNextQuantityOnHand(10, "written_off", 2)).toEqual(ok(8));
  });

  it("prevents negative stock", () => {
    const result = calculateNextQuantityOnHand(3, "issued", 4);

    expect(result.ok).toBe(false);
  });

  it("creates ledger entry, updates batch quantity, and writes audit log", async () => {
    const dependencies = createDependencies();

    const result = await recordStockMovement(dependencies, {
      batch,
      movementType: "issued",
      quantity: 5,
      fromLocationId: "location-1",
      toLocationId: null,
      reason: "Training restock",
      relatedDeploymentId: null,
      notes: null,
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertStockMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        consumable_batch_id: "batch-1",
        movement_type: "issued",
        quantity: 5,
      }),
    );
    expect(dependencies.updateBatch).toHaveBeenCalledWith("batch-1", {
      quantity_on_hand: 7,
      location_id: undefined,
      updated_by: "user-1",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "stock.movement",
        recordType: "consumable_batch",
        recordId: "batch-1",
      }),
    );
  });
});
