import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import {
  archiveLocationRecord,
  createLocationRecord,
  updateLocationRecord,
  type LocationMutationDependencies,
} from "@/lib/locations/service";
import {
  archiveAssetRecord,
  createAssetRecord,
  updateAssetRecord,
  type AssetMutationDependencies,
  type AssetRow,
} from "@/lib/assets/service";
import {
  archiveConsumableBatchRecord,
  createConsumableBatchRecord,
  createConsumableItemRecord,
  updateConsumableBatchRecord,
  type ConsumableDependencies,
  type ConsumableBatchRow,
  type ConsumableItemRow,
} from "@/lib/consumables/service";
import {
  createDeploymentRecord,
  updateDeploymentRecord,
  type DeploymentDependencies,
  type DeploymentRow,
  type DeploymentFormInput,
} from "@/lib/deployments/service";
import type { LocationFormInput } from "@/lib/locations/validation";
import type { AssetFormInput } from "@/lib/assets/validation";
import type { ConsumableBatchFormInput, ConsumableItemFormInput } from "@/lib/consumables/validation";

const writeAuditLog = vi.fn(async () => ok({}));

const locationInput: LocationFormInput = {
  name: "Hamilton Warehouse",
  type: "warehouse",
  address: "12 Sample Street",
  state: "Victoria",
  notes: null,
};

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

const consumableItemInput: ConsumableItemFormInput = {
  name: "Trauma dressing",
  categoryId: "cat-1",
  description: null,
};

const consumableBatchInput: ConsumableBatchFormInput = {
  itemId: "item-1",
  batchLotNumber: "LOT-1",
  quantityReceived: 10,
  quantityOnHand: 10,
  unitCost: 8,
  replacementCost: 10,
  dateReceived: "2026-06-20",
  supplierDonor: "Supplier",
  expiryDate: null,
  locationId: "location-1",
  qrCodeValue: "SAES-CONSUMABLE:TRAUMA-DRESSING:LOT-1",
};

const deploymentInput: DeploymentFormInput = {
  deploymentId: "DEP-001",
  deploymentName: "Flood response",
  purposeReason: "Support",
  deploymentLocationSite: "Hamilton",
  teamName: "Team Alpha",
  teamLeader: null,
  contactNumber: null,
  startDatetime: "2026-06-25T08:00",
  expectedReturnDatetime: "2026-06-26T18:00",
  actualReturnDatetime: null,
  status: "planned",
  notes: null,
  damageFaultNotes: null,
};

function createLocationDependencies(): LocationMutationDependencies {
  return {
    insertLocation: vi.fn(async () =>
      ok({
        id: "location-1",
        name: "Hamilton Warehouse",
        type: "warehouse",
        address: "12 Sample Street",
        state: "Victoria",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "user-1",
        updated_by: "user-1",
      }),
    ),
    updateLocation: vi.fn(async (_id, payload) =>
      ok({
        id: "location-1",
        name: String(payload.name ?? "Hamilton Warehouse"),
        type: String(payload.type ?? "warehouse"),
        address: String(payload.address ?? "12 Sample Street"),
        state: String(payload.state ?? "Victoria"),
        notes: payload.notes ?? null,
        archived_at: payload.archived_at ?? null,
        created_at: "",
        updated_at: "",
        created_by: "user-1",
        updated_by: String(payload.updated_by ?? "user-1"),
      }),
    ),
    writeAuditLog,
  };
}

function createAssetDependencies(): AssetMutationDependencies {
  const row: AssetRow = {
    id: "asset-1",
    unique_asset_id: "GEN-001",
    qr_code_value: "SAES-ASSET:GEN-001",
    asset_name: "Honda Generator",
    category_id: assetInput.categoryId,
    description: null,
    serial_number: "SN123",
    make: "Honda",
    model: "EU22i",
    purchase_date: "2026-06-16",
    purchase_cost: 1200,
    replacement_value: 1500,
    current_value: null,
    current_location_id: assetInput.currentLocationId,
    status: "available",
    notes: null,
    archived_at: null,
    created_at: "",
    updated_at: "",
    created_by: "user-1",
    updated_by: "user-1",
  };

  return {
    insertAsset: vi.fn(async () => ok(row)),
    updateAsset: vi.fn(async (_id, payload) => ok({ ...row, ...payload, id: "asset-1" })),
    writeAuditLog,
  };
}

function createConsumableDependencies(): ConsumableDependencies {
  const itemRow: ConsumableItemRow = {
    id: "item-1",
    name: "Trauma dressing",
    category_id: "cat-1",
    description: null,
    archived_at: null,
    created_at: "",
    updated_at: "",
    created_by: "user-1",
    updated_by: "user-1",
  };
  const batchRow: ConsumableBatchRow = {
    id: "batch-1",
    item_id: "item-1",
    batch_lot_number: "LOT-1",
    quantity_received: 10,
    quantity_on_hand: 10,
    unit_cost: 8,
    replacement_cost: 10,
    date_received: "2026-06-20",
    supplier_donor: "Supplier",
    expiry_date: null,
    location_id: "location-1",
    qr_code_value: "SAES-CONSUMABLE:TRAUMA-DRESSING:LOT-1",
    archived_at: null,
    created_at: "",
    updated_at: "",
    created_by: "user-1",
    updated_by: "user-1",
  };

  return {
    insertItem: vi.fn(async () => ok(itemRow)),
    insertBatch: vi.fn(async () => ok(batchRow)),
    updateBatch: vi.fn(async (_id, payload) => ok({ ...batchRow, ...payload, id: "batch-1" })),
    writeAuditLog,
  };
}

function createDeploymentDependencies(): DeploymentDependencies {
  const row: DeploymentRow = {
    id: "deployment-1",
    deployment_id: "DEP-001",
    deployment_name: "Flood response",
    purpose_reason: "Support",
    deployment_location_site: "Hamilton",
    team_name: "Team Alpha",
    team_leader: null,
    contact_number: null,
    start_datetime: "2026-06-25T08:00:00.000Z",
    expected_return_datetime: "2026-06-26T18:00:00.000Z",
    actual_return_datetime: null,
    status: "planned",
    notes: null,
    damage_fault_notes: null,
    created_at: "",
    updated_at: "",
    created_by: "user-1",
  };

  return {
    insertDeployment: vi.fn(async () => ok(row)),
    updateDeployment: vi.fn(async (_id, payload) => ok({ ...row, ...payload, id: "deployment-1" })),
    writeAuditLog,
  };
}

describe("audit mutation consistency", () => {
  it("logs audit events for core location mutations", async () => {
    writeAuditLog.mockClear();
    const dependencies = createLocationDependencies();

    await createLocationRecord(dependencies, locationInput, "user-1");
    await updateLocationRecord(dependencies, "location-1", locationInput, "user-1");
    await archiveLocationRecord(dependencies, "location-1", "user-1", new Date("2026-06-26T00:00:00.000Z"));

    expect(writeAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ actionType: "location.create", recordType: "location" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ actionType: "location.update", recordType: "location" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ actionType: "location.archive", recordType: "location" }),
    );
  });

  it("logs audit events for core asset mutations", async () => {
    writeAuditLog.mockClear();
    const dependencies = createAssetDependencies();

    await createAssetRecord(dependencies, assetInput, "user-1");
    await updateAssetRecord(dependencies, "asset-1", assetInput, "user-1");
    await archiveAssetRecord(dependencies, "asset-1", "user-1", new Date("2026-06-26T00:00:00.000Z"));

    expect(writeAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ actionType: "asset.create", recordType: "asset" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ actionType: "asset.update", recordType: "asset" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ actionType: "asset.archive", recordType: "asset" }),
    );
  });

  it("logs audit events for core consumable mutations", async () => {
    writeAuditLog.mockClear();
    const dependencies = createConsumableDependencies();

    await createConsumableItemRecord(dependencies, consumableItemInput, "user-1");
    await createConsumableBatchRecord(dependencies, consumableBatchInput, "user-1");
    await updateConsumableBatchRecord(dependencies, "batch-1", consumableBatchInput, "user-1");
    await archiveConsumableBatchRecord(
      dependencies,
      "batch-1",
      "user-1",
      new Date("2026-06-26T00:00:00.000Z"),
    );

    expect(writeAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ actionType: "consumable.item.create", recordType: "consumable_item" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ actionType: "consumable.batch.create", recordType: "consumable_batch" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ actionType: "consumable.batch.update", recordType: "consumable_batch" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ actionType: "consumable.batch.archive", recordType: "consumable_batch" }),
    );
  });

  it("logs audit events for core deployment mutations", async () => {
    writeAuditLog.mockClear();
    const dependencies = createDeploymentDependencies();

    const current: DeploymentRow = {
      id: "deployment-1",
      deployment_id: "DEP-001",
      deployment_name: "Flood response",
      purpose_reason: "Support",
      deployment_location_site: "Hamilton",
      team_name: "Team Alpha",
      team_leader: null,
      contact_number: null,
      start_datetime: "2026-06-25T08:00:00.000Z",
      expected_return_datetime: "2026-06-26T18:00:00.000Z",
      actual_return_datetime: null,
      status: "planned",
      notes: null,
      damage_fault_notes: null,
      created_at: "",
      updated_at: "",
      created_by: "user-1",
    };

    await createDeploymentRecord(dependencies, deploymentInput, "user-1");
    await updateDeploymentRecord(dependencies, current, deploymentInput, "user-1");

    expect(writeAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ actionType: "deployment.create", recordType: "deployment" }),
    );
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ actionType: "deployment.update", recordType: "deployment" }),
    );
  });
});
