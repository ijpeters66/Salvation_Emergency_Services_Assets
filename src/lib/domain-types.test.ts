import { describe, expect, it } from "vitest";

import {
  isAssetStatus,
  isAttachmentOwnerType,
  isDeploymentStatus,
  isStockMovementType,
  isUserRole,
} from "@/lib/domain-types";

describe("domain type guards", () => {
  it("recognises valid enum-like values", () => {
    expect(isUserRole("system_admin")).toBe(true);
    expect(isAssetStatus("under_maintenance")).toBe(true);
    expect(isDeploymentStatus("active")).toBe(true);
    expect(isStockMovementType("stocktake_variance")).toBe(true);
    expect(isAttachmentOwnerType("maintenance_record")).toBe(true);
    expect(isAttachmentOwnerType("plant")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isUserRole("admin")).toBe(false);
    expect(isAssetStatus("missing")).toBe(false);
    expect(isDeploymentStatus("draft")).toBe(false);
    expect(isStockMovementType("sold")).toBe(false);
    expect(isAttachmentOwnerType("invoice")).toBe(false);
  });
});
