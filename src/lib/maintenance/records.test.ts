import { describe, expect, it, vi } from "vitest";

import type { MaintenanceScheduleRow } from "@/lib/maintenance/schedules";
import {
  calculateNextServiceUpdate,
  createMaintenanceRecord,
  parseMaintenanceRecordFormData,
  type MaintenanceRecordDependencies,
} from "@/lib/maintenance/records";
import { ok } from "@/lib/result";

const assetId = "11111111-1111-4111-8111-111111111111";
const scheduleId = "22222222-2222-4222-8222-222222222222";

function createSchedule(overrides: Partial<MaintenanceScheduleRow> = {}): MaintenanceScheduleRow {
  return {
    id: scheduleId,
    asset_id: assetId,
    maintenance_type: "Annual service",
    service_interval_date: 365,
    service_interval_odometer: 10000,
    service_interval_hours: null,
    next_service_due_date: "2026-06-25",
    next_service_due_reading: 20000,
    service_provider: "Local mechanic",
    reminder_threshold_days: 30,
    status: "active",
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDependencies(schedule = createSchedule()): MaintenanceRecordDependencies {
  return {
    createRecord: vi.fn(async (payload) =>
      ok({
        id: "33333333-3333-4333-8333-333333333333",
        created_at: "2026-06-18T00:00:00.000Z",
        ...payload,
        cost: payload.cost ?? 0,
        maintenance_schedule_id: payload.maintenance_schedule_id ?? null,
        odometer_hour_reading: payload.odometer_hour_reading ?? null,
        notes: payload.notes ?? null,
        attachment_metadata: payload.attachment_metadata ?? [],
      }),
    ),
    getSchedule: vi.fn(async () => schedule),
    updateSchedule: vi.fn(async (_scheduleId, payload) => ok({ ...schedule, ...payload })),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("maintenance records", () => {
  it("parses record form data", () => {
    const formData = new FormData();
    formData.set("assetId", assetId);
    formData.set("maintenanceScheduleId", scheduleId);
    formData.set("date", "2026-06-18");
    formData.set("serviceType", "Scheduled service");
    formData.set("description", "Changed oil and checked pump");
    formData.set("cost", "450.25");
    formData.set("supplierProvider", "Local mechanic");
    formData.set("odometerHourReading", "12000.5");
    formData.set("notes", "No defects found");

    const result = parseMaintenanceRecordFormData(formData);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(
      expect.objectContaining({
        maintenanceScheduleId: scheduleId,
        cost: 450.25,
        odometerHourReading: 12000.5,
      }),
    );
  });

  it("recalculates next service due date and reading", () => {
    const update = calculateNextServiceUpdate(
      createSchedule(),
      {
        date: "2026-06-18",
        odometerHourReading: 12345,
      },
      "user-1",
    );

    expect(update).toEqual(
      expect.objectContaining({
        next_service_due_date: "2027-06-18",
        next_service_due_reading: 22345,
        updated_by: "user-1",
      }),
    );
  });

  it("uses hour intervals when odometer intervals are not configured", () => {
    const update = calculateNextServiceUpdate(
      createSchedule({
        service_interval_odometer: null,
        service_interval_hours: 250,
      }),
      {
        date: "2026-06-18",
        odometerHourReading: 1000,
      },
      "user-1",
    );

    expect(update.next_service_due_reading).toBe(1250);
  });

  it("creates a record, updates linked schedule, and writes audit log", async () => {
    const dependencies = createDependencies();
    const result = await createMaintenanceRecord(
      dependencies,
      {
        assetId,
        maintenanceScheduleId: scheduleId,
        date: "2026-06-18",
        serviceType: "Scheduled service",
        description: "Changed oil",
        cost: 450,
        supplierProvider: "Local mechanic",
        odometerHourReading: 12000,
        notes: null,
      },
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(dependencies.createRecord).toHaveBeenCalledOnce();
    expect(dependencies.updateSchedule).toHaveBeenCalledWith(
      scheduleId,
      expect.objectContaining({
        next_service_due_date: "2027-06-18",
        next_service_due_reading: 22000,
      }),
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "maintenance.record.create",
        recordType: "maintenance_record",
      }),
    );
  });
});
