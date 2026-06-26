import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuditFilterOptions, listAuditLogs } from "@/lib/audit/server";

vi.mock("@/lib/env", () => ({
  getPublicEnvStatus: vi.fn(() => ({ configured: true, missing: [] })),
}));

const auditRows = [
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
  },
];

const profiles = [
  { user_id: "user-1", display_name: "Admin User" },
  { user_id: "user-2", display_name: "Ops User" },
];

const fromMock = vi.fn((table: string) => {
  if (table === "audit_log") {
    const query = {
      data: auditRows,
      error: null,
      select: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      eq: vi.fn(() => query),
      gte: vi.fn(() => query),
      lte: vi.fn(() => query),
    };

    return query;
  }

  if (table === "app_user_profile") {
    return {
      data: profiles,
      error: null,
      select: vi.fn(() => ({
        data: profiles,
        error: null,
      })),
    };
  }

  throw new Error(`Unexpected table ${table}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

describe("audit server queries", () => {
  beforeEach(() => {
    fromMock.mockClear();
  });

  it("maps audit rows to display entries with user labels and record links", async () => {
    const result = await listAuditLogs();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "audit-1",
        userLabel: "Admin User",
        recordHref: "/assets/asset-1",
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: "audit-2",
        userLabel: "Ops User",
        recordHref: "/locations/location-1",
      }),
    );
  });

  it("applies filters before returning entries", async () => {
    const result = await listAuditLogs({
      userId: "user-2",
      actionType: "location.update",
      recordType: "location",
      dateFrom: "2026-06-26",
      dateTo: "2026-06-26",
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: "audit-2",
      }),
    ]);
  });

  it("builds unique filter options from current audit entries", async () => {
    const options = await getAuditFilterOptions();

    expect(options.users).toEqual([
      { id: "user-1", label: "Admin User" },
      { id: "user-2", label: "Ops User" },
    ]);
    expect(options.actionTypes).toEqual(["asset.create", "location.update"]);
    expect(options.recordTypes).toEqual(["asset", "location"]);
  });
});
