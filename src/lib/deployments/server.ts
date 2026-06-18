import { writeAuditLog } from "@/lib/audit-log";
import type {
  DeploymentInsert,
  DeploymentStatus,
  DeploymentUpdate,
} from "@/lib/deployments/service";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listDeployments(filters: { status?: DeploymentStatus; from?: string } = {}) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("deployment").select("*").order("start_datetime", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("start_datetime", new Date(filters.from).toISOString());
  const { data, error } = await query;
  return error ? [] : data;
}

export async function getDeploymentById(id: string) {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("deployment").select("*").eq("id", id).maybeSingle();
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

export function createSupabaseDeploymentDependencies() {
  return {
    async insertDeployment(payload: DeploymentInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("deployment")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateDeployment(id: string, payload: DeploymentUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("deployment")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    writeAuditLog,
  };
}
