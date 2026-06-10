export const userRoles = ["system_admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

export const assetStatuses = [
  "available",
  "deployed",
  "in_transit",
  "under_maintenance",
  "damaged",
  "retired",
  "lost_stolen",
] as const;
export type AssetStatus = (typeof assetStatuses)[number];

export const deploymentStatuses = ["planned", "active", "returned", "closed"] as const;
export type DeploymentStatus = (typeof deploymentStatuses)[number];

export const stockMovementTypes = [
  "received",
  "issued",
  "transferred",
  "returned",
  "adjusted",
  "written_off",
  "stocktake_variance",
] as const;
export type StockMovementType = (typeof stockMovementTypes)[number];

export const attachmentOwnerTypes = [
  "asset",
  "consumable_batch",
  "maintenance_record",
  "deployment",
  "location",
] as const;
export type AttachmentOwnerType = (typeof attachmentOwnerTypes)[number];

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export function isUserRole(value: unknown): value is UserRole {
  return isOneOf(userRoles, value);
}

export function isAssetStatus(value: unknown): value is AssetStatus {
  return isOneOf(assetStatuses, value);
}

export function isDeploymentStatus(value: unknown): value is DeploymentStatus {
  return isOneOf(deploymentStatuses, value);
}

export function isStockMovementType(value: unknown): value is StockMovementType {
  return isOneOf(stockMovementTypes, value);
}

export function isAttachmentOwnerType(value: unknown): value is AttachmentOwnerType {
  return isOneOf(attachmentOwnerTypes, value);
}
