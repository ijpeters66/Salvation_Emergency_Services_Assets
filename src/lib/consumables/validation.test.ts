import { describe, expect, it } from "vitest";

import {
  buildConsumableQrCodeValue,
  consumableBatchFormSchema,
  consumableItemFormSchema,
  parseConsumableBatchFormData,
} from "@/lib/consumables/validation";

const validBatch = {
  itemId: "00000000-0000-4000-8000-000000000001",
  batchLotNumber: "LOT-1",
  quantityReceived: "20",
  quantityOnHand: "12",
  unitCost: "2.50",
  replacementCost: "",
  dateReceived: "2026-06-18",
  supplierDonor: "",
  expiryDate: "",
  locationId: "00000000-0000-4000-8000-000000000002",
  qrCodeValue: "SAES-CONSUMABLE:GLOVES:LOT-1",
};

describe("consumable validation", () => {
  it("accepts valid item details", () => {
    const result = consumableItemFormSchema.safeParse({
      name: "Nitrile gloves",
      categoryId: "00000000-0000-4000-8000-000000000001",
      description: "",
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid batch details and normalises optional fields", () => {
    const result = consumableBatchFormSchema.parse(validBatch);

    expect(result.quantityReceived).toBe(20);
    expect(result.quantityOnHand).toBe(12);
    expect(result.replacementCost).toBeNull();
    expect(result.expiryDate).toBeNull();
  });

  it("prevents quantity on hand exceeding received quantity", () => {
    const result = consumableBatchFormSchema.safeParse({
      ...validBatch,
      quantityOnHand: "25",
    });

    expect(result.success).toBe(false);
  });

  it("defaults create-batch stock on hand from quantity received", () => {
    const formData = new FormData();
    formData.set("itemId", validBatch.itemId);
    formData.set("quantityReceived", "9");
    formData.set("unitCost", "");
    formData.set("locationId", validBatch.locationId);

    const result = parseConsumableBatchFormData(formData, "Nitrile gloves");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.batchLotNumber).toMatch(/^AUTO-/);
      expect(result.data.quantityReceived).toBe(9);
      expect(result.data.quantityOnHand).toBe(9);
      expect(result.data.dateReceived).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.data.replacementCost).toBeNull();
    }
  });

  it("builds QR code values", () => {
    expect(buildConsumableQrCodeValue("Nitrile gloves", "lot 1")).toBe(
      "SAES-CONSUMABLE:NITRILE-GLOVES:LOT-1",
    );
  });
});
