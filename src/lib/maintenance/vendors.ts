import { z } from "zod";

import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type MaintenanceVendorRow = Database["public"]["Tables"]["maintenance_vendor"]["Row"];
export type MaintenanceVendorInsert = Database["public"]["Tables"]["maintenance_vendor"]["Insert"];
export type MaintenanceVendorUpdate = Database["public"]["Tables"]["maintenance_vendor"]["Update"];

export type MaintenanceVendorDependencies = {
  insertVendor(payload: MaintenanceVendorInsert): Promise<AppResult<MaintenanceVendorRow>>;
  updateVendor(id: string, payload: MaintenanceVendorUpdate): Promise<AppResult<MaintenanceVendorRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(z.email().nullable());

const optionalWebsite = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(z.url().nullable());

export const maintenanceVendorSchema = z.object({
  vendorId: z.string().uuid().nullable(),
  businessName: z.string().trim().min(2, "Business name is required."),
  contactName: optionalText,
  phone: optionalText,
  email: optionalEmail,
  address: optionalText,
  website: optionalWebsite,
  notes: optionalText,
});

export type MaintenanceVendorInput = z.infer<typeof maintenanceVendorSchema>;

export function parseMaintenanceVendorFormData(formData: FormData) {
  const vendorId = formData.get("vendorId");

  return maintenanceVendorSchema.safeParse({
    vendorId: typeof vendorId === "string" && vendorId.length > 0 ? vendorId : null,
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    website: formData.get("website") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export function buildMaintenanceVendorInsertPayload(
  input: MaintenanceVendorInput,
  userId: string,
): MaintenanceVendorInsert {
  return {
    business_name: input.businessName,
    contact_name: input.contactName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    website: input.website,
    notes: input.notes,
    created_by: userId,
    updated_by: userId,
  };
}

export function buildMaintenanceVendorUpdatePayload(
  input: MaintenanceVendorInput,
  userId: string,
): MaintenanceVendorUpdate {
  return {
    business_name: input.businessName,
    contact_name: input.contactName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    website: input.website,
    notes: input.notes,
    updated_by: userId,
  };
}

export function buildMaintenanceVendorArchivePayload(userId: string, archivedAt = new Date()) {
  return {
    archived_at: archivedAt.toISOString(),
    updated_by: userId,
  } satisfies MaintenanceVendorUpdate;
}

export function toMaintenanceVendorNames(vendors: MaintenanceVendorRow[]) {
  return vendors
    .filter((vendor) => !vendor.archived_at)
    .map((vendor) => vendor.business_name)
    .sort((left, right) => left.localeCompare(right));
}

export async function createMaintenanceVendorRecord(
  dependencies: MaintenanceVendorDependencies,
  input: MaintenanceVendorInput,
  userId: string,
) {
  const result = await dependencies.insertVendor(
    buildMaintenanceVendorInsertPayload(input, userId),
  );
  if (!result.ok) return result;

  await dependencies.writeAuditLog({
    userId,
    actionType: "maintenance.vendor.create",
    recordType: "maintenance_vendor",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function updateMaintenanceVendorRecord(
  dependencies: MaintenanceVendorDependencies,
  id: string,
  input: MaintenanceVendorInput,
  userId: string,
) {
  const result = await dependencies.updateVendor(id, buildMaintenanceVendorUpdatePayload(input, userId));
  if (!result.ok) return result;

  await dependencies.writeAuditLog({
    userId,
    actionType: "maintenance.vendor.update",
    recordType: "maintenance_vendor",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function archiveMaintenanceVendorRecord(
  dependencies: MaintenanceVendorDependencies,
  id: string,
  userId: string,
  archivedAt = new Date(),
) {
  const result = await dependencies.updateVendor(
    id,
    buildMaintenanceVendorArchivePayload(userId, archivedAt),
  );
  if (!result.ok) return result;

  await dependencies.writeAuditLog({
    userId,
    actionType: "maintenance.vendor.archive",
    recordType: "maintenance_vendor",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}
