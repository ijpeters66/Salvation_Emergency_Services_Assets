import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";
import type { LocationFormInput } from "@/lib/locations/validation";

export type LocationRow = Database["public"]["Tables"]["location"]["Row"];
export type LocationInsert = Database["public"]["Tables"]["location"]["Insert"];
export type LocationUpdate = Database["public"]["Tables"]["location"]["Update"];

export type LocationOption = {
  value: string;
  label: string;
};

export type LocationMutationDependencies = {
  insertLocation(payload: LocationInsert): Promise<AppResult<LocationRow>>;
  updateLocation(id: string, payload: LocationUpdate): Promise<AppResult<LocationRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function buildLocationInsertPayload(
  input: LocationFormInput,
  userId: string,
): LocationInsert {
  return {
    name: input.name,
    type: input.type,
    address: input.address,
    state: input.state || "Victoria",
    notes: input.notes,
    created_by: userId,
    updated_by: userId,
  };
}

export function buildLocationUpdatePayload(
  input: LocationFormInput,
  userId: string,
): LocationUpdate {
  return {
    name: input.name,
    type: input.type,
    address: input.address,
    state: input.state || "Victoria",
    notes: input.notes,
    updated_by: userId,
  };
}

export function buildLocationArchivePayload(
  userId: string,
  archivedAt = new Date(),
): LocationUpdate {
  return {
    archived_at: archivedAt.toISOString(),
    updated_by: userId,
  };
}

export function toLocationOptions(locations: LocationRow[]): LocationOption[] {
  return locations
    .filter((location) => !location.archived_at)
    .map((location) => ({
      value: location.id,
      label: location.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function createLocationRecord(
  dependencies: LocationMutationDependencies,
  input: LocationFormInput,
  userId: string,
) {
  const payload = buildLocationInsertPayload(input, userId);
  const result = await dependencies.insertLocation(payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "location.create",
    recordType: "location",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function updateLocationRecord(
  dependencies: LocationMutationDependencies,
  id: string,
  input: LocationFormInput,
  userId: string,
) {
  const payload = buildLocationUpdatePayload(input, userId);
  const result = await dependencies.updateLocation(id, payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "location.update",
    recordType: "location",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function archiveLocationRecord(
  dependencies: LocationMutationDependencies,
  id: string,
  userId: string,
  archivedAt = new Date(),
) {
  const payload = buildLocationArchivePayload(userId, archivedAt);
  const result = await dependencies.updateLocation(id, payload);

  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "location.archive",
    recordType: "location",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}
