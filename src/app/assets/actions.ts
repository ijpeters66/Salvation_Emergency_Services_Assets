"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";
import { archiveAssetRecord, createAssetRecord, updateAssetRecord } from "@/lib/assets/service";
import { createSupabaseAssetDependencies, getCurrentSupabaseUserId } from "@/lib/assets/server";
import { parseAssetFormData } from "@/lib/assets/validation";
import { getPublicEnvStatus } from "@/lib/env";

function redirectToAssets(status: string): never {
  redirect(`/assets?statusMessage=${status}`);
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
    dependencies: createSupabaseAssetDependencies(),
  };
}

export async function createAssetAction(formData: FormData) {
  const parsed = parseAssetFormData(formData);

  if (!parsed.success) {
    redirectToAssets("validation-error");
  }

  const context = await getMutationContext();

  if (!context) {
    redirectToAssets("auth-error");
  }

  const result = await createAssetRecord(context.dependencies, parsed.data, context.userId);

  if (!result.ok) {
    redirectToAssets("save-error");
  }

  revalidatePath("/assets");
  redirect(`/assets/${result.data.id}?statusMessage=created`);
}

export async function updateAssetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = parseAssetFormData(formData);

  if (!id || !parsed.success) {
    redirectToAssets("validation-error");
  }

  const context = await getMutationContext();

  if (!context) {
    redirectToAssets("auth-error");
  }

  const result = await updateAssetRecord(context.dependencies, id, parsed.data, context.userId);

  if (!result.ok) {
    redirectToAssets("save-error");
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}?statusMessage=updated`);
}

export async function archiveAssetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getCurrentUserContext();
  const context = await getMutationContext();

  if (!id || !context || user?.role !== "system_admin") {
    redirectToAssets("auth-error");
  }

  const result = await archiveAssetRecord(context.dependencies, id, context.userId);

  if (!result.ok) {
    redirectToAssets("save-error");
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirectToAssets("archived");
}
