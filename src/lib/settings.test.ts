import { describe, expect, it } from "vitest";

import {
  brandingSettingsSchema,
  getMovementReasonLabels,
  normaliseMovementReasonKey,
  parseUserRoleFormData,
} from "@/lib/settings";

describe("settings helpers", () => {
  it("validates branding settings", () => {
    const result = brandingSettingsSchema.parse({
      organizationName: "Salvation Emergency Services",
      productName: "SAES Asset Register",
      logoText: "SAES",
      tagline: "Victoria emergency services logistics",
      primaryColor: "#e12d3c",
      secondaryColor: "#003450",
      accentColor: "#007faf",
      surfaceColor: "#f4f4f4",
      fontFamily: "Roboto",
    });

    expect(result.logoText).toBe("SAES");
    expect(result.primaryColor).toBe("#e12d3c");
  });

  it("normalises movement reason keys", () => {
    expect(normaliseMovementReasonKey("Disposal/Write-Off")).toBe("disposal_write_off");
    expect(normaliseMovementReasonKey("  Flood Response  ")).toBe("flood_response");
  });

  it("parses user role access updates", () => {
    const formData = new FormData();
    formData.set("userId", "user-1");
    formData.set("role", "system_admin");
    formData.set("isActive", "0");

    const result = parseUserRoleFormData(formData);

    expect(result).toEqual({
      success: true,
      data: {
        userId: "user-1",
        role: "system_admin",
        isActive: false,
      },
    });
  });

  it("falls back to default movement reason labels when none are stored", () => {
    expect(getMovementReasonLabels()).toEqual([
      "Flood Response",
      "Fire Response",
      "Training Exercise",
      "Community Support",
      "Stock Transfer",
      "Maintenance",
      "Disposal/Write-Off",
    ]);
  });
});
