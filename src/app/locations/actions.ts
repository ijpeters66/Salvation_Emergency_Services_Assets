"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";
import { getPublicEnvStatus } from "@/lib/env";
import {
  archiveLocationRecord,
  createLocationRecord,
  updateLocationRecord,
} from "@/lib/locations/service";
import {
  createSupabaseLocationDependencies,
  getCurrentSupabaseUserId,
} from "@/lib/locations/server";
import { parseLocationFormData } from "@/lib/locations/validation";

function redirectToLocations(status: string): never {
  redirect(`/locations?status=${status}`);
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
    dependencies: createSupabaseLocationDependencies(),
  };
}

export async function createLocationAction(formData: FormData) {
  const parsed = parseLocationFormData(formData);

  if (!parsed.success) {
    redirectToLocations("validation-error");
  }

  const context = await getMutationContext();

  if (!context) {
    redirectToLocations("auth-error");
  }

  const result = await createLocationRecord(context.dependencies, parsed.data, context.userId);

  if (!result.ok) {
    redirectToLocations("save-error");
  }

  revalidatePath("/locations");
  redirectToLocations("created");
}

export async function updateLocationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = parseLocationFormData(formData);

  if (!id || !parsed.success) {
    redirectToLocations("validation-error");
  }

  const context = await getMutationContext();

  if (!context) {
    redirectToLocations("auth-error");
  }

  const result = await updateLocationRecord(context.dependencies, id, parsed.data, context.userId);

  if (!result.ok) {
    redirectToLocations("save-error");
  }

  revalidatePath("/locations");
  redirectToLocations("updated");
}

export async function archiveLocationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const user = await getCurrentUserContext();
  const context = await getMutationContext();

  if (!id || !context || user?.role !== "system_admin") {
    redirectToLocations("auth-error");
  }

  const result = await archiveLocationRecord(context.dependencies, id, context.userId);

  if (!result.ok) {
    redirectToLocations("save-error");
  }

  revalidatePath("/locations");
  redirectToLocations("archived");
}
