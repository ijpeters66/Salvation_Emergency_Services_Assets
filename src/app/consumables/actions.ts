"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";
import {
  archiveConsumableBatchRecord,
  createConsumableBatchRecord,
  createConsumableItemRecord,
  updateConsumableBatchRecord,
} from "@/lib/consumables/service";
import {
  createSupabaseConsumableDependencies,
  getConsumableBatchById,
  getCurrentSupabaseUserId,
  listIssueEligibleBatches,
} from "@/lib/consumables/server";
import { issueConsumablesFifo } from "@/lib/consumables/fifo";
import { recordStockMovement } from "@/lib/consumables/stock-movement";
import { upsertStockThresholdRecord } from "@/lib/consumables/thresholds";
import {
  parseConsumableBatchFormData,
  parseConsumableItemFormData,
} from "@/lib/consumables/validation";
import { isStockMovementType } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";

function redirectToConsumables(status: string): never {
  redirect(`/consumables?statusMessage=${status}`);
}

async function getMutationContext() {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const userId = await getCurrentSupabaseUserId();

  if (!userId) {
    return null;
  }

  return {
    userId,
    dependencies: createSupabaseConsumableDependencies(),
  };
}

export async function createConsumableItemAction(formData: FormData) {
  const parsed = parseConsumableItemFormData(formData);
  if (!parsed.success) redirectToConsumables("validation-error");

  const context = await getMutationContext();
  if (!context) redirectToConsumables("auth-error");

  const result = await createConsumableItemRecord(
    context.dependencies,
    parsed.data,
    context.userId,
  );
  if (!result.ok) redirectToConsumables("save-error");

  revalidatePath("/consumables");
  redirectToConsumables("item-created");
}

export async function createConsumableBatchAction(formData: FormData) {
  const parsed = parseConsumableBatchFormData(formData);
  if (!parsed.success) redirectToConsumables("validation-error");

  const context = await getMutationContext();
  if (!context) redirectToConsumables("auth-error");

  const result = await createConsumableBatchRecord(
    context.dependencies,
    parsed.data,
    context.userId,
  );
  if (!result.ok) redirectToConsumables("save-error");

  revalidatePath("/consumables");
  redirect(`/consumables/${result.data.id}?statusMessage=created`);
}

export async function updateConsumableBatchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = parseConsumableBatchFormData(formData);
  if (!id || !parsed.success) redirectToConsumables("validation-error");

  const context = await getMutationContext();
  if (!context) redirectToConsumables("auth-error");

  const existingBatch = await getConsumableBatchById(id);
  if (!existingBatch) redirectToConsumables("save-error");

  const result = await updateConsumableBatchRecord(
    context.dependencies,
    id,
    {
      ...parsed.data,
      quantityOnHand: parsed.data.quantityReceived,
    },
    context.userId,
  );
  if (!result.ok) redirectToConsumables("save-error");

  revalidatePath("/consumables");
  revalidatePath(`/consumables/${id}`);
  redirect(`/consumables/${id}?statusMessage=updated`);
}

export async function recordStockMovementAction(formData: FormData) {
  const batchId = String(formData.get("batchId") ?? "");
  const movementType = String(formData.get("movementType") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const fromLocationId = String(formData.get("fromLocationId") ?? "") || null;
  const toLocationId = String(formData.get("toLocationId") ?? "") || null;
  const reason = String(formData.get("reason") ?? "").trim();
  const relatedDeploymentId = String(formData.get("relatedDeploymentId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const context = await getMutationContext();

  if (!batchId || !isStockMovementType(movementType) || !quantity || !reason || !context) {
    redirectToConsumables("validation-error");
  }

  const batch = await getConsumableBatchById(batchId);
  if (!batch) redirectToConsumables("save-error");

  const result = await recordStockMovement(context.dependencies, {
    batch,
    movementType,
    quantity,
    fromLocationId,
    toLocationId,
    reason,
    relatedDeploymentId,
    notes,
    userId: context.userId,
  });

  if (!result.ok) {
    redirect(`/consumables/${batchId}?statusMessage=movement-error`);
  }

  revalidatePath("/consumables");
  revalidatePath(`/consumables/${batchId}`);
  redirect(`/consumables/${batchId}?statusMessage=movement-recorded`);
}

export async function issueConsumablesFifoAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const context = await getMutationContext();

  if (!itemId || !locationId || !quantity || !reason || !context) {
    redirectToConsumables("validation-error");
  }

  const batches = await listIssueEligibleBatches(itemId, locationId);
  const result = await issueConsumablesFifo(context.dependencies, batches, {
    itemId,
    locationId,
    quantity,
    reason,
    notes,
    userId: context.userId,
  });

  if (!result.ok) {
    redirectToConsumables("fifo-error");
  }

  const issuedSummary = result.data
    .map((item) => `${item.batchLotNumber}:${item.quantity}`)
    .join(",");

  revalidatePath("/consumables");
  redirect(
    `/consumables?statusMessage=fifo-issued&issuedSummary=${encodeURIComponent(issuedSummary)}`,
  );
}

export async function upsertStockThresholdAction(formData: FormData) {
  const consumableItemId = String(formData.get("consumableItemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const minimumQuantity = Number(formData.get("minimumQuantity") ?? 0);
  const context = await getMutationContext();

  if (!consumableItemId || !locationId || minimumQuantity < 0 || !context) {
    redirectToConsumables("validation-error");
  }

  const result = await upsertStockThresholdRecord(context.dependencies, {
    consumableItemId,
    locationId,
    minimumQuantity,
    userId: context.userId,
  });

  if (!result.ok) {
    redirectToConsumables("save-error");
  }

  revalidatePath("/consumables");
  revalidatePath(`/consumables/items/${consumableItemId}`);
  redirect(`/consumables/items/${consumableItemId}?statusMessage=threshold-saved`);
}

export async function archiveConsumableBatchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getCurrentUserContext();
  const context = await getMutationContext();
  if (!id || !context || user?.role !== "system_admin") redirectToConsumables("auth-error");

  const result = await archiveConsumableBatchRecord(context.dependencies, id, context.userId);
  if (!result.ok) redirectToConsumables("save-error");

  revalidatePath("/consumables");
  revalidatePath(`/consumables/${id}`);
  redirectToConsumables("archived");
}
