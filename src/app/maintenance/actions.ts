"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseMaintenanceScheduleFormData,
  upsertMaintenanceScheduleRecord,
} from "@/lib/maintenance/schedules";
import { createMaintenanceRecord, parseMaintenanceRecordFormData } from "@/lib/maintenance/records";
import {
  archiveMaintenanceVendorRecord,
  createMaintenanceVendorRecord,
  parseMaintenanceVendorFormData,
  updateMaintenanceVendorRecord,
} from "@/lib/maintenance/vendors";
import {
  createSupabaseMaintenanceDependencies,
  getCurrentSupabaseUserId,
} from "@/lib/maintenance/server";
import { getCurrentUserContext } from "@/lib/auth";
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

export async function createMaintenanceVendorAction(formData: FormData) {
  if (!getPublicEnvStatus().configured) redirectToMaintenance("auth-error");
  const userId = await getCurrentSupabaseUserId();
  const parsed = parseMaintenanceVendorFormData(formData);
  if (!userId || !parsed.success) redirectToMaintenance("validation-error");

  const result = await createMaintenanceVendorRecord(
    createSupabaseMaintenanceDependencies(),
    parsed.data,
    userId,
  );
  if (!result.ok) redirectToMaintenance("save-error");

  revalidatePath("/maintenance");
  revalidatePath("/assets");
  redirectToMaintenance("vendor-saved");
}

export async function updateMaintenanceVendorAction(formData: FormData) {
  if (!getPublicEnvStatus().configured) redirectToMaintenance("auth-error");
  const userId = await getCurrentSupabaseUserId();
  const parsed = parseMaintenanceVendorFormData(formData);
  if (!userId || !parsed.success || !parsed.data.vendorId) redirectToMaintenance("validation-error");

  const result = await updateMaintenanceVendorRecord(
    createSupabaseMaintenanceDependencies(),
    parsed.data.vendorId,
    parsed.data,
    userId,
  );
  if (!result.ok) redirectToMaintenance("save-error");

  revalidatePath("/maintenance");
  revalidatePath("/assets");
  redirectToMaintenance("vendor-saved");
}

export async function archiveMaintenanceVendorAction(formData: FormData) {
  if (!getPublicEnvStatus().configured) redirectToMaintenance("auth-error");
  const user = await getCurrentUserContext();
  const userId = await getCurrentSupabaseUserId();
  const id = String(formData.get("id") ?? "");
  if (!id || !userId || user?.role !== "system_admin") redirectToMaintenance("auth-error");

  const result = await archiveMaintenanceVendorRecord(
    createSupabaseMaintenanceDependencies(),
    id,
    userId,
  );
  if (!result.ok) redirectToMaintenance("save-error");

  revalidatePath("/maintenance");
  revalidatePath("/assets");
  redirectToMaintenance("vendor-archived");
}
