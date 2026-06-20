import { writeAuditLog } from "@/lib/audit-log";
import type { MaintenanceRecordInsert } from "@/lib/maintenance/records";
import type {
  MaintenanceScheduleInsert,
  MaintenanceScheduleUpdate,
} from "@/lib/maintenance/schedules";
import type {
  MaintenanceVendorInsert,
  MaintenanceVendorUpdate,
} from "@/lib/maintenance/vendors";
import type { UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listMaintenanceSchedules(assetId?: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("maintenance_schedule")
    .select("*")
    .order("next_service_due_date", { ascending: true });
  if (assetId) query = query.eq("asset_id", assetId);
  const { data, error } = await query;
  return error ? [] : data;
}

export async function listMaintenanceVendors(includeArchived = false, role: UserRole = "user") {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("maintenance_vendor").select("*").order("business_name");
  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }
  const { data, error } = await query;
  return error ? [] : data;
}

export async function listMaintenanceRecords(assetId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_record")
    .select("*")
    .eq("asset_id", assetId)
    .order("date", { ascending: false });
  return error ? [] : data;
}

export async function getMaintenanceRecordById(id: string) {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_record")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return error ? null : data;
}

export async function getCurrentSupabaseUserId() {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function createSupabaseMaintenanceDependencies() {
  return {
    async upsertSchedule(payload: MaintenanceScheduleInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_schedule")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async createRecord(payload: MaintenanceRecordInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_record")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async getSchedule(scheduleId: string) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_schedule")
        .select("*")
        .eq("id", scheduleId)
        .maybeSingle();
      return error ? null : data;
    },
    async updateSchedule(scheduleId: string, payload: MaintenanceScheduleUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_schedule")
        .update(payload)
        .eq("id", scheduleId)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertVendor(payload: MaintenanceVendorInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_vendor")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateVendor(id: string, payload: MaintenanceVendorUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("maintenance_vendor")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    writeAuditLog,
  };
}
