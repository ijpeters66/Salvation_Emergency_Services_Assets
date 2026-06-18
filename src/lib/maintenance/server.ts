import { writeAuditLog } from "@/lib/audit-log";
import type { MaintenanceScheduleInsert } from "@/lib/maintenance/schedules";
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
    writeAuditLog,
  };
}
