import { z } from "zod";

import {
  formatAuditAction,
  formatAuditRecordType,
  formatAuditTimestamp,
} from "@/lib/audit";
import { getThresholdStatus } from "@/lib/consumables/thresholds";
import type { Database } from "@/lib/database.types";
import { assetStatusLabels } from "@/lib/assets/validation";
import { deploymentStatusLabels } from "@/lib/deployments/service";
import { getScheduleAlertState } from "@/lib/maintenance/schedules";
import {
  reportExportFormats,
  type ReportExportFormat,
} from "@/lib/reports/export";

type AssetRow = Database["public"]["Tables"]["asset"]["Row"];
type AssetCategoryRow = Database["public"]["Tables"]["asset_category"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];
type ConsumableBatchRow = Database["public"]["Tables"]["consumable_batch"]["Row"];
type ConsumableCategoryRow = Database["public"]["Tables"]["consumable_category"]["Row"];
type ConsumableItemRow = Database["public"]["Tables"]["consumable_item"]["Row"];
type DeploymentAssetRow = Database["public"]["Tables"]["deployment_asset"]["Row"];
type DeploymentConsumableRow = Database["public"]["Tables"]["deployment_consumable"]["Row"];
type DeploymentRow = Database["public"]["Tables"]["deployment"]["Row"];
type LocationRow = Database["public"]["Tables"]["location"]["Row"];
type MaintenanceScheduleRow = Database["public"]["Tables"]["maintenance_schedule"]["Row"];
type PlantDetailsRow = Database["public"]["Tables"]["plant_details"]["Row"];
type StockMovementRow = Database["public"]["Tables"]["stock_movement"]["Row"];
type StockThresholdRow = Database["public"]["Tables"]["stock_threshold"]["Row"];

export const reportIds = [
  "asset-register",
  "asset-value",
  "assets-by-location",
  "assets-by-status",
  "inventory-report",
  "consumables-by-location",
  "low-stock-report",
  "stock-movement-report",
  "maintenance-due-report",
  "deployment-history",
  "audit-trail-report",
] as const;

export type ReportId = (typeof reportIds)[number];

export type ReportDefinition = {
  id: ReportId;
  title: string;
  description: string;
  relatedHref: string;
  requiresAdmin?: boolean;
};

export const reportDefinitions: readonly ReportDefinition[] = [
  {
    id: "asset-register",
    title: "Asset Register",
    description: "Full asset register with category, location, status, values, and QR references.",
    relatedHref: "/assets",
  },
  {
    id: "asset-value",
    title: "Asset Value",
    description: "Asset values by item for replacement planning and financial review.",
    relatedHref: "/assets",
  },
  {
    id: "assets-by-location",
    title: "Assets by Location",
    description: "Grouped asset counts and value totals by site or vehicle location.",
    relatedHref: "/assets",
  },
  {
    id: "assets-by-status",
    title: "Assets by Status",
    description: "Grouped asset counts and value totals by operational status.",
    relatedHref: "/assets",
  },
  {
    id: "inventory-report",
    title: "Inventory Report",
    description: "Consumable batches with quantities, expiry dates, values, and traceability.",
    relatedHref: "/consumables",
  },
  {
    id: "consumables-by-location",
    title: "Consumables by Location",
    description: "Consumable stock balances by location, item, threshold, and alert state.",
    relatedHref: "/consumables",
  },
  {
    id: "low-stock-report",
    title: "Low Stock Report",
    description: "Threshold-based low-stock and out-of-stock consumable alerts.",
    relatedHref: "/consumables?alert=low-stock",
  },
  {
    id: "stock-movement-report",
    title: "Stock Movement Report",
    description: "Consumable stock movement history across receipts, issues, and transfers.",
    relatedHref: "/consumables",
  },
  {
    id: "maintenance-due-report",
    title: "Maintenance Due Report",
    description: "Due soon and overdue maintenance schedules for plant, fleet, and equipment.",
    relatedHref: "/maintenance",
  },
  {
    id: "deployment-history",
    title: "Deployment History",
    description: "Deployment history with status, dates, and assigned asset or consumable counts.",
    relatedHref: "/deployments",
  },
  {
    id: "audit-trail-report",
    title: "Audit Trail Report",
    description: "Admin-only export of system activity for compliance and troubleshooting.",
    relatedHref: "/audit",
    requiresAdmin: true,
  },
] as const;

const reportFilterSchema = z
  .object({
    reportId: z.enum(reportIds).default("asset-register"),
    locationId: z.string().trim().default(""),
    categoryId: z.string().trim().default(""),
    status: z.string().trim().default(""),
    dateFrom: z.string().trim().default(""),
    dateTo: z.string().trim().default(""),
    preparedBy: z.string().trim().default(""),
    preview: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.dateFrom || !value.dateTo) {
      return;
    }

    const start = new Date(`${value.dateFrom}T00:00:00.000Z`);
    const end = new Date(`${value.dateTo}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "Enter valid report dates.",
      });
      return;
    }

    if (start.getTime() > end.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "Date from cannot be later than date to.",
      });
    }
  });

export type ReportFilters = z.infer<typeof reportFilterSchema>;

export type ReportSnapshot = {
  assets: AssetRow[];
  assetCategories: AssetCategoryRow[];
  auditLogs: AuditLogRow[];
  consumableBatches: ConsumableBatchRow[];
  consumableCategories: ConsumableCategoryRow[];
  consumableItems: ConsumableItemRow[];
  deploymentAssets: DeploymentAssetRow[];
  deploymentConsumables: DeploymentConsumableRow[];
  deployments: DeploymentRow[];
  locations: LocationRow[];
  maintenanceSchedules: MaintenanceScheduleRow[];
  plantDetails: PlantDetailsRow[];
  stockMovements: StockMovementRow[];
  stockThresholds: StockThresholdRow[];
  users: Array<{ userId: string; label: string }>;
};

export type ReportRow = Record<string, string | number | null>;

export type BuiltReport = {
  definition: ReportDefinition;
  columns: string[];
  rows: ReportRow[];
  appliedFilters: string[];
};

export type ReportRequest = ReportFilters & {
  format: ReportExportFormat;
};

export function getReportDefinition(reportId: ReportId) {
  return reportDefinitions.find((report) => report.id === reportId) ?? reportDefinitions[0];
}

export function canAccessReport(reportId: ReportId, role: string) {
  const definition = getReportDefinition(reportId);
  return !definition.requiresAdmin || role === "system_admin";
}

function getParam(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
) {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseReportFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  return reportFilterSchema.safeParse({
    reportId: getParam(input, "reportId") ?? "asset-register",
    locationId: getParam(input, "locationId") ?? "",
    categoryId: getParam(input, "categoryId") ?? "",
    status: getParam(input, "status") ?? "",
    dateFrom: getParam(input, "dateFrom") ?? "",
    dateTo: getParam(input, "dateTo") ?? "",
    preparedBy: getParam(input, "preparedBy") ?? "",
    preview: getParam(input, "preview") === "1",
  });
}

export function parseReportRequest(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const filters = parseReportFilters(input);
  if (!filters.success) {
    return filters;
  }

  const rawFormat = getParam(input, "format") ?? "csv";
  const format = reportExportFormats.find((item) => item === rawFormat);
  if (!format) {
    return {
      success: false as const,
      error: {
        issues: [{ message: "Unsupported export format." }],
      },
    };
  }

  return {
    success: true as const,
    data: {
      ...filters.data,
      format,
    },
  };
}

function money(value: number | null) {
  if (value == null) {
    return "";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function inDateRange(value: string | null, filters: ReportFilters) {
  if (!value) {
    return !filters.dateFrom && !filters.dateTo;
  }

  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return true;
  }

  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`).getTime();
    if (target < from) {
      return false;
    }
  }

  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`).getTime();
    if (target > to) {
      return false;
    }
  }

  return true;
}

function buildFilterLabels(filters: ReportFilters, snapshot: ReportSnapshot, reportId: ReportId) {
  const locationById = new Map(snapshot.locations.map((location) => [location.id, location.name]));
  const assetCategoryById = new Map(
    snapshot.assetCategories.map((category) => [category.id, category.name]),
  );
  const consumableCategoryById = new Map(
    snapshot.consumableCategories.map((category) => [category.id, category.name]),
  );
  const labels: string[] = [];

  if (filters.locationId) {
    labels.push(`Location: ${locationById.get(filters.locationId) ?? filters.locationId}`);
  }

  if (filters.categoryId) {
    const categoryLabel =
      reportId.startsWith("asset")
        ? assetCategoryById.get(filters.categoryId)
        : consumableCategoryById.get(filters.categoryId) ??
          assetCategoryById.get(filters.categoryId);
    labels.push(`Category: ${categoryLabel ?? filters.categoryId}`);
  }

  if (filters.status) {
    const statusLabel =
      assetStatusLabels[filters.status as keyof typeof assetStatusLabels] ??
      deploymentStatusLabels[filters.status as keyof typeof deploymentStatusLabels] ??
      filters.status.replaceAll("_", " ");
    labels.push(`Status: ${statusLabel}`);
  }

  if (filters.dateFrom) {
    labels.push(`Date from: ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    labels.push(`Date to: ${filters.dateTo}`);
  }

  return labels;
}

function buildAssetFilters(filters: ReportFilters) {
  return (asset: AssetRow) =>
    (!filters.locationId || asset.current_location_id === filters.locationId) &&
    (!filters.categoryId || asset.category_id === filters.categoryId) &&
    (!filters.status || asset.status === filters.status);
}

function buildConsumableFilters(
  filters: ReportFilters,
  snapshot: ReportSnapshot,
  requireThresholdAlert = false,
) {
  const itemById = new Map(snapshot.consumableItems.map((item) => [item.id, item]));
  const thresholdByKey = new Map(
    snapshot.stockThresholds.map((threshold) => [
      `${threshold.consumable_item_id}:${threshold.location_id}`,
      threshold,
    ]),
  );

  return (batch: ConsumableBatchRow) => {
    const item = itemById.get(batch.item_id);
    if (!item) {
      return false;
    }

    if (filters.locationId && batch.location_id !== filters.locationId) {
      return false;
    }

    if (filters.categoryId && item.category_id !== filters.categoryId) {
      return false;
    }

    if (!inDateRange(batch.date_received, filters)) {
      return false;
    }

    if (!filters.status) {
      return true;
    }

    const threshold = thresholdByKey.get(`${batch.item_id}:${batch.location_id}`);
    const stockStatus =
      threshold == null
        ? "normal"
        : getThresholdStatus(batch.quantity_on_hand, threshold.minimum_quantity);

    if (requireThresholdAlert && stockStatus === "normal") {
      return false;
    }

    return stockStatus === filters.status;
  };
}

function buildLocationHref(path: string, filters: ReportFilters) {
  const params = new URLSearchParams();

  if (filters.locationId) {
    params.set("locationId", filters.locationId);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.preview) {
    params.set("preview", "1");
  }

  const query = params.toString();
  return query ? `${path}${path.includes("?") ? "&" : "?"}${query}` : path;
}

export function getRelatedReportHref(reportId: ReportId, filters: ReportFilters) {
  switch (reportId) {
    case "low-stock-report":
      return buildLocationHref("/consumables?alert=low-stock", filters);
    case "maintenance-due-report":
      return buildLocationHref("/maintenance", filters);
    case "audit-trail-report":
      return buildLocationHref("/audit", filters);
    default:
      return buildLocationHref(getReportDefinition(reportId).relatedHref, filters);
  }
}

export function buildReport(snapshot: ReportSnapshot, filters: ReportFilters): BuiltReport {
  const definition = getReportDefinition(filters.reportId);
  const locationById = new Map(snapshot.locations.map((location) => [location.id, location.name]));
  const assetCategoryById = new Map(
    snapshot.assetCategories.map((category) => [category.id, category.name]),
  );
  const consumableItemById = new Map(
    snapshot.consumableItems.map((item) => [item.id, item]),
  );
  const consumableCategoryById = new Map(
    snapshot.consumableCategories.map((category) => [category.id, category.name]),
  );
  const deploymentById = new Map(snapshot.deployments.map((deployment) => [deployment.id, deployment]));
  const assetById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const plantByAssetId = new Map(
    snapshot.plantDetails.map((details) => [details.asset_id, details]),
  );
  const thresholdByKey = new Map(
    snapshot.stockThresholds.map((threshold) => [
      `${threshold.consumable_item_id}:${threshold.location_id}`,
      threshold,
    ]),
  );
  const userById = new Map(snapshot.users.map((user) => [user.userId, user.label]));
  const assetRows = snapshot.assets.filter(buildAssetFilters(filters));
  const consumableRows = snapshot.consumableBatches.filter(buildConsumableFilters(filters, snapshot));
  const appliedFilters = buildFilterLabels(filters, snapshot, filters.reportId);

  switch (filters.reportId) {
    case "asset-register":
      return {
        definition,
        appliedFilters,
        columns: [
          "Asset",
          "Asset ID",
          "Category",
          "Location",
          "Status",
          "Serial Number",
          "Current Value",
          "QR Code",
        ],
        rows: assetRows.map((asset) => ({
          Asset: asset.asset_name,
          "Asset ID": asset.unique_asset_id,
          Category: assetCategoryById.get(asset.category_id) ?? asset.category_id,
          Location: locationById.get(asset.current_location_id) ?? asset.current_location_id,
          Status:
            assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ?? asset.status,
          "Serial Number": asset.serial_number,
          "Current Value": money(asset.current_value),
          "QR Code": asset.qr_code_value,
        })),
      };

    case "asset-value":
      return {
        definition,
        appliedFilters,
        columns: [
          "Asset",
          "Category",
          "Location",
          "Status",
          "Purchase Cost",
          "Replacement Value",
          "Current Value",
        ],
        rows: assetRows.map((asset) => ({
          Asset: asset.asset_name,
          Category: assetCategoryById.get(asset.category_id) ?? asset.category_id,
          Location: locationById.get(asset.current_location_id) ?? asset.current_location_id,
          Status:
            assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ?? asset.status,
          "Purchase Cost": money(asset.purchase_cost),
          "Replacement Value": money(asset.replacement_value),
          "Current Value": money(asset.current_value),
        })),
      };

    case "assets-by-location": {
      const groups = new Map<
        string,
        { location: string; count: number; available: number; deployed: number; maintenance: number; value: number }
      >();

      for (const asset of assetRows) {
        const location = locationById.get(asset.current_location_id) ?? asset.current_location_id;
        const current = groups.get(location) ?? {
          location,
          count: 0,
          available: 0,
          deployed: 0,
          maintenance: 0,
          value: 0,
        };
        current.count += 1;
        current.value += asset.current_value ?? 0;
        if (asset.status === "available") current.available += 1;
        if (asset.status === "deployed") current.deployed += 1;
        if (asset.status === "under_maintenance") current.maintenance += 1;
        groups.set(location, current);
      }

      return {
        definition,
        appliedFilters,
        columns: [
          "Location",
          "Asset Count",
          "Available",
          "Deployed",
          "Under Maintenance",
          "Current Value Total",
        ],
        rows: Array.from(groups.values())
          .sort((left, right) => left.location.localeCompare(right.location))
          .map((group) => ({
            Location: group.location,
            "Asset Count": group.count,
            Available: group.available,
            Deployed: group.deployed,
            "Under Maintenance": group.maintenance,
            "Current Value Total": money(group.value),
          })),
      };
    }

    case "assets-by-status": {
      const groups = new Map<string, { status: string; count: number; value: number }>();

      for (const asset of assetRows) {
        const status =
          assetStatusLabels[asset.status as keyof typeof assetStatusLabels] ?? asset.status;
        const current = groups.get(status) ?? { status, count: 0, value: 0 };
        current.count += 1;
        current.value += asset.current_value ?? 0;
        groups.set(status, current);
      }

      return {
        definition,
        appliedFilters,
        columns: ["Status", "Asset Count", "Current Value Total"],
        rows: Array.from(groups.values())
          .sort((left, right) => left.status.localeCompare(right.status))
          .map((group) => ({
            Status: group.status,
            "Asset Count": group.count,
            "Current Value Total": money(group.value),
          })),
      };
    }

    case "inventory-report":
      return {
        definition,
        appliedFilters,
        columns: [
          "Item",
          "Category",
          "Location",
          "Batch/Lot",
          "Qty Received",
          "Qty On Hand",
          "Unit Cost",
          "Batch Value",
          "Date Received",
          "Expiry Date",
        ],
        rows: consumableRows.map((batch) => {
          const item = consumableItemById.get(batch.item_id);
          return {
            Item: item?.name ?? batch.item_id,
            Category: item ? consumableCategoryById.get(item.category_id) ?? item.category_id : "",
            Location: locationById.get(batch.location_id) ?? batch.location_id,
            "Batch/Lot": batch.batch_lot_number,
            "Qty Received": batch.quantity_received,
            "Qty On Hand": batch.quantity_on_hand,
            "Unit Cost": money(batch.unit_cost),
            "Batch Value": money((batch.unit_cost ?? 0) * batch.quantity_on_hand),
            "Date Received": batch.date_received,
            "Expiry Date": batch.expiry_date,
          };
        }),
      };

    case "consumables-by-location": {
      const groups = new Map<
        string,
        {
          location: string;
          item: string;
          category: string;
          quantityOnHand: number;
          minimumQuantity: number | null;
          stockStatus: string;
        }
      >();

      for (const batch of consumableRows) {
        const item = consumableItemById.get(batch.item_id);
        if (!item) continue;
        const threshold = thresholdByKey.get(`${batch.item_id}:${batch.location_id}`);
        const location = locationById.get(batch.location_id) ?? batch.location_id;
        const itemName = item.name;
        const key = `${location}:${itemName}`;
        const current = groups.get(key) ?? {
          location,
          item: itemName,
          category: consumableCategoryById.get(item.category_id) ?? item.category_id,
          quantityOnHand: 0,
          minimumQuantity: threshold?.minimum_quantity ?? null,
          stockStatus: threshold
            ? getThresholdStatus(batch.quantity_on_hand, threshold.minimum_quantity)
            : "normal",
        };
        current.quantityOnHand += batch.quantity_on_hand;
        if (threshold) {
          current.stockStatus = getThresholdStatus(
            current.quantityOnHand,
            threshold.minimum_quantity,
          );
        }
        groups.set(key, current);
      }

      return {
        definition,
        appliedFilters,
        columns: ["Location", "Item", "Category", "Qty On Hand", "Minimum Qty", "Stock Status"],
        rows: Array.from(groups.values())
          .sort((left, right) =>
            left.location === right.location
              ? left.item.localeCompare(right.item)
              : left.location.localeCompare(right.location),
          )
          .map((group) => ({
            Location: group.location,
            Item: group.item,
            Category: group.category,
            "Qty On Hand": group.quantityOnHand,
            "Minimum Qty": group.minimumQuantity,
            "Stock Status": group.stockStatus.replaceAll("_", " "),
          })),
      };
    }

    case "low-stock-report": {
      const alerts = snapshot.stockThresholds
        .map((threshold) => {
          const item = consumableItemById.get(threshold.consumable_item_id);
          if (!item) return null;
          if (filters.locationId && threshold.location_id !== filters.locationId) return null;
          if (filters.categoryId && item.category_id !== filters.categoryId) return null;
          const quantityOnHand = snapshot.consumableBatches
            .filter(
              (batch) =>
                batch.item_id === threshold.consumable_item_id &&
                batch.location_id === threshold.location_id &&
                !batch.archived_at,
            )
            .reduce((sum, batch) => sum + batch.quantity_on_hand, 0);
          const alertStatus = getThresholdStatus(quantityOnHand, threshold.minimum_quantity);
          if (alertStatus === "normal") return null;
          if (filters.status && alertStatus !== filters.status) return null;
          return {
            item,
            threshold,
            quantityOnHand,
            alertStatus,
          };
        })
        .filter((value): value is NonNullable<typeof value> => value != null);

      return {
        definition,
        appliedFilters,
        columns: ["Item", "Category", "Location", "Qty On Hand", "Minimum Qty", "Alert Status"],
        rows: alerts.map((alert) => ({
          Item: alert.item.name,
          Category:
            consumableCategoryById.get(alert.item.category_id) ?? alert.item.category_id,
          Location: locationById.get(alert.threshold.location_id) ?? alert.threshold.location_id,
          "Qty On Hand": alert.quantityOnHand,
          "Minimum Qty": alert.threshold.minimum_quantity,
          "Alert Status": alert.alertStatus.replaceAll("_", " "),
        })),
      };
    }

    case "stock-movement-report": {
      const rows = snapshot.stockMovements
        .filter((movement) => {
          const batch = snapshot.consumableBatches.find(
            (candidate) => candidate.id === movement.consumable_batch_id,
          );
          if (!batch) return false;
          const item = consumableItemById.get(batch.item_id);
          if (!item) return false;
          if (filters.locationId) {
            const matchesLocation =
              movement.from_location_id === filters.locationId ||
              movement.to_location_id === filters.locationId ||
              batch.location_id === filters.locationId;
            if (!matchesLocation) return false;
          }
          if (filters.categoryId && item.category_id !== filters.categoryId) return false;
          return inDateRange(movement.created_at, filters);
        })
        .map((movement) => {
          const batch = snapshot.consumableBatches.find(
            (candidate) => candidate.id === movement.consumable_batch_id,
          )!;
          const item = consumableItemById.get(batch.item_id)!;
          const deployment = movement.related_deployment_id
            ? deploymentById.get(movement.related_deployment_id)
            : null;
          return {
            Date: formatDate(movement.created_at),
            "Movement Type": movement.movement_type,
            Item: item.name,
            Category: consumableCategoryById.get(item.category_id) ?? item.category_id,
            "Batch/Lot": batch.batch_lot_number,
            Quantity: movement.quantity,
            From: movement.from_location_id
              ? locationById.get(movement.from_location_id) ?? movement.from_location_id
              : "",
            To: movement.to_location_id
              ? locationById.get(movement.to_location_id) ?? movement.to_location_id
              : "",
            Reason: movement.reason,
            Deployment: deployment?.deployment_name ?? "",
            Notes: movement.notes,
          };
        });

      return {
        definition,
        appliedFilters,
        columns: [
          "Date",
          "Movement Type",
          "Item",
          "Category",
          "Batch/Lot",
          "Quantity",
          "From",
          "To",
          "Reason",
          "Deployment",
          "Notes",
        ],
        rows,
      };
    }

    case "maintenance-due-report": {
      const rows = snapshot.maintenanceSchedules
        .map((schedule) => {
          const asset = assetById.get(schedule.asset_id);
          if (!asset) return null;
          if (!buildAssetFilters(filters)(asset)) return null;
          if (filters.dateFrom || filters.dateTo) {
            if (!inDateRange(schedule.next_service_due_date, filters)) {
              return null;
            }
          }
          const plantDetails = plantByAssetId.get(schedule.asset_id);
          const currentReading =
            plantDetails?.odometer_reading ?? plantDetails?.hour_meter_reading ?? null;
          const alertState = getScheduleAlertState(schedule, currentReading);
          if (alertState === "not_due") return null;
          if (filters.status && alertState !== filters.status) return null;
          return {
            Asset: asset.asset_name,
            "Asset ID": asset.unique_asset_id,
            Location: locationById.get(asset.current_location_id) ?? asset.current_location_id,
            "Maintenance Type": schedule.maintenance_type,
            "Due Date": schedule.next_service_due_date,
            "Due Reading": schedule.next_service_due_reading,
            "Current Reading": currentReading,
            Provider: schedule.service_provider,
            Status: alertState.replaceAll("_", " "),
          };
        })
        .filter((value): value is NonNullable<typeof value> => value != null);

      return {
        definition,
        appliedFilters,
        columns: [
          "Asset",
          "Asset ID",
          "Location",
          "Maintenance Type",
          "Due Date",
          "Due Reading",
          "Current Reading",
          "Provider",
          "Status",
        ],
        rows,
      };
    }

    case "deployment-history": {
      const assetCountByDeploymentId = new Map<string, number>();
      const consumableCountByDeploymentId = new Map<string, number>();

      for (const row of snapshot.deploymentAssets) {
        assetCountByDeploymentId.set(
          row.deployment_id,
          (assetCountByDeploymentId.get(row.deployment_id) ?? 0) + 1,
        );
      }

      for (const row of snapshot.deploymentConsumables) {
        consumableCountByDeploymentId.set(
          row.deployment_id,
          (consumableCountByDeploymentId.get(row.deployment_id) ?? 0) + row.quantity,
        );
      }

      const rows = snapshot.deployments
        .filter((deployment) => {
          if (filters.status && deployment.status !== filters.status) return false;
          return inDateRange(deployment.start_datetime, filters);
        })
        .map((deployment) => ({
          "Deployment ID": deployment.deployment_id,
          Deployment: deployment.deployment_name,
          Purpose: deployment.purpose_reason,
          Location: deployment.deployment_location_site,
          Team: deployment.team_name,
          Start: formatDate(deployment.start_datetime),
          "Expected Return": formatDate(deployment.expected_return_datetime),
          "Actual Return": formatDate(deployment.actual_return_datetime),
          Status:
            deploymentStatusLabels[deployment.status as keyof typeof deploymentStatusLabels] ??
            deployment.status,
          "Assigned Assets": assetCountByDeploymentId.get(deployment.id) ?? 0,
          "Consumables Issued": consumableCountByDeploymentId.get(deployment.id) ?? 0,
        }));

      return {
        definition,
        appliedFilters,
        columns: [
          "Deployment ID",
          "Deployment",
          "Purpose",
          "Location",
          "Team",
          "Start",
          "Expected Return",
          "Actual Return",
          "Status",
          "Assigned Assets",
          "Consumables Issued",
        ],
        rows,
      };
    }

    case "audit-trail-report":
      return {
        definition,
        appliedFilters,
        columns: [
          "When",
          "User",
          "Action",
          "Record Type",
          "Record ID",
          "Device Source",
          "Offline Sync Reference",
        ],
        rows: snapshot.auditLogs
          .filter((entry) => {
            if (filters.status) return false;
            return inDateRange(entry.created_at, filters);
          })
          .map((entry) => ({
            When: formatAuditTimestamp(entry.created_at),
            User: userById.get(entry.user_id) ?? `User ${entry.user_id.slice(0, 8)}`,
            Action: formatAuditAction(entry.action_type),
            "Record Type": formatAuditRecordType(entry.record_type),
            "Record ID": entry.record_id,
            "Device Source": entry.device_source,
            "Offline Sync Reference": entry.offline_sync_reference,
          })),
      };
  }
}

export function escapeCsvValue(value: string | number | null | undefined) {
  const safeValue = value == null ? "" : String(value);
  if (!/[",\n]/.test(safeValue)) {
    return safeValue;
  }

  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function toCsvString(report: BuiltReport, metadata: {
  generatedAt: string;
  preparedBy: string;
}) {
  const lines = [
    ["Report Title", report.definition.title],
    ["Generated At", metadata.generatedAt],
    ["Prepared By", metadata.preparedBy],
    ["Filters Applied", report.appliedFilters.length > 0 ? report.appliedFilters.join("; ") : "None"],
    [],
    report.columns,
    ...report.rows.map((row) => report.columns.map((column) => row[column] ?? "")),
  ];

  return lines
    .map((line) => line.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export function buildExportHref(
  filters: ReportFilters,
  reportId: ReportId,
  format: ReportExportFormat = "csv",
) {
  const params = new URLSearchParams();
  params.set("reportId", reportId);
  params.set("format", format);

  if (filters.locationId) params.set("locationId", filters.locationId);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.preparedBy) params.set("preparedBy", filters.preparedBy);
  if (filters.preview) params.set("preview", "1");

  return `/reports/export?${params.toString()}`;
}

export function buildReportFilename(reportId: ReportId, date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `${reportId}-${stamp}`;
}

export function buildPreviewReportSnapshot(): ReportSnapshot {
  return {
    assetCategories: [
      {
        id: "asset-cat-1",
        name: "Vehicles",
        description: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "asset-cat-2",
        name: "Field Equipment",
        description: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    assets: [
      {
        id: "asset-1",
        unique_asset_id: "VEH-001",
        qr_code_value: "SAES-ASSET:VEH-001",
        asset_name: "Support Vehicle 1",
        category_id: "asset-cat-1",
        description: null,
        serial_number: "SV001",
        make: "Toyota",
        model: "HiAce",
        purchase_date: "2025-01-10",
        purchase_cost: 48000,
        replacement_value: 52000,
        current_value: 45000,
        current_location_id: "loc-1",
        status: "available",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "asset-2",
        unique_asset_id: "EQP-014",
        qr_code_value: "SAES-ASSET:EQP-014",
        asset_name: "Portable Generator",
        category_id: "asset-cat-2",
        description: null,
        serial_number: "GEN014",
        make: "Honda",
        model: "EU70is",
        purchase_date: "2025-06-01",
        purchase_cost: 7200,
        replacement_value: 7800,
        current_value: 6800,
        current_location_id: "loc-2",
        status: "deployed",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    auditLogs: [
      {
        id: "audit-1",
        user_id: "user-1",
        action_type: "asset.create",
        record_type: "asset",
        record_id: "asset-1",
        old_value: null,
        new_value: { status: "available" },
        device_source: "web",
        offline_sync_reference: null,
        created_at: "2026-06-25T09:15:00.000Z",
      },
    ],
    consumableBatches: [
      {
        id: "batch-1",
        item_id: "cons-1",
        batch_lot_number: "LOT-ALPHA",
        quantity_received: 12,
        quantity_on_hand: 2,
        unit_cost: 18,
        replacement_cost: 22,
        date_received: "2026-06-10",
        supplier_donor: "Preview Medical",
        expiry_date: "2027-01-01",
        location_id: "loc-1",
        qr_code_value: "SAES-CONSUMABLE:LOT-ALPHA",
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "batch-2",
        item_id: "cons-2",
        batch_lot_number: "LOT-BRAVO",
        quantity_received: 20,
        quantity_on_hand: 0,
        unit_cost: 5,
        replacement_cost: 6,
        date_received: "2026-06-12",
        supplier_donor: "Preview Medical",
        expiry_date: "2027-02-01",
        location_id: "loc-2",
        qr_code_value: "SAES-CONSUMABLE:LOT-BRAVO",
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    consumableCategories: [
      {
        id: "cons-cat-1",
        name: "Medical",
        description: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    consumableItems: [
      {
        id: "cons-1",
        name: "Trauma Dressing",
        category_id: "cons-cat-1",
        description: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "cons-2",
        name: "Saline",
        category_id: "cons-cat-1",
        description: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    deploymentAssets: [
      {
        id: "deploy-asset-1",
        deployment_id: "dep-1",
        asset_id: "asset-2",
        checked_out_at: "2026-06-24T07:30:00.000Z",
        checked_in_at: null,
        checked_out_by: "user-1",
        checked_in_by: null,
        notes: null,
      },
    ],
    deploymentConsumables: [
      {
        id: "deploy-cons-1",
        deployment_id: "dep-1",
        consumable_batch_id: "batch-1",
        stock_movement_id: "move-1",
        quantity: 4,
        issued_at: "2026-06-24T07:45:00.000Z",
        issued_by: "user-1",
      },
    ],
    deployments: [
      {
        id: "dep-1",
        deployment_id: "DEP-100",
        deployment_name: "Flood Response",
        purpose_reason: "Regional support",
        deployment_location_site: "Hamilton",
        team_name: "Operations",
        team_leader: "Alex",
        contact_number: null,
        start_datetime: "2026-06-24T07:00:00.000Z",
        expected_return_datetime: "2026-06-26T17:00:00.000Z",
        actual_return_datetime: null,
        status: "active",
        notes: null,
        damage_fault_notes: null,
        created_by: "preview",
        created_at: "",
        updated_at: "",
      },
    ],
    locations: [
      {
        id: "loc-1",
        name: "Ballarat Depot",
        type: "warehouse",
        address: null,
        state: "Victoria",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "loc-2",
        name: "Hamilton Truck",
        type: "vehicle",
        address: null,
        state: "Victoria",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    maintenanceSchedules: [
      {
        id: "maint-1",
        asset_id: "asset-2",
        maintenance_type: "Annual service",
        service_interval_date: 365,
        service_interval_odometer: null,
        service_interval_hours: null,
        next_service_due_date: "2026-06-27",
        next_service_due_reading: null,
        service_provider: "Preview Mechanical",
        reminder_threshold_days: 14,
        status: "active",
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    plantDetails: [
      {
        asset_id: "asset-2",
        registration_number: "ABC123",
        registration_expiry: null,
        insurance_expiry: null,
        roadworthy_compliance_date: null,
        odometer_reading: 9800,
        hour_meter_reading: null,
        fuel_type: "Diesel",
        service_provider: "Preview Mechanical",
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    stockMovements: [
      {
        id: "move-1",
        consumable_batch_id: "batch-1",
        movement_type: "issue",
        quantity: 4,
        from_location_id: "loc-1",
        to_location_id: "loc-2",
        reason: "Deployment issue",
        related_deployment_id: "dep-1",
        notes: null,
        created_by: "preview",
        created_at: "2026-06-24T07:45:00.000Z",
      },
    ],
    stockThresholds: [
      {
        id: "threshold-1",
        consumable_item_id: "cons-1",
        location_id: "loc-1",
        minimum_quantity: 4,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
      {
        id: "threshold-2",
        consumable_item_id: "cons-2",
        location_id: "loc-2",
        minimum_quantity: 3,
        created_at: "",
        updated_at: "",
        created_by: "preview",
        updated_by: "preview",
      },
    ],
    users: [{ userId: "user-1", label: "Preview Admin" }],
  };
}
