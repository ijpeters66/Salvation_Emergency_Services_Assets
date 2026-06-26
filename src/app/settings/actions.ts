"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";
import { getPublicEnvStatus } from "@/lib/env";
import {
  normaliseMovementReasonKey,
  parseBrandingSettingsFormData,
  parseCategoryFormData,
  parseMovementReasonFormData,
  parseUserRoleFormData,
} from "@/lib/settings";
import {
  createSupabaseSettingsDependencies,
  getCurrentSupabaseUserId,
} from "@/lib/settings/server";

function redirectToSettings(status: string) {
  redirect(`/settings?statusMessage=${status}`);
}

async function getAdminMutationContext() {
  const user = await getCurrentUserContext();

  if (!getPublicEnvStatus().configured || user?.role !== "system_admin") {
    return null;
  }

  const userId = await getCurrentSupabaseUserId();

  if (!userId) {
    return null;
  }

  return {
    userId,
    dependencies: createSupabaseSettingsDependencies(),
  };
}

export async function updateUserAccessAction(formData: FormData) {
  const parsed = parseUserRoleFormData(formData);
  const context = await getAdminMutationContext();

  if (!parsed.success) {
    redirectToSettings("auth-error");
  }

  if (!context) {
    redirectToSettings("auth-error");
  }

  if (!("data" in parsed)) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;
  const parsedData = parsed.data!;

  if (parsedData.userId === adminContext.userId) {
    if (!parsedData.isActive || parsedData.role !== "system_admin") {
      redirectToSettings("self-lockout");
    }
  }

  const { data, error } = await adminContext.dependencies.updateUserProfile(parsedData.userId, {
    role_id: (await adminContext.dependencies.getRoleIdByKey(parsedData.role)) ?? undefined,
    is_active: parsedData.isActive,
    updated_at: new Date().toISOString(),
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.user.update",
    recordType: "app_user_profile",
    recordId: parsedData.userId,
    newValue: {
      role: parsedData.role,
      is_active: parsedData.isActive,
    },
  });

  revalidatePath("/settings");
  redirectToSettings("user-saved");
}

export async function saveReportBrandingAction(formData: FormData) {
  const parsed = parseBrandingSettingsFormData(formData);
  const context = await getAdminMutationContext();

  if (!parsed.success) {
    redirectToSettings("auth-error");
  }

  if (!context) {
    redirectToSettings("auth-error");
  }

  if (!("data" in parsed)) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;
  const parsedData = parsed.data!;

  const { data, error } = await adminContext.dependencies.upsertSystemSetting(
    "report_branding",
    parsedData,
    adminContext.userId,
  );

  if (error || !data) {
    redirectToSettings("save-error");
  }

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.report_branding.update",
    recordType: "system_setting",
    recordId: "report_branding",
    newValue: parsedData,
  });

  revalidatePath("/settings");
  revalidatePath("/reports");
  redirectToSettings("branding-saved");
}

export async function createAssetCategoryAdminAction(formData: FormData) {
  const parsed = parseCategoryFormData(formData);
  const context = await getAdminMutationContext();

  if (!parsed.success) {
    redirectToSettings("auth-error");
  }

  if (!context) {
    redirectToSettings("auth-error");
  }

  if (!("data" in parsed)) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;
  const parsedData = parsed.data!;

  const { data, error } = await adminContext.dependencies.insertAssetCategory({
    name: parsedData.name,
    description: parsedData.description,
    created_by: adminContext.userId,
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const savedCategory = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.asset_category.create",
    recordType: "asset_category",
    recordId: savedCategory.id,
    newValue: savedCategory,
  });

  revalidatePath("/settings");
  revalidatePath("/assets");
  redirectToSettings("asset-category-saved");
}

export async function archiveAssetCategoryAdminAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await getAdminMutationContext();

  if (!id || !context) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;

  const { data, error } = await adminContext.dependencies.archiveAssetCategory(id, {
    archived_at: new Date().toISOString(),
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const archivedCategory = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.asset_category.archive",
    recordType: "asset_category",
    recordId: id,
    newValue: archivedCategory,
  });

  revalidatePath("/settings");
  revalidatePath("/assets");
  redirectToSettings("asset-category-archived");
}

export async function createConsumableCategoryAdminAction(formData: FormData) {
  const parsed = parseCategoryFormData(formData);
  const context = await getAdminMutationContext();

  if (!parsed.success) {
    redirectToSettings("auth-error");
  }

  if (!context) {
    redirectToSettings("auth-error");
  }

  if (!("data" in parsed)) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;
  const parsedData = parsed.data!;

  const { data, error } = await adminContext.dependencies.insertConsumableCategory({
    name: parsedData.name,
    description: parsedData.description,
    created_by: adminContext.userId,
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const savedCategory = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.consumable_category.create",
    recordType: "consumable_category",
    recordId: savedCategory.id,
    newValue: savedCategory,
  });

  revalidatePath("/settings");
  revalidatePath("/consumables");
  redirectToSettings("consumable-category-saved");
}

export async function archiveConsumableCategoryAdminAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await getAdminMutationContext();

  if (!id || !context) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;

  const { data, error } = await adminContext.dependencies.archiveConsumableCategory(id, {
    archived_at: new Date().toISOString(),
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const archivedCategory = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.consumable_category.archive",
    recordType: "consumable_category",
    recordId: id,
    newValue: archivedCategory,
  });

  revalidatePath("/settings");
  revalidatePath("/consumables");
  redirectToSettings("consumable-category-archived");
}

export async function createMovementReasonAction(formData: FormData) {
  const parsed = parseMovementReasonFormData(formData);
  const context = await getAdminMutationContext();

  if (!parsed.success) {
    redirectToSettings("auth-error");
  }

  if (!context) {
    redirectToSettings("auth-error");
  }

  if (!("data" in parsed)) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;
  const parsedData = parsed.data!;

  const { data, error } = await adminContext.dependencies.insertMovementReason({
    key: normaliseMovementReasonKey(parsedData.label),
    label: parsedData.label,
    description: parsedData.description,
    sort_order: Number(formData.get("sortOrder") ?? 999),
    created_by: adminContext.userId,
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const savedReason = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.movement_reason.create",
    recordType: "movement_reason",
    recordId: savedReason.id,
    newValue: savedReason,
  });

  revalidatePath("/settings");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/deployments");
  redirectToSettings("movement-reason-saved");
}

export async function archiveMovementReasonAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await getAdminMutationContext();

  if (!id || !context) {
    redirectToSettings("auth-error");
  }

  const adminContext = context!;

  const { data, error } = await adminContext.dependencies.updateMovementReason(id, {
    archived_at: new Date().toISOString(),
    updated_by: adminContext.userId,
  });

  if (error || !data) {
    redirectToSettings("save-error");
  }

  const archivedReason = data!;

  await adminContext.dependencies.writeAuditLog({
    userId: adminContext.userId,
    actionType: "settings.movement_reason.archive",
    recordType: "movement_reason",
    recordId: id,
    newValue: archivedReason,
  });

  revalidatePath("/settings");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/deployments");
  redirectToSettings("movement-reason-archived");
}
