/* eslint-disable @next/next/no-img-element */
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/settings/page";

const { redirectMock, getCurrentUserContextMock, getReportBrandingSettingsMock } = vi.hoisted(
  () => ({
    redirectMock: vi.fn(),
    getCurrentUserContextMock: vi.fn(),
    getReportBrandingSettingsMock: vi.fn(),
  }),
);

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

vi.mock("@/lib/report-branding", () => ({
  getReportBrandingSettings: getReportBrandingSettingsMock,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getCurrentUserContextMock.mockReset();
    getReportBrandingSettingsMock.mockReset();
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

    await expect(SettingsPage()).rejects.toThrow("redirected");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the report branding settings for admins", async () => {
    getCurrentUserContextMock.mockResolvedValue({
      email: "admin@example.com",
      displayName: "Admin",
      role: "system_admin",
    });
    getReportBrandingSettingsMock.mockReturnValue({
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

    const markup = renderToStaticMarkup(await SettingsPage());

    expect(markup).toContain("Report branding");
    expect(markup).toContain("Custom Ops");
    expect(markup).toContain("Custom Register");
    expect(markup).toContain("#112233");
  });
});
