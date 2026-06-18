"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseMaintenanceScheduleFormData,
  upsertMaintenanceScheduleRecord,
} from "@/lib/maintenance/schedules";
import { createMaintenanceRecord, parseMaintenanceRecordFormData } from "@/lib/maintenance/records";
import {
  createSupabaseMaintenanceDependencies,
  getCurrentSupabaseUserId,
} from "@/lib/maintenance/server";
import { getPublicEnvStatus } from "@/lib/env";

function redirectToMaintenance(status: string): never {
  redirect(`/maintenance?statusMessage=${status}`);
}

export async function upsertMaintenanceScheduleAction(formData: FormData) {
  if (!getPublicEnvStatus().configured) redirectToMaintenance("auth-error");
  const userId = await getCurrentSupabaseUserId();
  const parsed = parseMaintenanceScheduleFormData(formData);
  if (!userId || !parsed.success) redirectToMaintenance("validation-error");

  const result = await upsertMaintenanceScheduleRecord(
    createSupabaseMaintenanceDependencies(),
    parsed.data,
    userId,
  );
  if (!result.ok) redirectToMaintenance("save-error");

  revalidatePath("/maintenance");
  revalidatePath(`/assets/${parsed.data.assetId}`);
  redirect(`/assets/${parsed.data.assetId}?statusMessage=maintenance-schedule-saved`);
}

export async function createMaintenanceRecordAction(formData: FormData) {
  if (!getPublicEnvStatus().configured) redirectToMaintenance("auth-error");
  const userId = await getCurrentSupabaseUserId();
  const parsed = parseMaintenanceRecordFormData(formData);
  if (!userId || !parsed.success) redirectToMaintenance("validation-error");

  const result = await createMaintenanceRecord(
    createSupabaseMaintenanceDependencies(),
    parsed.data,
    userId,
  );
  if (!result.ok) redirectToMaintenance("save-error");

  revalidatePath("/maintenance");
  revalidatePath(`/assets/${parsed.data.assetId}`);
  redirect(`/assets/${parsed.data.assetId}?statusMessage=maintenance-record-saved`);
}
