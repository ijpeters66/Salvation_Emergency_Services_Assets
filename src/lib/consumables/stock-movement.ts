import type { AuditLogInput } from "@/lib/audit-log";
import type { ConsumableBatchRow, ConsumableBatchUpdate } from "@/lib/consumables/service";
import type { Database } from "@/lib/database.types";
import type { StockMovementType } from "@/lib/domain-types";
import { isStockMovementType } from "@/lib/domain-types";
import { ok, type AppResult } from "@/lib/result";

export type StockMovementRow = Database["public"]["Tables"]["stock_movement"]["Row"];
export type StockMovementInsert = Database["public"]["Tables"]["stock_movement"]["Insert"];

export type StockMovementInput = {
  batch: ConsumableBatchRow;
  movementType: StockMovementType;
  quantity: number;
  fromLocationId: string | null;
  toLocationId: string | null;
  reason: string;
  relatedDeploymentId: string | null;
  notes: string | null;
  userId: string;
};

export type StockMovementDependencies = {
  insertStockMovement(payload: StockMovementInsert): Promise<AppResult<StockMovementRow>>;
  updateBatch(id: string, payload: ConsumableBatchUpdate): Promise<AppResult<ConsumableBatchRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export const stockMovementLabels: Record<StockMovementType, string> = {
  received: "Received",
  issued: "Issued",
  transferred: "Transferred",
  returned: "Returned",
  adjusted: "Adjusted",
  written_off: "Written off",
  stocktake_variance: "Stocktake variance",
};

const inboundMovementTypes = new Set<StockMovementType>(["received", "returned", "adjusted"]);
const outboundMovementTypes = new Set<StockMovementType>([
  "issued",
  "transferred",
  "written_off",
  "stocktake_variance",
]);

export function calculateNextQuantityOnHand(
  currentQuantity: number,
  movementType: StockMovementType,
  movementQuantity: number,
) {
  if (movementQuantity <= 0) {
    return {
      ok: false,
      error: "Movement quantity must be greater than zero.",
    } as const;
  }

  if (inboundMovementTypes.has(movementType)) {
    return ok(currentQuantity + movementQuantity);
  }

  if (outboundMovementTypes.has(movementType)) {
    const nextQuantity = currentQuantity - movementQuantity;

    if (nextQuantity < 0) {
      return {
        ok: false,
        error: "Stock movement would reduce quantity below zero.",
      } as const;
    }

    return ok(nextQuantity);
  }

  return {
    ok: false,
    error: "Unsupported stock movement type.",
  } as const;
}

export function buildStockMovementPayload(input: StockMovementInput): StockMovementInsert {
  return {
    consumable_batch_id: input.batch.id,
    movement_type: input.movementType,
    quantity: input.quantity,
    from_location_id: input.fromLocationId,
    to_location_id: input.toLocationId,
    reason: input.reason,
    related_deployment_id: input.relatedDeploymentId,
    notes: input.notes,
    created_by: input.userId,
  };
}

export async function recordStockMovement(
  dependencies: StockMovementDependencies,
  input: StockMovementInput,
) {
  if (!isStockMovementType(input.movementType)) {
    return {
      ok: false,
      error: "Invalid stock movement type.",
    } as const;
  }

  const nextQuantity = calculateNextQuantityOnHand(
    input.batch.quantity_on_hand,
    input.movementType,
    input.quantity,
  );

  if (!nextQuantity.ok) {
    return nextQuantity;
  }

  const movementResult = await dependencies.insertStockMovement(buildStockMovementPayload(input));

  if (!movementResult.ok) {
    return movementResult;
  }

  const updateResult = await dependencies.updateBatch(input.batch.id, {
    quantity_on_hand: nextQuantity.data,
    location_id:
      input.movementType === "transferred" && input.toLocationId ? input.toLocationId : undefined,
    updated_by: input.userId,
  });

  if (!updateResult.ok) {
    return updateResult;
  }

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "stock.movement",
    recordType: "consumable_batch",
    recordId: input.batch.id,
    oldValue: {
      quantity_on_hand: input.batch.quantity_on_hand,
      location_id: input.batch.location_id,
    },
    newValue: {
      movement_id: movementResult.data.id,
      movement_type: input.movementType,
      quantity_on_hand: updateResult.data.quantity_on_hand,
      location_id: updateResult.data.location_id,
      reason: input.reason,
    },
  });

  return ok({
    batch: updateResult.data,
    movement: movementResult.data,
  });
}
