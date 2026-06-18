import { z } from "zod";

import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export type MaintenanceScheduleRow = Database["public"]["Tables"]["maintenance_schedule"]["Row"];
export type MaintenanceScheduleInsert =
  Database["public"]["Tables"]["maintenance_schedule"]["Insert"];
export type MaintenanceScheduleUpdate =
  Database["public"]["Tables"]["maintenance_schedule"]["Update"];

export type MaintenanceAlertState = "not_due" | "due_soon" | "overdue";

export type MaintenanceScheduleDependencies = {
  upsertSchedule(payload: MaintenanceScheduleInsert): Promise<AppResult<MaintenanceScheduleRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalInteger = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().int().nonnegative().nullable());

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().nonnegative().nullable());

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const maintenanceScheduleSchema = z.object({
  scheduleId: z.string().uuid().nullable(),
  assetId: z.string().uuid(),
  maintenanceType: z.string().trim().min(2, "Maintenance type is required."),
  serviceIntervalDate: optionalInteger,
  serviceIntervalOdometer: optionalInteger,
  serviceIntervalHours: optionalNumber,
  nextServiceDueDate: optionalDate,
  nextServiceDueReading: optionalNumber,
  serviceProvider: optionalText,
  reminderThresholdDays: optionalInteger,
  status: z.enum(["active", "paused", "archived"]).default("active"),
});

export type MaintenanceScheduleInput = z.infer<typeof maintenanceScheduleSchema>;

export function parseMaintenanceScheduleFormData(formData: FormData) {
  const scheduleId = formData.get("scheduleId");

  return maintenanceScheduleSchema.safeParse({
    scheduleId: typeof scheduleId === "string" && scheduleId.length > 0 ? scheduleId : null,
    assetId: formData.get("assetId"),
    maintenanceType: formData.get("maintenanceType"),
    serviceIntervalDate: formData.get("serviceIntervalDate") ?? "",
    serviceIntervalOdometer: formData.get("serviceIntervalOdometer") ?? "",
    serviceIntervalHours: formData.get("serviceIntervalHours") ?? "",
    nextServiceDueDate: formData.get("nextServiceDueDate") ?? "",
    nextServiceDueReading: formData.get("nextServiceDueReading") ?? "",
    serviceProvider: formData.get("serviceProvider") ?? "",
    reminderThresholdDays: formData.get("reminderThresholdDays") ?? "",
    status: formData.get("status") || "active",
  });
}

export function getDateAlertState(
  dueDate: string | null,
  reminderThresholdDays = 30,
  today = new Date(),
): MaintenanceAlertState {
  if (!dueDate) return "not_due";

  const dueAt = new Date(`${dueDate}T00:00:00.000Z`);
  const todayAt = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const diffDays = Math.floor((dueAt.getTime() - todayAt.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return "overdue";
  if (diffDays <= reminderThresholdDays) return "due_soon";
  return "not_due";
}

export function getReadingAlertState(
  currentReading: number | null,
  dueReading: number | null,
  reminderThreshold = 500,
): MaintenanceAlertState {
  if (currentReading == null || dueReading == null) return "not_due";
  const remaining = dueReading - currentReading;
  if (remaining < 0) return "overdue";
  if (remaining <= reminderThreshold) return "due_soon";
  return "not_due";
}

export function getScheduleAlertState(
  schedule: MaintenanceScheduleRow,
  currentReading: number | null = null,
  today = new Date(),
): MaintenanceAlertState {
  if (schedule.status !== "active") return "not_due";
  const dateState = getDateAlertState(
    schedule.next_service_due_date,
    schedule.reminder_threshold_days ?? 30,
    today,
  );
  const readingState = getReadingAlertState(currentReading, schedule.next_service_due_reading);
  if (dateState === "overdue" || readingState === "overdue") return "overdue";
  if (dateState === "due_soon" || readingState === "due_soon") return "due_soon";
  return "not_due";
}

export function buildMaintenanceSchedulePayload(
  input: MaintenanceScheduleInput,
  userId: string,
): MaintenanceScheduleInsert {
  return {
    id: input.scheduleId ?? undefined,
    asset_id: input.assetId,
    maintenance_type: input.maintenanceType,
    service_interval_date: input.serviceIntervalDate,
    service_interval_odometer: input.serviceIntervalOdometer,
    service_interval_hours: input.serviceIntervalHours,
    next_service_due_date: input.nextServiceDueDate,
    next_service_due_reading: input.nextServiceDueReading,
    service_provider: input.serviceProvider,
    reminder_threshold_days: input.reminderThresholdDays,
    status: input.status,
    created_by: userId,
    updated_by: userId,
  };
}

export async function upsertMaintenanceScheduleRecord(
  dependencies: MaintenanceScheduleDependencies,
  input: MaintenanceScheduleInput,
  userId: string,
) {
  const result = await dependencies.upsertSchedule(buildMaintenanceSchedulePayload(input, userId));
  if (!result.ok) return result;
  await dependencies.writeAuditLog({
    userId,
    actionType: "maintenance.schedule.upsert",
    recordType: "maintenance_schedule",
    recordId: result.data.id,
    newValue: result.data,
  });
  return ok(result.data);
}
