import { writeAuditLog } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { getDefaultReportBrandingSettings } from "@/lib/report-branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import type { ReportBrandingSettings } from "@/lib/report-branding";
import { createClient } from "@supabase/supabase-js";

type AssetCategoryInsert = Database["public"]["Tables"]["asset_category"]["Insert"];
type ConsumableCategoryInsert = Database["public"]["Tables"]["consumable_category"]["Insert"];
type MovementReasonInsert = Database["public"]["Tables"]["movement_reason"]["Insert"];
type MovementReasonUpdate = Database["public"]["Tables"]["movement_reason"]["Update"];
type AppUserProfileUpdate = Database["public"]["Tables"]["app_user_profile"]["Update"];

export type SettingsUserRow = {
  user_id: string;
  display_name: string | null;
  role_id: string;
  role_key: string;
  role_name: string;
  is_active: boolean;
};

export async function getCurrentSupabaseUserId() {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function listRoles() {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("role").select("*").order("name");
  return error ? [] : data;
}

export async function listSettingsUsers() {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_list_user_profiles");

  if (error) {
    return [];
  }

  return (data ?? []) as SettingsUserRow[];
}

export async function listMovementReasons(includeArchived = false, role: UserRole = "user") {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("movement_reason")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  return error ? [] : data;
}

export async function listAssetCategoriesForSettings(
  includeArchived = false,
  role: UserRole = "user",
) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("asset_category").select("*").order("name", { ascending: true });
  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  return error ? [] : data;
}

export async function listConsumableCategoriesForSettings(
  includeArchived = false,
  role: UserRole = "user",
) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("consumable_category").select("*").order("name", { ascending: true });
  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  return error ? [] : data;
}

export async function getStoredReportBrandingSettings() {
  const defaults = getDefaultReportBrandingSettings();

  if (!getPublicEnvStatus().configured) {
    return defaults;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_setting")
    .select("value")
    .eq("key", "report_branding")
    .maybeSingle();

  if (error || !data?.value || typeof data.value !== "object" || Array.isArray(data.value)) {
    return defaults;
  }

  return {
    ...defaults,
    ...(data.value as Partial<ReportBrandingSettings>),
  };
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseSettingsDependencies() {
  return {
    async getRoleIdByKey(roleKey: string) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("role")
        .select("id")
        .eq("key", roleKey)
        .maybeSingle();
      return error ? null : data?.id ?? null;
    },
    async upsertSystemSetting(
      key: string,
      value: Database["public"]["Tables"]["system_setting"]["Update"]["value"],
      updatedBy: string,
    ) {
      const supabase = await createSupabaseServerClient();
      return supabase
        .from("system_setting")
        .upsert({ key, value, updated_by: updatedBy }, { onConflict: "key" })
        .select("*")
        .single();
    },
    async updateUserProfile(userId: string, payload: AppUserProfileUpdate) {
      const supabase = await createSupabaseServerClient();
      return supabase
        .from("app_user_profile")
        .update(payload)
        .eq("user_id", userId)
        .select("*")
        .single();
    },
    async insertAssetCategory(payload: AssetCategoryInsert) {
      const supabase = await createSupabaseServerClient();
      return supabase.from("asset_category").insert(payload).select("*").single();
    },
    async insertConsumableCategory(payload: ConsumableCategoryInsert) {
      const supabase = await createSupabaseServerClient();
      return supabase.from("consumable_category").insert(payload).select("*").single();
    },
    async archiveAssetCategory(
      id: string,
      payload: Database["public"]["Tables"]["asset_category"]["Update"],
    ) {
      const supabase = await createSupabaseServerClient();
      return supabase.from("asset_category").update(payload).eq("id", id).select("*").single();
    },
    async archiveConsumableCategory(
      id: string,
      payload: Database["public"]["Tables"]["consumable_category"]["Update"],
    ) {
      const supabase = await createSupabaseServerClient();
      return supabase
        .from("consumable_category")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
    },
    async insertMovementReason(payload: MovementReasonInsert) {
      const supabase = await createSupabaseServerClient();
      return supabase.from("movement_reason").insert(payload).select("*").single();
    },
    async updateMovementReason(id: string, payload: MovementReasonUpdate) {
      const supabase = await createSupabaseServerClient();
      return supabase.from("movement_reason").update(payload).eq("id", id).select("*").single();
    },
    writeAuditLog,
  };
}
