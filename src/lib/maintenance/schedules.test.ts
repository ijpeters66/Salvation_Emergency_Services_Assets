import { describe, expect, it, vi } from "vitest";

import {
  getDateAlertState,
  getReadingAlertState,
  getScheduleAlertState,
  parseMaintenanceScheduleFormData,
  upsertMaintenanceScheduleRecord,
  type MaintenanceScheduleDependencies,
  type MaintenanceScheduleRow,
} from "@/lib/maintenance/schedules";
import { ok } from "@/lib/result";

const assetId = "11111111-1111-4111-8111-111111111111";
const scheduleId = "22222222-2222-4222-8222-222222222222";

function createSchedule(overrides: Partial<MaintenanceScheduleRow> = {}): MaintenanceScheduleRow {
  return {
    id: scheduleId,
    asset_id: assetId,
    maintenance_type: "Annual service",
    service_interval_date: 365,
    service_interval_odometer: null,
    service_interval_hours: null,
    next_service_due_date: "2026-06-25",
    next_service_due_reading: null,
    service_provider: null,
    reminder_threshold_days: 30,
    status: "active",
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDependencies(): MaintenanceScheduleDependencies {
  return {
    upsertSchedule: vi.fn(async (payload) =>
      ok({
        ...createSchedule(),
        ...payload,
        id: payload.id ?? scheduleId,
        created_at: "2026-06-18T00:00:00.000Z",
        updated_at: "2026-06-18T00:00:00.000Z",
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("maintenance schedules", () => {
  it("calculates date-based due soon and overdue states", () => {
    const today = new Date("2026-06-18T00:00:00.000Z");

    expect(getDateAlertState("2026-06-25", 30, today)).toBe("due_soon");
    expect(getDateAlertState("2026-06-17", 30, today)).toBe("overdue");
    expect(getDateAlertState("2026-08-01", 30, today)).toBe("not_due");
  });

  it("calculates reading-based due soon and overdue states", () => {
    expect(getReadingAlertState(9500, 10000, 500)).toBe("due_soon");
    expect(getReadingAlertState(10001, 10000, 500)).toBe("overdue");
    expect(getReadingAlertState(9000, 10000, 500)).toBe("not_due");
  });

  it("combines schedule date and reading states", () => {
    const schedule = createSchedule({
      next_service_due_date: "2026-08-01",
      next_service_due_reading: 10000,
    });

    expect(getScheduleAlertState(schedule, 9800, new Date("2026-06-18T00:00:00.000Z"))).toBe(
      "due_soon",
    );
    expect(
      getScheduleAlertState(
        { ...schedule, status: "paused" },
        11000,
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toBe("not_due");
  });

  it("parses create and edit schedule form data", () => {
    const formData = new FormData();
    formData.set("scheduleId", scheduleId);
    formData.set("assetId", assetId);
    formData.set("maintenanceType", "Pump service");
    formData.set("serviceIntervalDate", "180");
    formData.set("serviceIntervalOdometer", "5000");
    formData.set("serviceIntervalHours", "125.5");
    formData.set("nextServiceDueDate", "2026-07-01");
    formData.set("nextServiceDueReading", "12000");
    formData.set("serviceProvider", "Local mechanic");
    formData.set("reminderThresholdDays", "14");
    formData.set("status", "active");

    const result = parseMaintenanceScheduleFormData(formData);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(
      expect.objectContaining({
        scheduleId,
        assetId,
        maintenanceType: "Pump service",
        serviceIntervalDate: 180,
        serviceIntervalOdometer: 5000,
        serviceIntervalHours: 125.5,
        nextServiceDueDate: "2026-07-01",
        nextServiceDueReading: 12000,
        serviceProvider: "Local mechanic",
        reminderThresholdDays: 14,
      }),
    );
  });

  it("upserts maintenance schedules and writes audit log", async () => {
    const dependencies = createDependencies();
    const input = {
      scheduleId,
      assetId,
      maintenanceType: "Annual service",
      serviceIntervalDate: 365,
      serviceIntervalOdometer: null,
      serviceIntervalHours: null,
      nextServiceDueDate: "2026-06-25",
      nextServiceDueReading: null,
      serviceProvider: "Local mechanic",
      reminderThresholdDays: 30,
      status: "active" as const,
    };

    const result = await upsertMaintenanceScheduleRecord(dependencies, input, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.upsertSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        id: scheduleId,
        asset_id: assetId,
        maintenance_type: "Annual service",
        updated_by: "user-1",
      }),
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "maintenance.schedule.upsert",
        recordType: "maintenance_schedule",
        recordId: scheduleId,
      }),
    );
  });
});
