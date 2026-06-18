import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import {
  calculateBatchValue,
  createConsumableBatchRecord,
  type ConsumableBatchRow,
  type ConsumableDependencies,
} from "@/lib/consumables/service";
import type { ConsumableBatchFormInput } from "@/lib/consumables/validation";

const batchInput: ConsumableBatchFormInput = {
  itemId: "00000000-0000-4000-8000-000000000001",
  batchLotNumber: "LOT-1",
  quantityReceived: 20,
  quantityOnHand: 12,
  unitCost: 2.5,
  replacementCost: null,
  dateReceived: "2026-06-18",
  supplierDonor: null,
  expiryDate: null,
  locationId: "00000000-0000-4000-8000-000000000002",
  qrCodeValue: "SAES-CONSUMABLE:GLOVES:LOT-1",
};

const batchRow: ConsumableBatchRow = {
  id: "batch-1",
  item_id: batchInput.itemId,
  batch_lot_number: "LOT-1",
  quantity_received: 20,
  quantity_on_hand: 12,
  unit_cost: 2.5,
  replacement_cost: null,
  date_received: "2026-06-18",
  supplier_donor: null,
  expiry_date: null,
  location_id: batchInput.locationId,
  qr_code_value: "SAES-CONSUMABLE:GLOVES:LOT-1",
  archived_at: null,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): ConsumableDependencies {
  return {
    insertItem: vi.fn(),
    insertBatch: vi.fn(async () => ok(batchRow)),
    updateBatch: vi.fn(),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("consumable service", () => {
  it("calculates batch value", () => {
    expect(calculateBatchValue(12, 2.5)).toBe(30);
    expect(calculateBatchValue(12, null)).toBe(0);
  });

  it("logs audit entries when creating batches", async () => {
    const dependencies = createDependencies();

    const result = await createConsumableBatchRecord(dependencies, batchInput, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.insertBatch).toHaveBeenCalledOnce();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "consumable.batch.create",
        recordType: "consumable_batch",
        recordId: "batch-1",
      }),
    );
  });
});
