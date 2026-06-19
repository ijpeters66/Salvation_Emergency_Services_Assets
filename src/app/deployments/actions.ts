"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAssetById } from "@/lib/assets/server";
import { listIssueEligibleBatches } from "@/lib/consumables/server";
import { checkInDeploymentAsset, checkOutDeploymentAsset } from "@/lib/deployments/assets";
import { issueDeploymentConsumables } from "@/lib/deployments/consumables";
import {
  createDeploymentRecord,
  parseDeploymentFormData,
  updateDeploymentRecord,
} from "@/lib/deployments/service";
import {
  createSupabaseDeploymentDependencies,
  getCurrentSupabaseUserId,
  getDeploymentAssetById,
  getDeploymentById,
} from "@/lib/deployments/server";
import { getPublicEnvStatus } from "@/lib/env";

function redirectToDeployments(status: string): never {
  redirect(`/deployments?statusMessage=${status}`);
}

async function getMutationContext() {
  if (!getPublicEnvStatus().configured) return null;
  const userId = await getCurrentSupabaseUserId();
  if (!userId) return null;
  return {
    userId,
    dependencies: createSupabaseDeploymentDependencies(),
  };
}

export async function createDeploymentAction(formData: FormData) {
  const parsed = parseDeploymentFormData(formData);
  if (!parsed.success) redirectToDeployments("validation-error");
  const context = await getMutationContext();
  if (!context) redirectToDeployments("auth-error");

  const result = await createDeploymentRecord(context.dependencies, parsed.data, context.userId);
  if (!result.ok) redirectToDeployments("save-error");

  revalidatePath("/deployments");
  redirect(`/deployments/${result.data.id}?statusMessage=created`);
}

export async function updateDeploymentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = parseDeploymentFormData(formData);
  if (!id || !parsed.success) redirectToDeployments("validation-error");
  const [context, current] = await Promise.all([getMutationContext(), getDeploymentById(id)]);
  if (!context || !current) redirectToDeployments("auth-error");

  const result = await updateDeploymentRecord(
    context.dependencies,
    current,
    parsed.data,
    context.userId,
  );
  if (!result.ok) redirect(`/deployments/${id}?statusMessage=save-error`);

  revalidatePath("/deployments");
  revalidatePath(`/deployments/${id}`);
  redirect(`/deployments/${id}?statusMessage=updated`);
}

export async function checkOutDeploymentAssetAction(formData: FormData) {
  const deploymentId = String(formData.get("deploymentId") ?? "");
  const assetId = String(formData.get("assetId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const context = await getMutationContext();
  if (!deploymentId || !assetId || !context) redirectToDeployments("validation-error");

  const asset = await getAssetById(assetId);
  if (!asset) redirect(`/deployments/${deploymentId}?statusMessage=asset-error`);

  const result = await checkOutDeploymentAsset(context.dependencies, {
    deploymentId,
    asset,
    notes,
    userId: context.userId,
  });
  if (!result.ok) redirect(`/deployments/${deploymentId}?statusMessage=checkout-error`);

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath(`/deployments/${deploymentId}`);
  redirect(`/deployments/${deploymentId}?statusMessage=asset-checked-out`);
}

export async function checkInDeploymentAssetAction(formData: FormData) {
  const deploymentId = String(formData.get("deploymentId") ?? "");
  const deploymentAssetId = String(formData.get("deploymentAssetId") ?? "");
  const returnStatus = String(formData.get("returnStatus") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const context = await getMutationContext();
  if (
    !deploymentId ||
    !deploymentAssetId ||
    !["available", "damaged", "under_maintenance"].includes(returnStatus) ||
    !context
  ) {
    redirectToDeployments("validation-error");
  }

  const deploymentAsset = await getDeploymentAssetById(deploymentAssetId);
  if (!deploymentAsset) redirect(`/deployments/${deploymentId}?statusMessage=asset-error`);
  const asset = await getAssetById(deploymentAsset.asset_id);
  if (!asset) redirect(`/deployments/${deploymentId}?statusMessage=asset-error`);

  const result = await checkInDeploymentAsset(context.dependencies, {
    deploymentAsset,
    asset,
    returnStatus: returnStatus as "available" | "damaged" | "under_maintenance",
    notes,
    userId: context.userId,
  });
  if (!result.ok) redirect(`/deployments/${deploymentId}?statusMessage=checkin-error`);

  revalidatePath("/assets");
  revalidatePath(`/assets/${asset.id}`);
  revalidatePath(`/deployments/${deploymentId}`);
  redirect(`/deployments/${deploymentId}?statusMessage=asset-checked-in`);
}

export async function issueDeploymentConsumablesAction(formData: FormData) {
  const deploymentId = String(formData.get("deploymentId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const context = await getMutationContext();

  if (!deploymentId || !itemId || !locationId || !quantity || !context) {
    redirectToDeployments("validation-error");
  }

  const batches = await listIssueEligibleBatches(itemId, locationId);
  const result = await issueDeploymentConsumables(context.dependencies, batches, {
    deploymentId,
    itemId,
    locationId,
    quantity,
    notes,
    userId: context.userId,
  });

  if (!result.ok) {
    redirect(`/deployments/${deploymentId}?statusMessage=consumable-issue-error`);
  }

  revalidatePath("/consumables");
  revalidatePath("/deployments");
  revalidatePath(`/deployments/${deploymentId}`);
  redirect(`/deployments/${deploymentId}?statusMessage=consumables-issued`);
}
