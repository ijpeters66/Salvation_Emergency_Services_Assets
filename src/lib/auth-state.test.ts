import { describe, expect, it } from "vitest";

import {
  getProfileLabel,
  getRoleAwareNavItems,
  isAdminRole,
  isPublicRoute,
} from "@/lib/auth-state";

describe("auth state helpers", () => {
  it("identifies public routes", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/login/reset")).toBe(true);
    expect(isPublicRoute("/health")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("identifies the admin role", () => {
    expect(isAdminRole("system_admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it("hides admin navigation from ordinary users", () => {
    const titles = getRoleAwareNavItems("user").map((item) => item.title);

    expect(titles).toContain("Dashboard");
    expect(titles).toContain("Assets");
    expect(titles).not.toContain("Settings");
    expect(titles).not.toContain("Audit");
  });

  it("shows admin navigation to system admins", () => {
    const titles = getRoleAwareNavItems("system_admin").map((item) => item.title);

    expect(titles).toContain("Settings");
    expect(titles).toContain("Audit");
  });

  it("formats the profile label", () => {
    expect(getProfileLabel(null)).toEqual({
      primary: "Not signed in",
      secondary: "Login required",
    });

    expect(
      getProfileLabel({
        email: "admin@example.com",
        displayName: "Alex Admin",
        role: "system_admin",
      }),
    ).toEqual({
      primary: "Alex Admin",
      secondary: "System admin",
    });

    expect(
      getProfileLabel({
        email: "user@example.com",
        displayName: null,
        role: "user",
      }),
    ).toEqual({
      primary: "user@example.com",
      secondary: "Operational user",
    });
  });
});
