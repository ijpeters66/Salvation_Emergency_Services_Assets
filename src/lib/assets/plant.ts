import { z } from "zod";

import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type PlantDetailsRow = Database["public"]["Tables"]["plant_details"]["Row"];
export type PlantDetailsInsert = Database["public"]["Tables"]["plant_details"]["Insert"];

export type PlantDetailsDependencies = {
  upsertPlantDetails(payload: PlantDetailsInsert): Promise<AppResult<PlantDetailsRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().nonnegative().nullable());

export const plantDetailsSchema = z.object({
  isPlant: z.boolean(),
  registrationNumber: optionalText,
  registrationExpiry: optionalDate,
  insuranceExpiry: optionalDate,
  roadworthyComplianceDate: optionalDate,
  odometerReading: optionalNumber,
  hourMeterReading: optionalNumber,
  fuelType: optionalText,
  serviceProvider: optionalText,
});

export type PlantDetailsInput = z.infer<typeof plantDetailsSchema>;

export function parsePlantDetailsFormData(formData: FormData) {
  return plantDetailsSchema.safeParse({
    isPlant: formData.get("isPlant") === "on",
    registrationNumber: formData.get("registrationNumber") ?? "",
    registrationExpiry: formData.get("registrationExpiry") ?? "",
    insuranceExpiry: formData.get("insuranceExpiry") ?? "",
    roadworthyComplianceDate: formData.get("roadworthyComplianceDate") ?? "",
    odometerReading: formData.get("odometerReading") ?? "",
    hourMeterReading: formData.get("hourMeterReading") ?? "",
    fuelType: formData.get("fuelType") ?? "",
    serviceProvider: formData.get("serviceProvider") ?? "",
  });
}

export function buildPlantDetailsPayload(
  assetId: string,
  input: PlantDetailsInput,
  userId: string,
): PlantDetailsInsert {
  return {
    asset_id: assetId,
    registration_number: input.registrationNumber,
    registration_expiry: input.registrationExpiry,
    insurance_expiry: input.insuranceExpiry,
    roadworthy_compliance_date: input.roadworthyComplianceDate,
    odometer_reading: input.odometerReading,
    hour_meter_reading: input.hourMeterReading,
    fuel_type: input.fuelType,
    service_provider: input.serviceProvider,
    created_by: userId,
    updated_by: userId,
  };
}

export function getPlantExpiryAlerts(details: PlantDetailsRow | null, today = new Date()) {
  if (!details) {
    return [];
  }

  const alertWindowMs = 30 * 24 * 60 * 60 * 1000;

  return [
    ["Registration", details.registration_expiry],
    ["Insurance", details.insurance_expiry],
    ["Roadworthy/compliance", details.roadworthy_compliance_date],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, date]) => {
      const dueAt = new Date(date);
      const diff = dueAt.getTime() - today.getTime();
      const status = diff < 0 ? "overdue" : diff <= alertWindowMs ? "due_soon" : "normal";
      return { label, date, status };
    });
}

export async function upsertPlantDetailsRecord(
  dependencies: PlantDetailsDependencies,
  assetId: string,
  input: PlantDetailsInput,
  userId: string,
) {
  const result = await dependencies.upsertPlantDetails(
    buildPlantDetailsPayload(assetId, input, userId),
  );

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "asset.plant_details.upsert",
    recordType: "plant_details",
    recordId: assetId,
    newValue: result.data,
  });

  return ok(result.data);
}
