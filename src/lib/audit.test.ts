import { describe, expect, it } from "vitest";

import {
  filterAuditEntries,
  formatAuditAction,
  formatAuditJson,
  formatAuditRecordType,
  getAuditRecordHref,
  type AuditListEntry,
} from "@/lib/audit";

const entries: AuditListEntry[] = [
  {
    id: "audit-1",
    user_id: "user-1",
    action_type: "asset.create",
    record_type: "asset",
    record_id: "asset-1",
    old_value: null,
    new_value: { status: "available" },
    device_source: null,
    offline_sync_reference: null,
    created_at: "2026-06-25T09:00:00.000Z",
    userLabel: "Admin User",
    recordHref: "/assets/asset-1",
  },
  {
    id: "audit-2",
    user_id: "user-2",
    action_type: "location.update",
    record_type: "location",
    record_id: "location-1",
    old_value: { name: "Old" },
    new_value: { name: "New" },
    device_source: null,
    offline_sync_reference: null,
    created_at: "2026-06-26T09:00:00.000Z",
    userLabel: "Ops User",
    recordHref: "/locations/location-1",
  },
];

describe("audit formatting helpers", () => {
  it("formats action and record labels for display", () => {
    expect(formatAuditAction("asset.child_movement")).toBe("Asset Child Movement");
    expect(formatAuditRecordType("maintenance_record")).toBe("Maintenance Record");
  });

  it("maps known record types to app routes", () => {
    expect(getAuditRecordHref("asset", "asset-1")).toBe("/assets/asset-1");
    expect(getAuditRecordHref("deployment", "dep-1")).toBe("/deployments/dep-1");
    expect(getAuditRecordHref("unknown_type", "x-1")).toBeNull();
  });

  it("formats JSON payloads for the detail view", () => {
    expect(formatAuditJson({ before: "x" })).toContain('"before": "x"');
    expect(formatAuditJson(null)).toBe("No value recorded.");
  });
});

describe("audit filtering", () => {
  it("filters entries by user, record type, action type, and date range", () => {
    expect(filterAuditEntries(entries, { userId: "user-1" })).toHaveLength(1);
    expect(filterAuditEntries(entries, { recordType: "location" })).toHaveLength(1);
    expect(filterAuditEntries(entries, { actionType: "asset.create" })).toHaveLength(1);
    expect(filterAuditEntries(entries, { dateFrom: "2026-06-26", dateTo: "2026-06-26" })).toEqual([
      entries[1],
    ]);
  });
});
