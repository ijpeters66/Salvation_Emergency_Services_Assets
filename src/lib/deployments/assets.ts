import type { AuditLogInput } from "@/lib/audit-log";
import { recordAssetMovement, type AssetMovementDependencies } from "@/lib/assets/movement";
import type { AssetRow } from "@/lib/assets/service";
import type { Database } from "@/lib/database.types";
import type { AssetStatus } from "@/lib/domain-types";
import { ok, type AppResult } from "@/lib/result";

export type DeploymentAssetRow = Database["public"]["Tables"]["deployment_asset"]["Row"];
export type DeploymentAssetInsert = Database["public"]["Tables"]["deployment_asset"]["Insert"];
export type DeploymentAssetUpdate = Database["public"]["Tables"]["deployment_asset"]["Update"];

export type DeploymentAssetDependencies = AssetMovementDependencies & {
  insertDeploymentAsset(payload: DeploymentAssetInsert): Promise<AppResult<DeploymentAssetRow>>;
  updateDeploymentAsset(
    id: string,
    payload: DeploymentAssetUpdate,
  ): Promise<AppResult<DeploymentAssetRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export type CheckOutDeploymentAssetInput = {
  deploymentId: string;
  asset: AssetRow;
  notes: string | null;
  userId: string;
};

export type CheckInDeploymentAssetInput = {
  deploymentAsset: DeploymentAssetRow;
  asset: AssetRow;
  returnStatus: Extract<AssetStatus, "available" | "damaged" | "under_maintenance">;
  notes: string | null;
  userId: string;
  checkedInAt?: Date;
};

export function canCheckOutAsset(asset: AssetRow) {
  return asset.status === "available" && !asset.archived_at;
}

export function buildDeploymentAssetInsert(
  input: CheckOutDeploymentAssetInput,
): DeploymentAssetInsert {
  return {
    deployment_id: input.deploymentId,
    asset_id: input.asset.id,
    checked_out_by: input.userId,
    notes: input.notes,
  };
}

export function buildDeploymentAssetCheckInPayload(
  userId: string,
  checkedInAt = new Date(),
): DeploymentAssetUpdate {
  return {
    checked_in_at: checkedInAt.toISOString(),
    checked_in_by: userId,
  };
}

export async function checkOutDeploymentAsset(
  dependencies: DeploymentAssetDependencies,
  input: CheckOutDeploymentAssetInput,
) {
  if (!canCheckOutAsset(input.asset)) {
    return { ok: false, error: "Only available active assets can be checked out." } as const;
  }

  const deploymentAssetResult = await dependencies.insertDeploymentAsset(
    buildDeploymentAssetInsert(input),
  );
  if (!deploymentAssetResult.ok) return deploymentAssetResult;

  const movementResult = await recordAssetMovement(dependencies, {
    asset: input.asset,
    toLocationId: input.asset.current_location_id,
    toStatus: "deployed",
    reason: "Deployment",
    notes: input.notes,
    userId: input.userId,
  });
  if (!movementResult.ok) return movementResult;

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "deployment.asset.checkout",
    recordType: "deployment_asset",
    recordId: deploymentAssetResult.data.id,
    newValue: {
      deploymentAsset: deploymentAssetResult.data,
      movement: movementResult.data.movement,
    },
  });

  return ok(deploymentAssetResult.data);
}

export async function checkInDeploymentAsset(
  dependencies: DeploymentAssetDependencies,
  input: CheckInDeploymentAssetInput,
) {
  if (input.deploymentAsset.checked_in_at) {
    return { ok: false, error: "Asset has already been checked in." } as const;
  }

  const checkInResult = await dependencies.updateDeploymentAsset(
    input.deploymentAsset.id,
    buildDeploymentAssetCheckInPayload(input.userId, input.checkedInAt),
  );
  if (!checkInResult.ok) return checkInResult;

  const movementResult = await recordAssetMovement(dependencies, {
    asset: input.asset,
    toLocationId: input.asset.current_location_id,
    toStatus: input.returnStatus,
    reason: input.returnStatus === "available" ? "Return to store" : "Deployment return issue",
    notes: input.notes,
    userId: input.userId,
  });
  if (!movementResult.ok) return movementResult;

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "deployment.asset.checkin",
    recordType: "deployment_asset",
    recordId: checkInResult.data.id,
    oldValue: input.deploymentAsset,
    newValue: {
      deploymentAsset: checkInResult.data,
      movement: movementResult.data.movement,
    },
  });

  return ok(checkInResult.data);
}
