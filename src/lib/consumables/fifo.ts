import type { StockMovementDependencies } from "@/lib/consumables/stock-movement";
import { recordStockMovement } from "@/lib/consumables/stock-movement";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import { ok } from "@/lib/result";

export type FifoIssueSelection = {
  batch: ConsumableBatchRow;
  quantity: number;
};

export type FifoIssueInput = {
  itemId: string;
  locationId: string;
  quantity: number;
  reason: string;
  notes: string | null;
  userId: string;
};

function batchSortKey(batch: ConsumableBatchRow) {
  return [batch.expiry_date ?? "9999-12-31", batch.date_received, batch.batch_lot_number].join("|");
}

export function selectFifoBatches(batches: ConsumableBatchRow[], requestedQuantity: number) {
  if (requestedQuantity <= 0) {
    return {
      ok: false,
      error: "Issue quantity must be greater than zero.",
    } as const;
  }

  const eligibleBatches = batches
    .filter((batch) => batch.quantity_on_hand > 0 && !batch.archived_at)
    .sort((left, right) => batchSortKey(left).localeCompare(batchSortKey(right)));

  const totalAvailable = eligibleBatches.reduce((sum, batch) => sum + batch.quantity_on_hand, 0);

  if (totalAvailable < requestedQuantity) {
    return {
      ok: false,
      error: "Insufficient stock for FIFO issue.",
    } as const;
  }

  let remaining = requestedQuantity;
  const selections: FifoIssueSelection[] = [];

  for (const batch of eligibleBatches) {
    if (remaining === 0) {
      break;
    }

    const quantity = Math.min(batch.quantity_on_hand, remaining);
    selections.push({ batch, quantity });
    remaining -= quantity;
  }

  return ok(selections);
}

export async function issueConsumablesFifo(
  dependencies: StockMovementDependencies,
  batches: ConsumableBatchRow[],
  input: FifoIssueInput,
) {
  const selected = selectFifoBatches(
    batches.filter(
      (batch) => batch.item_id === input.itemId && batch.location_id === input.locationId,
    ),
    input.quantity,
  );

  if (!selected.ok) {
    return selected;
  }

  const summary: Array<{ batchId: string; batchLotNumber: string; quantity: number }> = [];

  for (const selection of selected.data) {
    const result = await recordStockMovement(dependencies, {
      batch: selection.batch,
      movementType: "issued",
      quantity: selection.quantity,
      fromLocationId: input.locationId,
      toLocationId: null,
      reason: input.reason,
      relatedDeploymentId: null,
      notes: input.notes,
      userId: input.userId,
    });

    if (!result.ok) {
      return result;
    }

    summary.push({
      batchId: selection.batch.id,
      batchLotNumber: selection.batch.batch_lot_number,
      quantity: selection.quantity,
    });
  }

  return ok(summary);
}
