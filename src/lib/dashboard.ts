import type { AssetMovementRow } from "@/lib/assets/movement";
import type { PlantDetailsRow } from "@/lib/assets/plant";
import type { AssetRow } from "@/lib/assets/service";
import {
  listAssets,
  listPlantDetails,
  listRecentAssetMovements,
} from "@/lib/assets/server";
import type { ConsumableBatchRow, ConsumableItemRow } from "@/lib/consumables/service";
import { calculateBatchValue } from "@/lib/consumables/service";
import type { StockMovementRow } from "@/lib/consumables/stock-movement";
import { buildStockAlerts } from "@/lib/consumables/thresholds";
import {
  listConsumableBatches,
  listConsumableItems,
  listRecentStockMovements,
  listStockThresholds,
} from "@/lib/consumables/server";
import type { DeploymentRow } from "@/lib/deployments/service";
import { listDeployments } from "@/lib/deployments/server";
import type { UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { getPlantExpiryAlerts } from "@/lib/assets/plant";
import type { MaintenanceAlertState, MaintenanceScheduleRow } from "@/lib/maintenance/schedules";
import { getScheduleAlertState } from "@/lib/maintenance/schedules";
import { listMaintenanceSchedules } from "@/lib/maintenance/server";

export type DashboardMetric = {
  description: string;
  href?: string;
  label: string;
  tone?: "default" | "alert";
  value: string;
};

export type DashboardRecentMovement = {
  href: string;
  id: string;
  subtitle: string;
  title: string;
};

export type DashboardData = {
  activeDeployments: number;
  assetStatusSummary: Array<{ count: number; href: string; label: string; status: string }>;
  assetsOverdueForReturn: number;
  errorMessage: string | null;
  hasOperationalData: boolean;
  lowStockItems: number;
  metrics: DashboardMetric[];
  outOfStockItems: number;
  recentAssetMovements: DashboardRecentMovement[];
  recentStockMovements: DashboardRecentMovement[];
  registrationInsuranceExpiry: number;
  role: UserRole;
  totalAssets: number;
  totalConsumableStock: number;
  upcomingMaintenance: number;
  overdueMaintenance: number;
};

export function getDashboardPreviewData(): DashboardData {
  return {
    activeDeployments: 2,
    assetStatusSummary: [
      { count: 12, href: "/assets?status=available&preview=1", label: "available", status: "available" },
      { count: 4, href: "/assets?status=deployed&preview=1", label: "deployed", status: "deployed" },
      { count: 1, href: "/assets?status=under_maintenance&preview=1", label: "under maintenance", status: "under_maintenance" },
    ],
    assetsOverdueForReturn: 1,
    errorMessage: null,
    hasOperationalData: true,
    lowStockItems: 3,
    metrics: [
      { label: "Total Assets", value: "17", description: "All active assets in the register.", href: "/assets?preview=1" },
      { label: "Assets by Status", value: "3", description: "available: 12 · deployed: 4", href: "/assets?preview=1" },
      { label: "Total Consumable Stock", value: "$4,280", description: "Current on-hand consumable stock value.", href: "/consumables?preview=1" },
      { label: "Low Stock Items", value: "3", description: "Threshold alerts that need replenishment soon.", href: "/consumables?alert=low-stock&preview=1", tone: "alert" },
      { label: "Out-of-Stock Items", value: "1", description: "Threshold alerts with no stock remaining.", href: "/consumables?alert=out-of-stock&preview=1", tone: "alert" },
      { label: "Upcoming Maintenance", value: "2", description: "Schedules approaching their reminder window.", href: "/maintenance?alert=due-soon&preview=1", tone: "alert" },
      { label: "Overdue Maintenance", value: "1", description: "Schedules that have passed due date or reading.", href: "/maintenance?alert=overdue&preview=1", tone: "alert" },
      { label: "Registration/Insurance Expiry", value: "2", description: "Plant and fleet expiry alerts in the next 30 days or overdue.", href: "/maintenance?alert=expiry&preview=1", tone: "alert" },
      { label: "Active Deployments", value: "2", description: "Deployments currently in the field.", href: "/deployments?status=active&preview=1", tone: "alert" },
      { label: "Assets Overdue for Return", value: "1", description: "Active deployments past expected return.", href: "/deployments?status=active&overdueReturn=1&preview=1", tone: "alert" },
    ],
    outOfStockItems: 1,
    recentAssetMovements: [
      { id: "preview-move-1", title: "Support trailer", subtitle: "Deployment · deployed", href: "/assets/preview-1?preview=1" },
      { id: "preview-move-2", title: "Generator", subtitle: "Return to store · available", href: "/assets/preview-2?preview=1" },
    ],
    recentStockMovements: [
      { id: "preview-stock-1", title: "Trauma dressing", subtitle: "issued · qty 4", href: "/consumables/preview-1?preview=1" },
      { id: "preview-stock-2", title: "Saline", subtitle: "received · qty 12", href: "/consumables/preview-2?preview=1" },
    ],
    registrationInsuranceExpiry: 2,
    role: "user",
    totalAssets: 17,
    totalConsumableStock: 4280,
    upcomingMaintenance: 2,
    overdueMaintenance: 1,
  };
}

type DashboardDependencies = {
  listAssets: typeof listAssets;
  listPlantDetails: typeof listPlantDetails;
  listRecentAssetMovements: typeof listRecentAssetMovements;
  listConsumableBatches: typeof listConsumableBatches;
  listConsumableItems: typeof listConsumableItems;
  listRecentStockMovements: typeof listRecentStockMovements;
  listStockThresholds: typeof listStockThresholds;
  listDeployments: typeof listDeployments;
  listMaintenanceSchedules: typeof listMaintenanceSchedules;
};

const defaultDependencies: DashboardDependencies = {
  listAssets,
  listPlantDetails,
  listRecentAssetMovements,
  listConsumableBatches,
  listConsumableItems,
  listRecentStockMovements,
  listStockThresholds,
  listDeployments,
  listMaintenanceSchedules,
};

export function aggregateAssetsByStatus(assets: AssetRow[]) {
  const counts = new Map<string, number>();

  for (const asset of assets) {
    if (asset.archived_at) {
      continue;
    }

    counts.set(asset.status, (counts.get(asset.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, count]) => ({
      status,
      count,
      label: status.replaceAll("_", " "),
      href: `/assets?status=${status}`,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function countMaintenanceAlerts(
  schedules: MaintenanceScheduleRow[],
  assetsById: Map<string, AssetRow>,
  plantByAssetId: Map<string, PlantDetailsRow>,
) {
  const counts: Record<MaintenanceAlertState, number> = {
    not_due: 0,
    due_soon: 0,
    overdue: 0,
  };

  for (const schedule of schedules) {
    const asset = assetsById.get(schedule.asset_id);
    const plant = asset ? plantByAssetId.get(asset.id) : undefined;
    const currentReading = plant?.odometer_reading ?? plant?.hour_meter_reading ?? null;
    const state = getScheduleAlertState(schedule, currentReading);
    counts[state] += 1;
  }

  return counts;
}

export function countPlantExpiryAlerts(plantDetails: PlantDetailsRow[]) {
  return plantDetails.reduce(
    (total, details) =>
      total +
      getPlantExpiryAlerts(details)
        .filter((alert) => alert.status === "due_soon" || alert.status === "overdue").length,
    0,
  );
}

export function countAssetsOverdueForReturn(deployments: DeploymentRow[], now = new Date()) {
  return deployments.filter((deployment) => {
    if (deployment.status !== "active" || !deployment.expected_return_datetime) {
      return false;
    }

    return new Date(deployment.expected_return_datetime).getTime() < now.getTime();
  }).length;
}

export function buildRecentAssetMovementItems(
  movements: AssetMovementRow[],
  assetsById: Map<string, AssetRow>,
) {
  return movements.map((movement) => {
    const asset = assetsById.get(movement.asset_id);

    return {
      id: movement.id,
      title: asset?.asset_name ?? asset?.unique_asset_id ?? "Unknown asset",
      subtitle: `${movement.reason} · ${movement.to_status.replaceAll("_", " ")}`,
      href: `/assets/${movement.asset_id}`,
    };
  });
}

export function buildRecentStockMovementItems(
  movements: StockMovementRow[],
  batchesById: Map<string, ConsumableBatchRow>,
  itemsById: Map<string, ConsumableItemRow>,
) {
  return movements.map((movement) => {
    const batch = batchesById.get(movement.consumable_batch_id);
    const item = batch ? itemsById.get(batch.item_id) : undefined;

    return {
      id: movement.id,
      title: item?.name ?? batch?.batch_lot_number ?? "Unknown batch",
      subtitle: `${movement.movement_type.replaceAll("_", " ")} · qty ${movement.quantity}`,
      href: batch ? `/consumables/${batch.id}` : "/consumables",
    };
  });
}

export async function getDashboardData(
  role: UserRole,
  dependencies: DashboardDependencies = defaultDependencies,
): Promise<DashboardData> {
  if (dependencies === defaultDependencies && !getPublicEnvStatus().configured) {
    return {
      activeDeployments: 0,
      assetStatusSummary: [],
      assetsOverdueForReturn: 0,
      errorMessage: null,
      hasOperationalData: false,
      lowStockItems: 0,
      metrics: [],
      outOfStockItems: 0,
      recentAssetMovements: [],
      recentStockMovements: [],
      registrationInsuranceExpiry: 0,
      role,
      totalAssets: 0,
      totalConsumableStock: 0,
      upcomingMaintenance: 0,
      overdueMaintenance: 0,
    };
  }

  try {
    const [
      assets,
      plantDetails,
      recentAssetMovements,
      consumableBatches,
      consumableItems,
      recentStockMovements,
      stockThresholds,
      deployments,
      schedules,
    ] = await Promise.all([
      dependencies.listAssets({}, role),
      dependencies.listPlantDetails(),
      dependencies.listRecentAssetMovements(8),
      dependencies.listConsumableBatches({}, role),
      dependencies.listConsumableItems(false, role),
      dependencies.listRecentStockMovements(8),
      dependencies.listStockThresholds(),
      dependencies.listDeployments(),
      dependencies.listMaintenanceSchedules(),
    ]);

    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const plantByAssetId = new Map(plantDetails.map((details) => [details.asset_id, details]));
    const batchesById = new Map(consumableBatches.map((batch) => [batch.id, batch]));
    const itemsById = new Map(consumableItems.map((item) => [item.id, item]));

    const stockAlerts = buildStockAlerts(stockThresholds, consumableBatches);
    const lowStockItems = stockAlerts.filter((alert) => alert.status === "low_stock").length;
    const outOfStockItems = stockAlerts.filter((alert) => alert.status === "out_of_stock").length;
    const maintenanceCounts = countMaintenanceAlerts(schedules, assetsById, plantByAssetId);
    const activeDeployments = deployments.filter((deployment) => deployment.status === "active").length;
    const overdueReturnCount = countAssetsOverdueForReturn(deployments);
    const totalConsumableStock = consumableBatches.reduce(
      (total, batch) => total + calculateBatchValue(batch.quantity_on_hand, batch.unit_cost),
      0,
    );
    const assetStatusSummary = aggregateAssetsByStatus(assets);
    const registrationInsuranceExpiry = countPlantExpiryAlerts(plantDetails);
    const totalAssets = assets.filter((asset) => !asset.archived_at).length;
    const hasOperationalData =
      totalAssets > 0 || consumableBatches.length > 0 || deployments.length > 0 || schedules.length > 0;

    const metrics: DashboardMetric[] = [
      {
        label: "Total Assets",
        value: String(totalAssets),
        description: "All active assets in the register.",
        href: "/assets",
      },
      {
        label: "Assets by Status",
        value: `${assetStatusSummary.length}`,
        description:
          assetStatusSummary.length > 0
            ? assetStatusSummary
                .slice(0, 2)
                .map((item) => `${item.label}: ${item.count}`)
                .join(" · ")
            : "No asset statuses recorded yet.",
        href: "/assets",
      },
      {
        label: "Total Consumable Stock",
        value: new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
          maximumFractionDigits: 0,
        }).format(totalConsumableStock),
        description: "Current on-hand consumable stock value.",
        href: "/consumables",
      },
      {
        label: "Low Stock Items",
        value: String(lowStockItems),
        description: "Threshold alerts that need replenishment soon.",
        href: "/consumables?alert=low-stock",
        tone: lowStockItems > 0 ? "alert" : "default",
      },
      {
        label: "Out-of-Stock Items",
        value: String(outOfStockItems),
        description: "Threshold alerts with no stock remaining.",
        href: "/consumables?alert=out-of-stock",
        tone: outOfStockItems > 0 ? "alert" : "default",
      },
      {
        label: "Upcoming Maintenance",
        value: String(maintenanceCounts.due_soon),
        description: "Schedules approaching their reminder window.",
        href: "/maintenance?alert=due-soon",
        tone: maintenanceCounts.due_soon > 0 ? "alert" : "default",
      },
      {
        label: "Overdue Maintenance",
        value: String(maintenanceCounts.overdue),
        description: "Schedules that have passed due date or reading.",
        href: "/maintenance?alert=overdue",
        tone: maintenanceCounts.overdue > 0 ? "alert" : "default",
      },
      {
        label: "Registration/Insurance Expiry",
        value: String(registrationInsuranceExpiry),
        description: "Plant and fleet expiry alerts in the next 30 days or overdue.",
        href: "/maintenance?alert=expiry",
        tone: registrationInsuranceExpiry > 0 ? "alert" : "default",
      },
      {
        label: "Active Deployments",
        value: String(activeDeployments),
        description: "Deployments currently in the field.",
        href: "/deployments?status=active",
        tone: activeDeployments > 0 ? "alert" : "default",
      },
      {
        label: "Assets Overdue for Return",
        value: String(overdueReturnCount),
        description: "Active deployments past expected return.",
        href: "/deployments?status=active&overdueReturn=1",
        tone: overdueReturnCount > 0 ? "alert" : "default",
      },
    ];

    return {
      activeDeployments,
      assetStatusSummary,
      assetsOverdueForReturn: overdueReturnCount,
      errorMessage: null,
      hasOperationalData,
      lowStockItems,
      metrics,
      outOfStockItems,
      recentAssetMovements: buildRecentAssetMovementItems(recentAssetMovements, assetsById),
      recentStockMovements: buildRecentStockMovementItems(
        recentStockMovements,
        batchesById,
        itemsById,
      ),
      registrationInsuranceExpiry,
      role,
      totalAssets,
      totalConsumableStock,
      upcomingMaintenance: maintenanceCounts.due_soon,
      overdueMaintenance: maintenanceCounts.overdue,
    };
  } catch {
    return {
      activeDeployments: 0,
      assetStatusSummary: [],
      assetsOverdueForReturn: 0,
      errorMessage: "The dashboard could not load operational data right now.",
      hasOperationalData: false,
      lowStockItems: 0,
      metrics: [],
      outOfStockItems: 0,
      recentAssetMovements: [],
      recentStockMovements: [],
      registrationInsuranceExpiry: 0,
      role,
      totalAssets: 0,
      totalConsumableStock: 0,
      upcomingMaintenance: 0,
      overdueMaintenance: 0,
    };
  }
}
