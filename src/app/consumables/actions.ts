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
  getCurrentSupabaseUserId,
} from "@/lib/consumables/server";
import {
  parseConsumableBatchFormData,
  parseConsumableItemFormData,
} from "@/lib/consumables/validation";
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

  const result = await updateConsumableBatchRecord(
    context.dependencies,
    id,
    parsed.data,
    context.userId,
  );
  if (!result.ok) redirectToConsumables("save-error");

  revalidatePath("/consumables");
  revalidatePath(`/consumables/${id}`);
  redirect(`/consumables/${id}?statusMessage=updated`);
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
