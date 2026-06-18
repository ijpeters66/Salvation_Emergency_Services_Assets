import type { AuditLogInput } from "@/lib/audit-log";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type StockThresholdRow = Database["public"]["Tables"]["stock_threshold"]["Row"];
export type StockThresholdInsert = Database["public"]["Tables"]["stock_threshold"]["Insert"];

export type ThresholdStatus = "normal" | "low_stock" | "out_of_stock";

export type StockThresholdDependencies = {
  upsertThreshold(payload: StockThresholdInsert): Promise<AppResult<StockThresholdRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function getThresholdStatus(
  currentQuantity: number,
  minimumQuantity: number,
): ThresholdStatus {
  if (currentQuantity <= 0) {
    return "out_of_stock";
  }

  if (currentQuantity <= minimumQuantity) {
    return "low_stock";
  }

  return "normal";
}

export function aggregateCurrentStockByItemLocation(batches: ConsumableBatchRow[]) {
  const totals = new Map<string, number>();

  for (const batch of batches) {
    if (batch.archived_at) {
      continue;
    }

    const key = `${batch.item_id}:${batch.location_id}`;
    totals.set(key, (totals.get(key) ?? 0) + batch.quantity_on_hand);
  }

  return totals;
}

export function buildStockAlerts(thresholds: StockThresholdRow[], batches: ConsumableBatchRow[]) {
  const totals = aggregateCurrentStockByItemLocation(batches);

  return thresholds.map((threshold) => {
    const currentQuantity =
      totals.get(`${threshold.consumable_item_id}:${threshold.location_id}`) ?? 0;

    return {
      threshold,
      currentQuantity,
      status: getThresholdStatus(currentQuantity, threshold.minimum_quantity),
    };
  });
}

export async function upsertStockThresholdRecord(
  dependencies: StockThresholdDependencies,
  input: {
    consumableItemId: string;
    locationId: string;
    minimumQuantity: number;
    userId: string;
  },
) {
  const result = await dependencies.upsertThreshold({
    consumable_item_id: input.consumableItemId,
    location_id: input.locationId,
    minimum_quantity: input.minimumQuantity,
    created_by: input.userId,
    updated_by: input.userId,
  });

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "stock.threshold.upsert",
    recordType: "stock_threshold",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}
