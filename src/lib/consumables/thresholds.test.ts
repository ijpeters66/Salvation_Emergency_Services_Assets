import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import {
  aggregateCurrentStockByItemLocation,
  buildStockAlerts,
  getThresholdStatus,
  upsertStockThresholdRecord,
  type StockThresholdDependencies,
  type StockThresholdRow,
} from "@/lib/consumables/thresholds";

function batch(overrides: Partial<ConsumableBatchRow>): ConsumableBatchRow {
  return {
    id: "batch-1",
    item_id: "item-1",
    batch_lot_number: "LOT-1",
    quantity_received: 10,
    quantity_on_hand: 10,
    unit_cost: null,
    replacement_cost: null,
    date_received: "2026-06-18",
    supplier_donor: null,
    expiry_date: null,
    location_id: "location-1",
    qr_code_value: "SAES-CONSUMABLE:ITEM:LOT-1",
    archived_at: null,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

const threshold: StockThresholdRow = {
  id: "threshold-1",
  consumable_item_id: "item-1",
  location_id: "location-1",
  minimum_quantity: 5,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): StockThresholdDependencies {
  return {
    upsertThreshold: vi.fn(async () => ok(threshold)),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("stock thresholds", () => {
  it("calculates threshold statuses", () => {
    expect(getThresholdStatus(10, 5)).toBe("normal");
    expect(getThresholdStatus(5, 5)).toBe("low_stock");
    expect(getThresholdStatus(0, 5)).toBe("out_of_stock");
  });

  it("aggregates current stock by item and location", () => {
    const totals = aggregateCurrentStockByItemLocation([
      batch({ id: "batch-a", quantity_on_hand: 3 }),
      batch({ id: "batch-b", quantity_on_hand: 4 }),
      batch({ id: "batch-c", archived_at: "2026-06-18T00:00:00.000Z", quantity_on_hand: 99 }),
    ]);

    expect(totals.get("item-1:location-1")).toBe(7);
  });

  it("builds low-stock alerts", () => {
    const alerts = buildStockAlerts([threshold], [batch({ quantity_on_hand: 4 })]);

    expect(alerts[0]?.status).toBe("low_stock");
    expect(alerts[0]?.currentQuantity).toBe(4);
  });

  it("logs audit entries when thresholds are saved", async () => {
    const dependencies = createDependencies();

    const result = await upsertStockThresholdRecord(dependencies, {
      consumableItemId: "item-1",
      locationId: "location-1",
      minimumQuantity: 5,
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.upsertThreshold).toHaveBeenCalledOnce();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "stock.threshold.upsert",
        recordType: "stock_threshold",
      }),
    );
  });
});
