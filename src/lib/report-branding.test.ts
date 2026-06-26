import { describe, expect, it } from "vitest";

import {
  getDefaultReportBrandingSettings,
  getReportBrandingSettings,
} from "@/lib/report-branding";

describe("report branding settings", () => {
  it("returns the default branding settings", () => {
    expect(getDefaultReportBrandingSettings()).toEqual(
      expect.objectContaining({
        organizationName: "Salvation Emergency Services",
        productName: "SAES Asset Register",
        primaryColor: "#e12d3c",
      }),
    );
  });

  it("applies branding overrides from the environment", () => {
    const settings = getReportBrandingSettings({
      REPORT_BRANDING_ORGANIZATION_NAME: "Custom Ops",
      REPORT_BRANDING_PRODUCT_NAME: "Custom Register",
      REPORT_BRANDING_LOGO_TEXT: "COPS",
      REPORT_BRANDING_TAGLINE: "Regional logistics",
      REPORT_BRANDING_PRIMARY_COLOR: "#112233",
      REPORT_BRANDING_SECONDARY_COLOR: "#445566",
      REPORT_BRANDING_ACCENT_COLOR: "#778899",
      REPORT_BRANDING_SURFACE_COLOR: "#ddeeff",
      REPORT_BRANDING_FONT_FAMILY: "Arial",
    });

    expect(settings).toEqual(
      expect.objectContaining({
        organizationName: "Custom Ops",
        productName: "Custom Register",
        logoText: "COPS",
        primaryColor: "#112233",
      }),
    );
  });
});
