import { listAssetCategories, listAssets, listPlantDetails } from "@/lib/assets/server";
import type { UserRole } from "@/lib/domain-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildPreviewReportSnapshot,
  type ReportSnapshot,
} from "@/lib/reports";
import {
  listConsumableBatches,
  listConsumableCategories,
  listConsumableItems,
  listStockThresholds,
} from "@/lib/consumables/server";
import { listDeployments } from "@/lib/deployments/server";
import { listLocations } from "@/lib/locations/server";
import { listMaintenanceSchedules } from "@/lib/maintenance/server";

export async function getReportSnapshot(
  role: UserRole,
  options: { preview?: boolean } = {},
): Promise<ReportSnapshot> {
  if (options.preview) {
    return buildPreviewReportSnapshot();
  }

  const supabase = await createSupabaseServerClient();

  const [
    assets,
    assetCategories,
    auditLogsResult,
    consumableBatches,
    consumableCategories,
    consumableItems,
    deploymentAssetsResult,
    deploymentConsumablesResult,
    deployments,
    locations,
    maintenanceSchedules,
    plantDetails,
    profilesResult,
    stockMovementsResult,
    stockThresholds,
  ] = await Promise.all([
    listAssets({}, role),
    listAssetCategories(false, role),
    role === "system_admin"
      ? supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500)
      : Promise.resolve({ data: [], error: null }),
    listConsumableBatches({}, role),
    listConsumableCategories(false, role),
    listConsumableItems(false, role),
    supabase.from("deployment_asset").select("*").order("checked_out_at", { ascending: false }),
    supabase.from("deployment_consumable").select("*").order("issued_at", { ascending: false }),
    listDeployments(),
    listLocations(false, role),
    listMaintenanceSchedules(),
    listPlantDetails(),
    supabase.from("app_user_profile").select("user_id, display_name"),
    supabase.from("stock_movement").select("*").order("created_at", { ascending: false }),
    listStockThresholds(),
  ]);

  return {
    assets,
    assetCategories,
    auditLogs: auditLogsResult.data ?? [],
    consumableBatches,
    consumableCategories,
    consumableItems,
    deploymentAssets: deploymentAssetsResult.data ?? [],
    deploymentConsumables: deploymentConsumablesResult.data ?? [],
    deployments,
    locations,
    maintenanceSchedules,
    plantDetails,
    stockMovements: stockMovementsResult.data ?? [],
    stockThresholds,
    users: (profilesResult.data ?? []).map((profile) => ({
      userId: profile.user_id,
      label: profile.display_name?.trim() || `User ${profile.user_id.slice(0, 8)}`,
    })),
  };
}
