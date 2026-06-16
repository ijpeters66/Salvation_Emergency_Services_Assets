import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";
import type { AssetFormInput } from "@/lib/assets/validation";
import { buildQrCodeValue, normaliseAssetId } from "@/lib/assets/validation";

export type AssetRow = Database["public"]["Tables"]["asset"]["Row"];
export type AssetInsert = Database["public"]["Tables"]["asset"]["Insert"];
export type AssetUpdate = Database["public"]["Tables"]["asset"]["Update"];
export type AssetCategoryRow = Database["public"]["Tables"]["asset_category"]["Row"];

export type AssetMutationDependencies = {
  insertAsset(payload: AssetInsert): Promise<AppResult<AssetRow>>;
  updateAsset(id: string, payload: AssetUpdate): Promise<AppResult<AssetRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function buildAssetInsertPayload(input: AssetFormInput, userId: string): AssetInsert {
  const uniqueAssetId = normaliseAssetId(input.uniqueAssetId);

  return {
    unique_asset_id: uniqueAssetId,
    qr_code_value: input.qrCodeValue || buildQrCodeValue(uniqueAssetId),
    asset_name: input.assetName,
    category_id: input.categoryId,
    description: input.description,
    serial_number: input.serialNumber,
    make: input.make,
    model: input.model,
    purchase_date: input.purchaseDate,
    purchase_cost: input.purchaseCost,
    replacement_value: input.replacementValue,
    current_value: input.currentValue,
    current_location_id: input.currentLocationId,
    status: input.status,
    notes: input.notes,
    created_by: userId,
    updated_by: userId,
  };
}

export function buildAssetUpdatePayload(input: AssetFormInput, userId: string): AssetUpdate {
  const insertPayload = buildAssetInsertPayload(input, userId);

  return {
    ...insertPayload,
    created_by: undefined,
    updated_by: userId,
  };
}

export function buildAssetArchivePayload(userId: string, archivedAt = new Date()): AssetUpdate {
  return {
    archived_at: archivedAt.toISOString(),
    updated_by: userId,
  };
}

export async function createAssetRecord(
  dependencies: AssetMutationDependencies,
  input: AssetFormInput,
  userId: string,
) {
  const payload = buildAssetInsertPayload(input, userId);
  const result = await dependencies.insertAsset(payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "asset.create",
    recordType: "asset",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function updateAssetRecord(
  dependencies: AssetMutationDependencies,
  id: string,
  input: AssetFormInput,
  userId: string,
) {
  const payload = buildAssetUpdatePayload(input, userId);
  const result = await dependencies.updateAsset(id, payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "asset.update",
    recordType: "asset",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function archiveAssetRecord(
  dependencies: AssetMutationDependencies,
  id: string,
  userId: string,
  archivedAt = new Date(),
) {
  const payload = buildAssetArchivePayload(userId, archivedAt);
  const result = await dependencies.updateAsset(id, payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "asset.archive",
    recordType: "asset",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}
