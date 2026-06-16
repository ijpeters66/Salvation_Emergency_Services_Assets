import type { AuditLogInput } from "@/lib/audit-log";
import type { AssetRow } from "@/lib/assets/service";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type AssetAssignmentRow = Database["public"]["Tables"]["asset_assignment"]["Row"];
export type AssetAssignmentInsert = Database["public"]["Tables"]["asset_assignment"]["Insert"];
export type AssetAssignmentUpdate = Database["public"]["Tables"]["asset_assignment"]["Update"];

export type ActiveAssignmentEdge = {
  parentAssetId: string;
  childAssetId: string;
};

export type AssetAssignmentDependencies = {
  insertAssignment(payload: AssetAssignmentInsert): Promise<AppResult<AssetAssignmentRow>>;
  updateAssignment(
    id: string,
    payload: AssetAssignmentUpdate,
  ): Promise<AppResult<AssetAssignmentRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function wouldCreateCircularAssignment(
  parentAssetId: string,
  childAssetId: string,
  activeAssignments: ActiveAssignmentEdge[],
) {
  if (parentAssetId === childAssetId) {
    return true;
  }

  const childrenByParent = new Map<string, string[]>();

  for (const assignment of activeAssignments) {
    const children = childrenByParent.get(assignment.parentAssetId) ?? [];
    children.push(assignment.childAssetId);
    childrenByParent.set(assignment.parentAssetId, children);
  }

  const stack = [childAssetId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    if (current === parentAssetId) {
      return true;
    }

    visited.add(current);
    stack.push(...(childrenByParent.get(current) ?? []));
  }

  return false;
}

export async function assignChildAsset(
  dependencies: AssetAssignmentDependencies,
  input: {
    parentAssetId: string;
    childAssetId: string;
    notes: string | null;
    userId: string;
    activeAssignments: ActiveAssignmentEdge[];
  },
) {
  if (
    wouldCreateCircularAssignment(input.parentAssetId, input.childAssetId, input.activeAssignments)
  ) {
    return {
      ok: false,
      error: "Circular asset assignment is not allowed.",
    } as const;
  }

  const result = await dependencies.insertAssignment({
    parent_asset_id: input.parentAssetId,
    child_asset_id: input.childAssetId,
    assigned_by: input.userId,
    notes: input.notes,
  });

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId: input.userId,
    actionType: "asset.assignment.create",
    recordType: "asset_assignment",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function unassignChildAsset(
  dependencies: AssetAssignmentDependencies,
  assignment: AssetAssignmentRow,
  userId: string,
  unassignedAt = new Date(),
) {
  const result = await dependencies.updateAssignment(assignment.id, {
    unassigned_at: unassignedAt.toISOString(),
  });

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "asset.assignment.remove",
    recordType: "asset_assignment",
    recordId: assignment.id,
    oldValue: assignment,
    newValue: result.data,
  });

  return ok(result.data);
}

export function getAssignableChildAssets(currentAsset: AssetRow, assets: AssetRow[]) {
  return assets.filter((asset) => asset.id !== currentAsset.id && !asset.archived_at);
}
