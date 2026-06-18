import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import {
  buildPlantDetailsPayload,
  getPlantExpiryAlerts,
  plantDetailsSchema,
  upsertPlantDetailsRecord,
  type PlantDetailsDependencies,
} from "@/lib/assets/plant";

function createDependencies(): PlantDetailsDependencies {
  return {
    upsertPlantDetails: vi.fn(async (payload) =>
      ok({
        ...payload,
        created_at: "2026-06-18T00:00:00.000Z",
        updated_at: "2026-06-18T00:00:00.000Z",
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("plant details", () => {
  it("validates optional plant fields", () => {
    const result = plantDetailsSchema.parse({
      isPlant: true,
      registrationNumber: "ABC123",
      registrationExpiry: "2026-07-01",
      insuranceExpiry: "",
      roadworthyComplianceDate: "",
      odometerReading: "12000",
      hourMeterReading: "52.5",
      fuelType: "Diesel",
      serviceProvider: "",
    });

    expect(result.registrationNumber).toBe("ABC123");
    expect(result.insuranceExpiry).toBeNull();
    expect(result.odometerReading).toBe(12000);
    expect(result.hourMeterReading).toBe(52.5);
  });

  it("builds plant detail payloads", () => {
    const input = plantDetailsSchema.parse({
      isPlant: true,
      registrationNumber: "ABC123",
      registrationExpiry: "",
      insuranceExpiry: "",
      roadworthyComplianceDate: "",
      odometerReading: "",
      hourMeterReading: "",
      fuelType: "",
      serviceProvider: "",
    });

    expect(buildPlantDetailsPayload("asset-1", input, "user-1")).toEqual(
      expect.objectContaining({
        asset_id: "asset-1",
        registration_number: "ABC123",
        created_by: "user-1",
        updated_by: "user-1",
      }),
    );
  });

  it("calculates expiry alert states", () => {
    const alerts = getPlantExpiryAlerts(
      {
        asset_id: "asset-1",
        registration_number: null,
        registration_expiry: "2026-06-25",
        insurance_expiry: "2026-06-01",
        roadworthy_compliance_date: "2026-12-01",
        odometer_reading: null,
        hour_meter_reading: null,
        fuel_type: null,
        service_provider: null,
        created_at: "2026-06-18T00:00:00.000Z",
        updated_at: "2026-06-18T00:00:00.000Z",
        created_by: "user-1",
        updated_by: "user-1",
      },
      new Date("2026-06-18T00:00:00.000Z"),
    );

    expect(alerts.map((alert) => alert.status)).toEqual(["due_soon", "overdue", "normal"]);
  });

  it("upserts plant details and writes audit log", async () => {
    const dependencies = createDependencies();
    const input = plantDetailsSchema.parse({
      isPlant: true,
      registrationNumber: "ABC123",
      registrationExpiry: "",
      insuranceExpiry: "",
      roadworthyComplianceDate: "",
      odometerReading: "",
      hourMeterReading: "",
      fuelType: "",
      serviceProvider: "",
    });

    const result = await upsertPlantDetailsRecord(dependencies, "asset-1", input, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.upsertPlantDetails).toHaveBeenCalledOnce();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "asset.plant_details.upsert",
        recordType: "plant_details",
      }),
    );
  });
});
