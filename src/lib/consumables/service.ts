import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";
import type {
  ConsumableBatchFormInput,
  ConsumableItemFormInput,
} from "@/lib/consumables/validation";

export type ConsumableCategoryRow = Database["public"]["Tables"]["consumable_category"]["Row"];
export type ConsumableItemRow = Database["public"]["Tables"]["consumable_item"]["Row"];
export type ConsumableBatchRow = Database["public"]["Tables"]["consumable_batch"]["Row"];
export type ConsumableItemInsert = Database["public"]["Tables"]["consumable_item"]["Insert"];
export type ConsumableBatchInsert = Database["public"]["Tables"]["consumable_batch"]["Insert"];
export type ConsumableBatchUpdate = Database["public"]["Tables"]["consumable_batch"]["Update"];

export type ConsumableDependencies = {
  insertItem(payload: ConsumableItemInsert): Promise<AppResult<ConsumableItemRow>>;
  insertBatch(payload: ConsumableBatchInsert): Promise<AppResult<ConsumableBatchRow>>;
  updateBatch(id: string, payload: ConsumableBatchUpdate): Promise<AppResult<ConsumableBatchRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function calculateBatchValue(quantityOnHand: number, unitCost: number | null) {
  return quantityOnHand * (unitCost ?? 0);
}

export function buildConsumableItemInsertPayload(
  input: ConsumableItemFormInput,
  userId: string,
): ConsumableItemInsert {
  return {
    name: input.name,
    category_id: input.categoryId,
    description: input.description,
    created_by: userId,
    updated_by: userId,
  };
}

export function buildConsumableBatchInsertPayload(
  input: ConsumableBatchFormInput,
  userId: string,
): ConsumableBatchInsert {
  return {
    item_id: input.itemId,
    batch_lot_number: input.batchLotNumber,
    quantity_received: input.quantityReceived,
    quantity_on_hand: input.quantityOnHand,
    unit_cost: input.unitCost,
    replacement_cost: input.replacementCost,
    date_received: input.dateReceived,
    supplier_donor: input.supplierDonor,
    expiry_date: input.expiryDate,
    location_id: input.locationId,
    qr_code_value: input.qrCodeValue || `SAES-CONSUMABLE:${input.batchLotNumber}`,
    created_by: userId,
    updated_by: userId,
  };
}

export function buildConsumableBatchUpdatePayload(
  input: ConsumableBatchFormInput,
  userId: string,
): ConsumableBatchUpdate {
  return {
    ...buildConsumableBatchInsertPayload(input, userId),
    created_by: undefined,
    updated_by: userId,
  };
}

export async function createConsumableItemRecord(
  dependencies: ConsumableDependencies,
  input: ConsumableItemFormInput,
  userId: string,
) {
  const result = await dependencies.insertItem(buildConsumableItemInsertPayload(input, userId));

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "consumable.item.create",
    recordType: "consumable_item",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function createConsumableBatchRecord(
  dependencies: ConsumableDependencies,
  input: ConsumableBatchFormInput,
  userId: string,
) {
  const result = await dependencies.insertBatch(buildConsumableBatchInsertPayload(input, userId));

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "consumable.batch.create",
    recordType: "consumable_batch",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function updateConsumableBatchRecord(
  dependencies: ConsumableDependencies,
  id: string,
  input: ConsumableBatchFormInput,
  userId: string,
) {
  const result = await dependencies.updateBatch(
    id,
    buildConsumableBatchUpdatePayload(input, userId),
  );

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "consumable.batch.update",
    recordType: "consumable_batch",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function archiveConsumableBatchRecord(
  dependencies: ConsumableDependencies,
  id: string,
  userId: string,
  archivedAt = new Date(),
) {
  const result = await dependencies.updateBatch(id, {
    archived_at: archivedAt.toISOString(),
    updated_by: userId,
  });

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "consumable.batch.archive",
    recordType: "consumable_batch",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}
