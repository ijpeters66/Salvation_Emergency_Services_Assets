import { describe, expect, it } from "vitest";

import {
  buildConsumableQrCodeValue,
  consumableBatchFormSchema,
  consumableItemFormSchema,
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

  it("builds QR code values", () => {
    expect(buildConsumableQrCodeValue("Nitrile gloves", "lot 1")).toBe(
      "SAES-CONSUMABLE:NITRILE-GLOVES:LOT-1",
    );
  });
});
