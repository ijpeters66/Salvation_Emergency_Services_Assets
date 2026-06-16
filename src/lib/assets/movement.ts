import type { AuditLogInput } from "@/lib/audit-log";
import type { AssetRow, AssetUpdate } from "@/lib/assets/service";
import type { Database } from "@/lib/database.types";
import type { AssetStatus } from "@/lib/domain-types";
import { isAssetStatus } from "@/lib/domain-types";
import { ok, type AppResult } from "@/lib/result";

export type AssetMovementRow = Database["public"]["Tables"]["asset_movement"]["Row"];
export type AssetMovementInsert = Database["public"]["Tables"]["asset_movement"]["Insert"];

export type AssetMovementInput = {
  asset: AssetRow;
  toLocationId: string;
  toStatus: AssetStatus;
  reason: string;
  notes: string | null;
  userId: string;
};

export type AssetMovementDependencies = {
  insertMovement(payload: AssetMovementInsert): Promise<AppResult<AssetMovementRow>>;
  updateAsset(id: string, payload: AssetUpdate): Promise<AppResult<AssetRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const movementReasons = [
  "Location correction",
  "Deployment",
  "Return to store",
  "Maintenance",
  "Damage report",
  "Retirement",
  "Stocktake correction",
] as const;

export function getMovementReasons() {
  return movementReasons;
}

export function isValidAssetTransition(fromStatus: string, toStatus: string) {
  return isAssetStatus(fromStatus) && isAssetStatus(toStatus);
}

export function buildAssetMovementPayload(input: AssetMovementInput): AssetMovementInsert {
  return {
    asset_id: input.asset.id,
    from_location_id: input.asset.current_location_id,
    to_location_id: input.toLocationId,
    from_status: input.asset.status,
    to_status: input.toStatus,
    reason: input.reason,
    notes: input.notes,
    created_by: input.userId,
  };
}

export async function recordAssetMovement(
  dependencies: AssetMovementDependencies,
  input: AssetMovementInput,
) {
  if (!isValidAssetTransition(input.asset.status, input.toStatus)) {
    return {
      ok: false,
      error: "Invalid asset status transition.",
    } as const;
  }

  const movementPayload = buildAssetMovementPayload(input);
  const movementResult = await dependencies.insertMovement(movementPayload);

  if (!movementResult.ok) {
    return movementResult;
  }

  const assetResult = await dependencies.updateAsset(input.asset.id, {
    current_location_id: input.toLocationId,
    status: input.toStatus,
    updated_by: input.userId,
  });

  if (!assetResult.ok) {
    return assetResult;
  }

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "asset.movement",
    recordType: "asset",
    recordId: input.asset.id,
    oldValue: {
      current_location_id: input.asset.current_location_id,
      status: input.asset.status,
    },
    newValue: {
      movement_id: movementResult.data.id,
      current_location_id: input.toLocationId,
      status: input.toStatus,
      reason: input.reason,
    },
  });

  return ok({
    asset: assetResult.data,
    movement: movementResult.data,
  });
}
