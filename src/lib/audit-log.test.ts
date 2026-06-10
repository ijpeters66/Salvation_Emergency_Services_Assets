import { describe, expect, it } from "vitest";

import { buildAuditLogPayload } from "@/lib/audit-log";

describe("buildAuditLogPayload", () => {
  it("normalises audit input for database insert", () => {
    const payload = buildAuditLogPayload({
      userId: "user-123",
      actionType: "asset.updated",
      recordType: "asset",
      recordId: "asset-456",
      oldValue: { status: "available" },
      newValue: { status: "deployed" },
      deviceSource: "web",
      offlineSyncReference: "offline-789",
    });

    expect(payload).toEqual({
      user_id: "user-123",
      action_type: "asset.updated",
      record_type: "asset",
      record_id: "asset-456",
      old_value: { status: "available" },
      new_value: { status: "deployed" },
      device_source: "web",
      offline_sync_reference: "offline-789",
    });
  });

  it("defaults optional values to null", () => {
    const payload = buildAuditLogPayload({
      userId: "user-123",
      actionType: "asset.created",
      recordType: "asset",
      recordId: "asset-456",
    });

    expect(payload.old_value).toBeNull();
    expect(payload.new_value).toBeNull();
    expect(payload.device_source).toBeNull();
    expect(payload.offline_sync_reference).toBeNull();
  });
});
