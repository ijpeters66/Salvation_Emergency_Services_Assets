import { describe, expect, it, vi } from "vitest";

import {
  assignChildAsset,
  unassignChildAsset,
  wouldCreateCircularAssignment,
  type AssetAssignmentDependencies,
  type AssetAssignmentRow,
} from "@/lib/assets/assignment";
import { ok } from "@/lib/result";

const assignment: AssetAssignmentRow = {
  id: "assignment-1",
  parent_asset_id: "truck-1",
  child_asset_id: "radio-kit-1",
  assigned_at: "2026-06-16T00:00:00.000Z",
  unassigned_at: null,
  assigned_by: "user-1",
  notes: null,
};

function createDependencies(): AssetAssignmentDependencies {
  return {
    insertAssignment: vi.fn(async () => ok(assignment)),
    updateAssignment: vi.fn(async () =>
      ok({
        ...assignment,
        unassigned_at: "2026-06-16T01:00:00.000Z",
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("asset assignments", () => {
  it("prevents self and circular assignments", () => {
    expect(wouldCreateCircularAssignment("asset-1", "asset-1", [])).toBe(true);
    expect(
      wouldCreateCircularAssignment("trailer-1", "generator-1", [
        {
          parentAssetId: "generator-1",
          childAssetId: "trailer-1",
        },
      ]),
    ).toBe(true);
  });

  it("allows ordinary parent child assignments", async () => {
    const dependencies = createDependencies();

    const result = await assignChildAsset(dependencies, {
      parentAssetId: "truck-1",
      childAssetId: "radio-kit-1",
      notes: null,
      userId: "user-1",
      activeAssignments: [],
    });

    expect(result.ok).toBe(true);
    expect(dependencies.insertAssignment).toHaveBeenCalledWith({
      parent_asset_id: "truck-1",
      child_asset_id: "radio-kit-1",
      assigned_by: "user-1",
      notes: null,
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.assignment.create",
        recordType: "asset_assignment",
      }),
    );
  });

  it("records unassignment history", async () => {
    const dependencies = createDependencies();

    await unassignChildAsset(
      dependencies,
      assignment,
      "user-1",
      new Date("2026-06-16T01:00:00.000Z"),
    );

    expect(dependencies.updateAssignment).toHaveBeenCalledWith("assignment-1", {
      unassigned_at: "2026-06-16T01:00:00.000Z",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.assignment.remove",
      }),
    );
  });
});
