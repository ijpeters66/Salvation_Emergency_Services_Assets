"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createDeploymentRecord,
  parseDeploymentFormData,
  updateDeploymentRecord,
} from "@/lib/deployments/service";
import {
  createSupabaseDeploymentDependencies,
  getCurrentSupabaseUserId,
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
