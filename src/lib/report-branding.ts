import { z } from "zod";

const reportBrandingSchema = z.object({
  organizationName: z.string().min(1),
  productName: z.string().min(1),
  logoText: z.string().min(1),
  tagline: z.string().min(1),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  surfaceColor: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  fontFamily: z.string().min(1),
});

export type ReportBrandingSettings = z.infer<typeof reportBrandingSchema>;

const defaults: ReportBrandingSettings = {
  organizationName: "Salvation Emergency Services",
  productName: "SAES Asset Register",
  logoText: "SAES",
  tagline: "Victoria emergency services logistics",
  primaryColor: "#e12d3c",
  secondaryColor: "#003450",
  accentColor: "#007faf",
  surfaceColor: "#f4f4f4",
  fontFamily: "Roboto",
};

export function getDefaultReportBrandingSettings() {
  return defaults;
}

export function getReportBrandingSettings(env: NodeJS.ProcessEnv = process.env) {
  const candidate = {
    organizationName: env.REPORT_BRANDING_ORGANIZATION_NAME ?? defaults.organizationName,
    productName: env.REPORT_BRANDING_PRODUCT_NAME ?? defaults.productName,
    logoText: env.REPORT_BRANDING_LOGO_TEXT ?? defaults.logoText,
    tagline: env.REPORT_BRANDING_TAGLINE ?? defaults.tagline,
    primaryColor: env.REPORT_BRANDING_PRIMARY_COLOR ?? defaults.primaryColor,
    secondaryColor: env.REPORT_BRANDING_SECONDARY_COLOR ?? defaults.secondaryColor,
    accentColor: env.REPORT_BRANDING_ACCENT_COLOR ?? defaults.accentColor,
    surfaceColor: env.REPORT_BRANDING_SURFACE_COLOR ?? defaults.surfaceColor,
    fontFamily: env.REPORT_BRANDING_FONT_FAMILY ?? defaults.fontFamily,
  };

  return reportBrandingSchema.parse(candidate);
}
