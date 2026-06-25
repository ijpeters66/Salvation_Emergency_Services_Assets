import { writeAuditLog } from "@/lib/audit-log";
import type { AssetMovementInsert } from "@/lib/assets/movement";
import type { AssetUpdate } from "@/lib/assets/service";
import type { DeploymentAssetInsert, DeploymentAssetUpdate } from "@/lib/deployments/assets";
import type { DeploymentConsumableInsert } from "@/lib/deployments/consumables";
import type {
  DeploymentInsert,
  DeploymentStatus,
  DeploymentUpdate,
} from "@/lib/deployments/service";
import type { ConsumableBatchUpdate } from "@/lib/consumables/service";
import type { StockMovementInsert } from "@/lib/consumables/stock-movement";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listDeployments(
  filters: { status?: DeploymentStatus; from?: string; overdueReturn?: boolean } = {},
) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("deployment").select("*").order("start_datetime", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("start_datetime", new Date(filters.from).toISOString());
  const { data, error } = await query;
  if (error) return [];
  if (!filters.overdueReturn) return data;
  const now = new Date().getTime();
  return data.filter(
    (deployment) =>
      deployment.status === "active" &&
      deployment.expected_return_datetime &&
      new Date(deployment.expected_return_datetime).getTime() < now,
  );
}

export async function getDeploymentById(id: string) {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("deployment").select("*").eq("id", id).maybeSingle();
  return error ? null : data;
}

export async function listDeploymentAssets(deploymentId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deployment_asset")
    .select("*")
    .eq("deployment_id", deploymentId)
    .order("checked_out_at", { ascending: false });
  return error ? [] : data;
}

export async function listAssetDeploymentHistory(assetId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deployment_asset")
    .select("*")
    .eq("asset_id", assetId)
    .order("checked_out_at", { ascending: false });
  return error ? [] : data;
}

export async function getDeploymentAssetById(id: string) {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deployment_asset")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return error ? null : data;
}

export async function listDeploymentConsumables(deploymentId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deployment_consumable")
    .select("*")
    .eq("deployment_id", deploymentId)
    .order("issued_at", { ascending: false });
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
    async insertDeploymentAsset(payload: DeploymentAssetInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("deployment_asset")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateDeploymentAsset(id: string, payload: DeploymentAssetUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("deployment_asset")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertMovement(payload: AssetMovementInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset_movement")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateAsset(id: string, payload: AssetUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertStockMovement(payload: StockMovementInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("stock_movement")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateBatch(id: string, payload: ConsumableBatchUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("consumable_batch")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertDeploymentConsumable(payload: DeploymentConsumableInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("deployment_consumable")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    writeAuditLog,
  };
}
