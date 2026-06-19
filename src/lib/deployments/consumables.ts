import { selectFifoBatches } from "@/lib/consumables/fifo";
import {
  recordStockMovement,
  type StockMovementDependencies,
} from "@/lib/consumables/stock-movement";
import type { ConsumableBatchRow } from "@/lib/consumables/service";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type DeploymentConsumableRow = Database["public"]["Tables"]["deployment_consumable"]["Row"];
export type DeploymentConsumableInsert =
  Database["public"]["Tables"]["deployment_consumable"]["Insert"];

export type IssueDeploymentConsumablesInput = {
  deploymentId: string;
  itemId: string;
  locationId: string;
  quantity: number;
  notes: string | null;
  userId: string;
};

export type DeploymentConsumableDependencies = StockMovementDependencies & {
  insertDeploymentConsumable(
    payload: DeploymentConsumableInsert,
  ): Promise<AppResult<DeploymentConsumableRow>>;
};

export async function issueDeploymentConsumables(
  dependencies: DeploymentConsumableDependencies,
  batches: ConsumableBatchRow[],
  input: IssueDeploymentConsumablesInput,
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

  const summary: Array<{
    deploymentConsumableId: string;
    batchId: string;
    batchLotNumber: string;
    quantity: number;
    stockMovementId: string;
  }> = [];

  for (const selection of selected.data) {
    const stockMovementResult = await recordStockMovement(dependencies, {
      batch: selection.batch,
      movementType: "issued",
      quantity: selection.quantity,
      fromLocationId: input.locationId,
      toLocationId: null,
      reason: "Deployment issue",
      relatedDeploymentId: input.deploymentId,
      notes: input.notes,
      userId: input.userId,
    });

    if (!stockMovementResult.ok) {
      return stockMovementResult;
    }

    const deploymentConsumableResult = await dependencies.insertDeploymentConsumable({
      deployment_id: input.deploymentId,
      consumable_batch_id: selection.batch.id,
      stock_movement_id: stockMovementResult.data.movement.id,
      quantity: selection.quantity,
      issued_by: input.userId,
    });

    if (!deploymentConsumableResult.ok) {
      return deploymentConsumableResult;
    }

    await dependencies.writeAuditLog({
      userId: input.userId,
      actionType: "deployment.consumable.issue",
      recordType: "deployment_consumable",
      recordId: deploymentConsumableResult.data.id,
      newValue: {
        deploymentConsumable: deploymentConsumableResult.data,
        stockMovement: stockMovementResult.data.movement,
      },
    });

    summary.push({
      deploymentConsumableId: deploymentConsumableResult.data.id,
      batchId: selection.batch.id,
      batchLotNumber: selection.batch.batch_lot_number,
      quantity: selection.quantity,
      stockMovementId: stockMovementResult.data.movement.id,
    });
  }

  return ok(summary);
}
