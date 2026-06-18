import { describe, expect, it, vi } from "vitest";

import type { AssetRow } from "@/lib/assets/service";
import {
  canCheckOutAsset,
  checkInDeploymentAsset,
  checkOutDeploymentAsset,
  type DeploymentAssetDependencies,
  type DeploymentAssetRow,
} from "@/lib/deployments/assets";
import { ok } from "@/lib/result";

const deploymentId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";

function createAsset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    id: assetId,
    unique_asset_id: "AST-001",
    asset_name: "Pump kit",
    category_id: "33333333-3333-4333-8333-333333333333",
    description: null,
    serial_number: null,
    make: null,
    model: null,
    purchase_date: null,
    purchase_cost: null,
    current_value: null,
    replacement_value: null,
    current_location_id: "44444444-4444-4444-8444-444444444444",
    status: "available",
    qr_code_value: "AST-001",
    archived_at: null,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDeploymentAsset(overrides: Partial<DeploymentAssetRow> = {}): DeploymentAssetRow {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    deployment_id: deploymentId,
    asset_id: assetId,
    checked_out_at: "2026-06-18T00:00:00.000Z",
    checked_in_at: null,
    checked_out_by: "user-1",
    checked_in_by: null,
    notes: null,
    ...overrides,
  };
}

function createDependencies(): DeploymentAssetDependencies {
  return {
    insertDeploymentAsset: vi.fn(async (payload) => ok(createDeploymentAsset(payload))),
    updateDeploymentAsset: vi.fn(async (_id, payload) =>
      ok(createDeploymentAsset({ ...payload, checked_in_by: payload.checked_in_by ?? "user-1" })),
    ),
    insertMovement: vi.fn(async (payload) =>
      ok({
        id: "66666666-6666-4666-8666-666666666666",
        created_at: "2026-06-18T00:00:00.000Z",
        ...payload,
      }),
    ),
    updateAsset: vi.fn(async (_id, payload) => ok(createAsset(payload))),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("deployment assets", () => {
  it("only checks out available active assets", () => {
    expect(canCheckOutAsset(createAsset())).toBe(true);
    expect(canCheckOutAsset(createAsset({ status: "deployed" }))).toBe(false);
    expect(canCheckOutAsset(createAsset({ archived_at: "2026-06-18T00:00:00.000Z" }))).toBe(false);
  });

  it("checks out an asset and moves it to deployed", async () => {
    const dependencies = createDependencies();
    const result = await checkOutDeploymentAsset(dependencies, {
      deploymentId,
      asset: createAsset(),
      notes: "Storm response",
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertDeploymentAsset).toHaveBeenCalledOnce();
    expect(dependencies.updateAsset).toHaveBeenCalledWith(
      assetId,
      expect.objectContaining({ status: "deployed" }),
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: "deployment.asset.checkout" }),
    );
  });

  it("checks in an asset and returns it to the selected status", async () => {
    const dependencies = createDependencies();
    const result = await checkInDeploymentAsset(dependencies, {
      deploymentAsset: createDeploymentAsset(),
      asset: createAsset({ status: "deployed" }),
      returnStatus: "under_maintenance",
      notes: "Pump requires service",
      userId: "user-1",
      checkedInAt: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(dependencies.updateDeploymentAsset).toHaveBeenCalledWith(
      "55555555-5555-4555-8555-555555555555",
      expect.objectContaining({
        checked_in_at: "2026-06-19T00:00:00.000Z",
        checked_in_by: "user-1",
      }),
    );
    expect(dependencies.updateAsset).toHaveBeenCalledWith(
      assetId,
      expect.objectContaining({ status: "under_maintenance" }),
    );
  });
});
