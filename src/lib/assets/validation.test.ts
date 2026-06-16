import { describe, expect, it } from "vitest";

import { assetFormSchema, buildQrCodeValue, normaliseAssetId } from "@/lib/assets/validation";

const validAsset = {
  uniqueAssetId: "gen 001",
  assetName: "Honda Generator",
  categoryId: "00000000-0000-4000-8000-000000000001",
  currentLocationId: "00000000-0000-4000-8000-000000000002",
  status: "available",
  qrCodeValue: "",
  description: "",
  serialNumber: "SN123",
  make: "Honda",
  model: "EU22i",
  purchaseDate: "2026-06-16",
  purchaseCost: "1200.50",
  replacementValue: "1500",
  currentValue: "",
  notes: "",
};

describe("asset validation", () => {
  it("accepts valid asset details", () => {
    const result = assetFormSchema.safeParse(validAsset);

    expect(result.success).toBe(true);
  });

  it("normalises empty optional fields and money values", () => {
    const result = assetFormSchema.parse(validAsset);

    expect(result.description).toBeNull();
    expect(result.currentValue).toBeNull();
    expect(result.purchaseCost).toBe(1200.5);
  });

  it("rejects invalid statuses", () => {
    const result = assetFormSchema.safeParse({
      ...validAsset,
      status: "missing",
    });

    expect(result.success).toBe(false);
  });

  it("normalises unique IDs and builds QR values", () => {
    expect(normaliseAssetId(" gen 001 ")).toBe("GEN-001");
    expect(buildQrCodeValue("gen 001")).toBe("SAES-ASSET:GEN-001");
  });
});
