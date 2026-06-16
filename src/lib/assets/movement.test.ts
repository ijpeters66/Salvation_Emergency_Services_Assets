import { describe, expect, it, vi } from "vitest";

import {
  recordAssetMovement,
  isValidAssetTransition,
  type AssetMovementDependencies,
} from "@/lib/assets/movement";
import type { AssetRow } from "@/lib/assets/service";
import { ok } from "@/lib/result";

const asset: AssetRow = {
  id: "asset-1",
  unique_asset_id: "GEN-001",
  qr_code_value: "SAES-ASSET:GEN-001",
  asset_name: "Honda Generator",
  category_id: "category-1",
  current_location_id: "location-1",
  status: "available",
  description: null,
  serial_number: null,
  make: null,
  model: null,
  purchase_date: null,
  purchase_cost: null,
  replacement_value: null,
  current_value: null,
  notes: null,
  archived_at: null,
  created_at: "2026-06-16T00:00:00.000Z",
  updated_at: "2026-06-16T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): AssetMovementDependencies {
  return {
    insertMovement: vi.fn(async () =>
      ok({
        id: "movement-1",
        asset_id: "asset-1",
        from_location_id: "location-1",
        to_location_id: "location-2",
        from_status: "available",
        to_status: "deployed",
        reason: "Deployment",
        notes: null,
        created_by: "user-1",
        created_at: "2026-06-16T00:00:00.000Z",
      }),
    ),
    updateAsset: vi.fn(async () =>
      ok({
        ...asset,
        current_location_id: "location-2",
        status: "deployed",
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("asset movement service", () => {
  it("validates transitions against approved asset statuses", () => {
    expect(isValidAssetTransition("available", "deployed")).toBe(true);
    expect(isValidAssetTransition("available", "missing")).toBe(false);
  });

  it("creates movement, updates asset, and writes audit log", async () => {
    const dependencies = createDependencies();

    const result = await recordAssetMovement(dependencies, {
      asset,
      toLocationId: "location-2",
      toStatus: "deployed",
      reason: "Deployment",
      notes: null,
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset-1",
        from_location_id: "location-1",
        to_location_id: "location-2",
        from_status: "available",
        to_status: "deployed",
      }),
    );
    expect(dependencies.updateAsset).toHaveBeenCalledWith("asset-1", {
      current_location_id: "location-2",
      status: "deployed",
      updated_by: "user-1",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.movement",
        recordType: "asset",
        recordId: "asset-1",
      }),
    );
  });

  it("moves active child assets when parent location changes", async () => {
    const dependencies = {
      ...createDependencies(),
      getActiveChildAssets: vi.fn(async () =>
        ok([
          {
            ...asset,
            id: "child-asset-1",
            unique_asset_id: "RADIO-001",
            current_location_id: "location-1",
            status: "available",
          },
        ]),
      ),
    };

    await recordAssetMovement(dependencies, {
      asset,
      toLocationId: "location-2",
      toStatus: "available",
      reason: "Location correction",
      notes: null,
      userId: "user-1",
    });

    expect(dependencies.getActiveChildAssets).toHaveBeenCalledWith("asset-1");
    expect(dependencies.updateAsset).toHaveBeenCalledWith("child-asset-1", {
      current_location_id: "location-2",
      updated_by: "user-1",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.child_movement",
        recordId: "child-asset-1",
      }),
    );
  });
});
