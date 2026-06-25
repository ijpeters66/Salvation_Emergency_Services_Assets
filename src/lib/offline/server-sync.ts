import { recordStockMovement } from "@/lib/consumables/stock-movement";
import { createSupabaseConsumableDependencies, getConsumableBatchById } from "@/lib/consumables/server";
import {
  createDeploymentRecord,
  parseDeploymentFormData,
  updateDeploymentRecord,
} from "@/lib/deployments/service";
import { createSupabaseDeploymentDependencies, getDeploymentById } from "@/lib/deployments/server";
import { detectOfflineSyncConflict } from "@/lib/offline/sync";
import type { OfflineMutationRecord } from "@/lib/offline/indexed-db";
import { createMaintenanceRecord, parseMaintenanceRecordFormData } from "@/lib/maintenance/records";
import { createSupabaseMaintenanceDependencies } from "@/lib/maintenance/server";
import { createLocationRecord, updateLocationRecord } from "@/lib/locations/service";
import { createSupabaseLocationDependencies, getLocationById } from "@/lib/locations/server";
import { parseLocationFormData } from "@/lib/locations/validation";
import { getAssetById, createSupabaseAssetDependencies } from "@/lib/assets/server";
import { createAssetRecord, updateAssetRecord } from "@/lib/assets/service";
import { parseAssetFormData } from "@/lib/assets/validation";
import { isStockMovementType } from "@/lib/domain-types";

function objectToFormData(payload: Record<string, unknown>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value == null) {
      continue;
    }

    formData.set(key, String(value));
  }

  return formData;
}

type ProcessOfflineMutationResult =
  | {
      ok: true;
      recordId: string;
      updatedAt?: string | null;
    }
  | {
      ok: false;
      status: 400 | 404 | 409 | 500;
      message: string;
    };

function baselineUpdatedAtFromPayload(payload: Record<string, unknown>) {
  const value = payload.offlineUpdatedAt;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function processOfflineMutation(
  mutation: OfflineMutationRecord,
  userId: string,
): Promise<ProcessOfflineMutationResult> {
  const formData = objectToFormData(mutation.payload);
  const baselineUpdatedAt = baselineUpdatedAtFromPayload(mutation.payload);

  if (mutation.entity_type === "asset") {
    const parsed = parseAssetFormData(formData);

    if (!parsed.success) {
      return { ok: false, status: 400, message: "Invalid asset payload." };
    }

    const dependencies = createSupabaseAssetDependencies();

    if (mutation.operation_type === "create") {
      const result = await createAssetRecord(dependencies, parsed.data, userId);
      return result.ok
        ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
        : { ok: false, status: 500, message: result.error };
    }

    const current = await getAssetById(mutation.entity_id);

    if (!current) {
      return { ok: false, status: 404, message: "Asset not found during offline sync." };
    }

    if (detectOfflineSyncConflict(baselineUpdatedAt, current.updated_at)) {
      return { ok: false, status: 409, message: "Asset was updated before this offline change synced." };
    }

    const result = await updateAssetRecord(dependencies, current.id, parsed.data, userId);
    return result.ok
      ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
      : { ok: false, status: 500, message: result.error };
  }

  if (mutation.entity_type === "location") {
    const parsed = parseLocationFormData(formData);

    if (!parsed.success) {
      return { ok: false, status: 400, message: "Invalid location payload." };
    }

    const dependencies = createSupabaseLocationDependencies();

    if (mutation.operation_type === "create") {
      const result = await createLocationRecord(dependencies, parsed.data, userId);
      return result.ok
        ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
        : { ok: false, status: 500, message: result.error };
    }

    const current = await getLocationById(mutation.entity_id);

    if (!current) {
      return { ok: false, status: 404, message: "Location not found during offline sync." };
    }

    if (detectOfflineSyncConflict(baselineUpdatedAt, current.updated_at)) {
      return { ok: false, status: 409, message: "Location was updated before this offline change synced." };
    }

    const result = await updateLocationRecord(dependencies, current.id, parsed.data, userId);
    return result.ok
      ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
      : { ok: false, status: 500, message: result.error };
  }

  if (mutation.entity_type === "deployment") {
    const parsed = parseDeploymentFormData(formData);

    if (!parsed.success) {
      return { ok: false, status: 400, message: "Invalid deployment payload." };
    }

    const dependencies = createSupabaseDeploymentDependencies();

    if (mutation.operation_type === "create") {
      const result = await createDeploymentRecord(dependencies, parsed.data, userId);
      return result.ok
        ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
        : { ok: false, status: 500, message: result.error };
    }

    const current = await getDeploymentById(mutation.entity_id);

    if (!current) {
      return { ok: false, status: 404, message: "Deployment not found during offline sync." };
    }

    if (detectOfflineSyncConflict(baselineUpdatedAt, current.updated_at)) {
      return { ok: false, status: 409, message: "Deployment was updated before this offline change synced." };
    }

    const result = await updateDeploymentRecord(dependencies, current, parsed.data, userId);
    return result.ok
      ? { ok: true, recordId: result.data.id, updatedAt: result.data.updated_at }
      : { ok: false, status: 500, message: result.error };
  }

  if (mutation.entity_type === "stock_movement") {
    const batchId = String(mutation.payload.batchId ?? "");
    const movementType = String(mutation.payload.movementType ?? "");
    const quantity = Number(mutation.payload.quantity ?? 0);
    const fromLocationId = String(mutation.payload.fromLocationId ?? "") || null;
    const toLocationId = String(mutation.payload.toLocationId ?? "") || null;
    const reason = String(mutation.payload.reason ?? "").trim();
    const relatedDeploymentId = String(mutation.payload.relatedDeploymentId ?? "") || null;
    const notes = String(mutation.payload.notes ?? "").trim() || null;

    if (!isStockMovementType(movementType)) {
      return { ok: false, status: 400, message: "Invalid stock movement payload." };
    }

    const batch = await getConsumableBatchById(batchId);

    if (!batch) {
      return { ok: false, status: 404, message: "Consumable batch not found during offline sync." };
    }

    if (detectOfflineSyncConflict(baselineUpdatedAt, batch.updated_at)) {
      return { ok: false, status: 409, message: "Consumable batch changed before this stock movement synced." };
    }

    const result = await recordStockMovement(createSupabaseConsumableDependencies(), {
      batch,
      movementType,
      quantity,
      fromLocationId,
      toLocationId,
      reason,
      relatedDeploymentId,
      notes,
      userId,
    });

    return result.ok
      ? { ok: true, recordId: result.data.movement.id, updatedAt: result.data.batch.updated_at }
      : { ok: false, status: 500, message: result.error };
  }

  if (mutation.entity_type === "maintenance_record") {
    const parsed = parseMaintenanceRecordFormData(formData);

    if (!parsed.success) {
      return { ok: false, status: 400, message: "Invalid maintenance record payload." };
    }

    const asset = await getAssetById(parsed.data.assetId);

    if (!asset) {
      return { ok: false, status: 404, message: "Asset not found during maintenance sync." };
    }

    if (detectOfflineSyncConflict(baselineUpdatedAt, asset.updated_at)) {
      return { ok: false, status: 409, message: "Asset changed before this maintenance record synced." };
    }

    const result = await createMaintenanceRecord(createSupabaseMaintenanceDependencies(), parsed.data, userId);
    return result.ok
      ? { ok: true, recordId: result.data.id, updatedAt: result.data.created_at }
      : { ok: false, status: 500, message: result.error };
  }

  return { ok: false, status: 400, message: "Unsupported offline mutation type." };
}
