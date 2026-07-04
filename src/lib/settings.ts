import { z } from "zod";

import type { ReportBrandingSettings } from "@/lib/report-branding";
import { isUserRole, userRoles, type UserRole } from "@/lib/domain-types";

export const defaultMovementReasonSeeds = [
  "Flood Response",
  "Fire Response",
  "Training Exercise",
  "Community Support",
  "Stock Transfer",
  "Maintenance",
  "Disposal/Write-Off",
] as const;

export const brandingSettingsSchema = z.object({
  organizationName: z.string().trim().min(2, "Organisation name is required."),
  productName: z.string().trim().min(2, "Product name is required."),
  logoText: z.string().trim().min(2, "Logo text is required.").max(8),
  tagline: z.string().trim().min(2, "Tagline is required."),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour."),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour."),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour."),
  surfaceColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour."),
  fontFamily: z.string().trim().min(2, "Font family is required."),
});

export const movementReasonFormSchema = z.object({
  label: z.string().trim().min(2, "Movement reason label is required."),
  description: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Category name is required."),
  description: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
});

export const userCreateFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  displayName: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
  password: z.string().trim().min(8, "Password must be at least 8 characters."),
  role: z.enum(userRoles),
  isActive: z.boolean(),
});

export function normaliseMovementReasonKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseBrandingSettingsFormData(formData: FormData) {
  return brandingSettingsSchema.safeParse({
    organizationName: formData.get("organizationName"),
    productName: formData.get("productName"),
    logoText: formData.get("logoText"),
    tagline: formData.get("tagline"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    surfaceColor: formData.get("surfaceColor"),
    fontFamily: formData.get("fontFamily"),
  });
}

export function parseMovementReasonFormData(formData: FormData) {
  return movementReasonFormSchema.safeParse({
    label: formData.get("label"),
    description: formData.get("description") ?? "",
  });
}

export function parseCategoryFormData(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
}

export function parseUserCreateFormData(formData: FormData) {
  return userCreateFormSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName") ?? "",
    password: formData.get("password"),
    role: formData.get("role"),
    isActive: String(formData.get("isActive") ?? "1") === "1",
  });
}

export function parseUserRoleFormData(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "1") === "1";

  if (!userId || !isUserRole(role)) {
    return {
      success: false as const,
      error: "User and role are required.",
    };
  }

  return {
    success: true as const,
    data: {
      userId,
      role: role as UserRole,
      isActive,
    },
  };
}

export function validateReportBrandingSettings(input: ReportBrandingSettings) {
  return brandingSettingsSchema.safeParse(input);
}

export function getRoleOptions() {
  return userRoles.map((role) => ({
    value: role,
    label: role === "system_admin" ? "System Admin" : "User",
  }));
}

export function getMovementReasonLabels(
  reasons: Array<{ label: string; archived_at?: string | null }> = [],
) {
  if (reasons.length === 0) {
    return [...defaultMovementReasonSeeds];
  }

  return reasons
    .filter((reason) => !reason.archived_at)
    .map((reason) => reason.label);
}
