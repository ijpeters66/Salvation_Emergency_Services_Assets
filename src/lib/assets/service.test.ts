import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import {
  archiveAssetRecord,
  buildAssetArchivePayload,
  buildAssetInsertPayload,
  createAssetRecord,
  type AssetMutationDependencies,
  type AssetRow,
} from "@/lib/assets/service";
import type { AssetFormInput } from "@/lib/assets/validation";

const assetInput: AssetFormInput = {
  uniqueAssetId: "gen 001",
  assetName: "Honda Generator",
  categoryId: "00000000-0000-4000-8000-000000000001",
  currentLocationId: "00000000-0000-4000-8000-000000000002",
  status: "available",
  qrCodeValue: "SAES-ASSET:GEN-001",
  description: null,
  serialNumber: "SN123",
  make: "Honda",
  model: "EU22i",
  purchaseDate: "2026-06-16",
  purchaseCost: 1200,
  replacementValue: 1500,
  currentValue: null,
  notes: null,
};

const assetRow: AssetRow = {
  id: "asset-1",
  unique_asset_id: "GEN-001",
  qr_code_value: "SAES-ASSET:GEN-001",
  asset_name: "Honda Generator",
  category_id: assetInput.categoryId,
  current_location_id: assetInput.currentLocationId,
  status: "available",
  description: null,
  serial_number: "SN123",
  make: "Honda",
  model: "EU22i",
  purchase_date: "2026-06-16",
  purchase_cost: 1200,
  replacement_value: 1500,
  current_value: null,
  notes: null,
  archived_at: null,
  created_at: "2026-06-16T00:00:00.000Z",
  updated_at: "2026-06-16T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): AssetMutationDependencies {
  return {
    insertAsset: vi.fn(async () => ok(assetRow)),
    updateAsset: vi.fn(async () => ok(assetRow)),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("asset service", () => {
  it("builds insert payloads with normalised IDs", () => {
    expect(buildAssetInsertPayload(assetInput, "user-1")).toEqual(
      expect.objectContaining({
        unique_asset_id: "GEN-001",
        qr_code_value: "SAES-ASSET:GEN-001",
        asset_name: "Honda Generator",
        current_location_id: assetInput.currentLocationId,
        created_by: "user-1",
        updated_by: "user-1",
      }),
    );
  });

  it("builds archive payloads", () => {
    expect(buildAssetArchivePayload("user-1", new Date("2026-06-16T00:00:00.000Z"))).toEqual({
      archived_at: "2026-06-16T00:00:00.000Z",
      updated_by: "user-1",
    });
  });

  it("logs audit entries when creating assets", async () => {
    const dependencies = createDependencies();

    const result = await createAssetRecord(dependencies, assetInput, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.insertAsset).toHaveBeenCalledOnce();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        actionType: "asset.create",
        recordType: "asset",
        recordId: "asset-1",
      }),
    );
  });

  it("logs audit entries when archiving assets", async () => {
    const dependencies = createDependencies();

    await archiveAssetRecord(
      dependencies,
      "asset-1",
      "user-1",
      new Date("2026-06-16T00:00:00.000Z"),
    );

    expect(dependencies.updateAsset).toHaveBeenCalledWith("asset-1", {
      archived_at: "2026-06-16T00:00:00.000Z",
      updated_by: "user-1",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.archive",
        recordId: "asset-1",
      }),
    );
  });
});
