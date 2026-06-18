import { z } from "zod";

import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import type {
  MaintenanceScheduleRow,
  MaintenanceScheduleUpdate,
} from "@/lib/maintenance/schedules";
import { ok, type AppResult } from "@/lib/result";

export type MaintenanceRecordRow = Database["public"]["Tables"]["maintenance_record"]["Row"];
export type MaintenanceRecordInsert = Database["public"]["Tables"]["maintenance_record"]["Insert"];

export type MaintenanceRecordDependencies = {
  createRecord(payload: MaintenanceRecordInsert): Promise<AppResult<MaintenanceRecordRow>>;
  getSchedule(scheduleId: string): Promise<MaintenanceScheduleRow | null>;
  updateSchedule(
    scheduleId: string,
    payload: MaintenanceScheduleUpdate,
  ): Promise<AppResult<MaintenanceScheduleRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const optionalScheduleId = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(z.string().uuid().nullable());

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().nonnegative().nullable());

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const maintenanceRecordSchema = z.object({
  assetId: z.string().uuid(),
  maintenanceScheduleId: optionalScheduleId,
  date: z.string().trim().min(1, "Maintenance date is required."),
  serviceType: z.string().trim().min(2, "Service type is required."),
  description: z.string().trim().min(2, "Description is required."),
  cost: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? Number(value) : 0))
    .pipe(z.number().nonnegative()),
  supplierProvider: z.string().trim().min(2, "Supplier/provider is required."),
  odometerHourReading: optionalNumber,
  notes: optionalText,
});

export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>;

export function parseMaintenanceRecordFormData(formData: FormData) {
  return maintenanceRecordSchema.safeParse({
    assetId: formData.get("assetId"),
    maintenanceScheduleId: formData.get("maintenanceScheduleId") ?? "",
    date: formData.get("date"),
    serviceType: formData.get("serviceType"),
    description: formData.get("description"),
    cost: formData.get("cost") ?? "",
    supplierProvider: formData.get("supplierProvider"),
    odometerHourReading: formData.get("odometerHourReading") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function calculateNextServiceUpdate(
  schedule: MaintenanceScheduleRow,
  record: Pick<MaintenanceRecordInput, "date" | "odometerHourReading">,
  userId: string,
): MaintenanceScheduleUpdate {
  const nextDate = schedule.service_interval_date
    ? addDays(record.date, schedule.service_interval_date)
    : schedule.next_service_due_date;
  const readingInterval = schedule.service_interval_odometer ?? schedule.service_interval_hours;
  const nextReading =
    record.odometerHourReading != null && readingInterval != null
      ? record.odometerHourReading + readingInterval
      : schedule.next_service_due_reading;

  return {
    next_service_due_date: nextDate,
    next_service_due_reading: nextReading,
    updated_by: userId,
  };
}

export function buildMaintenanceRecordPayload(
  input: MaintenanceRecordInput,
  userId: string,
): MaintenanceRecordInsert {
  return {
    asset_id: input.assetId,
    maintenance_schedule_id: input.maintenanceScheduleId,
    date: input.date,
    service_type: input.serviceType,
    description: input.description,
    cost: input.cost,
    supplier_provider: input.supplierProvider,
    odometer_hour_reading: input.odometerHourReading,
    notes: input.notes,
    attachment_metadata: [],
    recorded_by: userId,
  };
}

export async function createMaintenanceRecord(
  dependencies: MaintenanceRecordDependencies,
  input: MaintenanceRecordInput,
  userId: string,
) {
  const recordResult = await dependencies.createRecord(
    buildMaintenanceRecordPayload(input, userId),
  );
  if (!recordResult.ok) return recordResult;

  let updatedSchedule: MaintenanceScheduleRow | null = null;
  if (input.maintenanceScheduleId) {
    const schedule = await dependencies.getSchedule(input.maintenanceScheduleId);
    if (schedule) {
      const scheduleResult = await dependencies.updateSchedule(
        schedule.id,
        calculateNextServiceUpdate(schedule, input, userId),
      );
      if (!scheduleResult.ok) return scheduleResult;
      updatedSchedule = scheduleResult.data;
    }
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "maintenance.record.create",
    recordType: "maintenance_record",
    recordId: recordResult.data.id,
    newValue: {
      record: recordResult.data,
      updatedSchedule,
      attachmentsPrepared: true,
    },
  });

  return ok(recordResult.data);
}
