/* eslint-disable @next/next/no-img-element */
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/settings/page";

const {
  redirectMock,
  getCurrentUserContextMock,
  getStoredReportBrandingSettingsMock,
  listSettingsUsersMock,
  listRolesMock,
  listAssetCategoriesForSettingsMock,
  listConsumableCategoriesForSettingsMock,
  listMovementReasonsMock,
} = vi.hoisted(() => ({
    redirectMock: vi.fn(),
    getCurrentUserContextMock: vi.fn(),
    getStoredReportBrandingSettingsMock: vi.fn(),
    listSettingsUsersMock: vi.fn(),
    listRolesMock: vi.fn(),
    listAssetCategoriesForSettingsMock: vi.fn(),
    listConsumableCategoriesForSettingsMock: vi.fn(),
    listMovementReasonsMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
}));

vi.mock("@/lib/settings/server", () => ({
  getStoredReportBrandingSettings: getStoredReportBrandingSettingsMock,
  listSettingsUsers: listSettingsUsersMock,
  listRoles: listRolesMock,
  listAssetCategoriesForSettings: listAssetCategoriesForSettingsMock,
  listConsumableCategoriesForSettings: listConsumableCategoriesForSettingsMock,
  listMovementReasons: listMovementReasonsMock,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getCurrentUserContextMock.mockReset();
    getStoredReportBrandingSettingsMock.mockReset();
    listSettingsUsersMock.mockReset();
    listRolesMock.mockReset();
    listAssetCategoriesForSettingsMock.mockReset();
    listConsumableCategoriesForSettingsMock.mockReset();
    listMovementReasonsMock.mockReset();
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

    await expect(SettingsPage({})).rejects.toThrow("redirected");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the report branding settings for admins", async () => {
    getCurrentUserContextMock.mockResolvedValue({
      email: "admin@example.com",
      displayName: "Admin",
      role: "system_admin",
    });
    getStoredReportBrandingSettingsMock.mockResolvedValue({
      organizationName: "Custom Ops",
      productName: "Custom Register",
      logoText: "COPS",
      tagline: "Regional logistics",
      primaryColor: "#112233",
      secondaryColor: "#445566",
      accentColor: "#778899",
      surfaceColor: "#ddeeff",
      fontFamily: "Arial",
    });
    listSettingsUsersMock.mockResolvedValue([
      {
        user_id: "user-1",
        display_name: "Alex Admin",
        role_id: "role-1",
        role_key: "system_admin",
        role_name: "System Admin",
        is_active: true,
      },
    ]);
    listRolesMock.mockResolvedValue([
      { id: "role-1", key: "system_admin", name: "System Admin" },
      { id: "role-2", key: "user", name: "User" },
    ]);
    listAssetCategoriesForSettingsMock.mockResolvedValue([
      { id: "asset-cat-1", name: "Vehicles", description: null, archived_at: null },
    ]);
    listConsumableCategoriesForSettingsMock.mockResolvedValue([
      { id: "consumable-cat-1", name: "Medical", description: null, archived_at: null },
    ]);
    listMovementReasonsMock.mockResolvedValue([
      {
        id: "reason-1",
        key: "flood_response",
        label: "Flood Response",
        description: null,
        sort_order: 10,
        archived_at: null,
      },
    ]);

    const markup = renderToStaticMarkup(await SettingsPage({}));

    expect(markup).toContain("Create user");
    expect(markup).toContain("Search users");
    expect(markup).toContain("Reset password");
    expect(markup).toContain("User management");
    expect(markup).toContain("Report branding");
    expect(markup).toContain("Movement reasons");
    expect(markup).toContain("Custom Ops");
    expect(markup).toContain("Custom Register");
    expect(markup).toContain("#112233");
    expect(markup).toContain("Flood Response");
  });
});
