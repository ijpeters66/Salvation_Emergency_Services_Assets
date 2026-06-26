import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuditPage from "@/app/audit/page";

const {
  redirectMock,
  getCurrentUserContextMock,
  listAuditLogsMock,
  getAuditFilterOptionsMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getCurrentUserContextMock: vi.fn(),
  listAuditLogsMock: vi.fn(),
  getAuditFilterOptionsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
}));

vi.mock("@/lib/audit/server", () => ({
  listAuditLogs: listAuditLogsMock,
  getAuditFilterOptions: getAuditFilterOptionsMock,
}));

describe("AuditPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getCurrentUserContextMock.mockReset();
    listAuditLogsMock.mockReset();
    getAuditFilterOptionsMock.mockReset();
  });

  it("redirects non-admin users back to the dashboard", async () => {
    getCurrentUserContextMock.mockResolvedValue({
      email: "user@example.com",
      displayName: "Ops User",
      role: "user",
    });
    redirectMock.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(AuditPage({})).rejects.toThrow("redirected");

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the audit trail for system admins", async () => {
    getCurrentUserContextMock.mockResolvedValue({
      email: "qa@example.com",
      displayName: "QA Admin",
      role: "system_admin",
    });
    listAuditLogsMock.mockResolvedValue([
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
        userLabel: "QA Admin",
        recordHref: "/assets/asset-1",
      },
    ]);
    getAuditFilterOptionsMock.mockResolvedValue({
      users: [{ id: "user-1", label: "QA Admin" }],
      actionTypes: ["asset.create"],
      recordTypes: ["asset"],
    });

    const markup = renderToStaticMarkup(await AuditPage({}));

    expect(markup).toContain("Audit events");
    expect(markup).toContain("QA Admin");
    expect(markup).toContain("Asset Create");
    expect(markup).toContain("Old value");
    expect(markup).toContain("New value");
  });
});
