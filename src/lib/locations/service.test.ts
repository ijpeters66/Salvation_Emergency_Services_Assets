import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/result";
import {
  archiveLocationRecord,
  buildLocationArchivePayload,
  buildLocationInsertPayload,
  createLocationRecord,
  toLocationOptions,
  type LocationMutationDependencies,
  type LocationRow,
} from "@/lib/locations/service";
import type { LocationFormInput } from "@/lib/locations/validation";

const locationInput: LocationFormInput = {
  name: "Ballarat Warehouse",
  type: "warehouse",
  address: "12 Example Street",
  state: "Victoria",
  notes: null,
};

const locationRow: LocationRow = {
  id: "location-1",
  ...locationInput,
  archived_at: null,
  created_at: "2026-06-16T00:00:00.000Z",
  updated_at: "2026-06-16T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
};

function createDependencies(): LocationMutationDependencies {
  return {
    insertLocation: vi.fn(async () => ok(locationRow)),
    updateLocation: vi.fn(async () => ok(locationRow)),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("location service", () => {
  it("builds insert payloads with ownership fields", () => {
    expect(buildLocationInsertPayload(locationInput, "user-1")).toEqual({
      name: "Ballarat Warehouse",
      type: "warehouse",
      address: "12 Example Street",
      state: "Victoria",
      notes: null,
      created_by: "user-1",
      updated_by: "user-1",
    });
  });

  it("builds archive payloads", () => {
    expect(buildLocationArchivePayload("user-1", new Date("2026-06-16T00:00:00.000Z"))).toEqual({
      archived_at: "2026-06-16T00:00:00.000Z",
      updated_by: "user-1",
    });
  });

  it("logs audit entries when creating locations", async () => {
    const dependencies = createDependencies();

    const result = await createLocationRecord(dependencies, locationInput, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.insertLocation).toHaveBeenCalledOnce();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        actionType: "location.create",
        recordType: "location",
        recordId: "location-1",
      }),
    );
  });

  it("logs audit entries when archiving locations", async () => {
    const dependencies = createDependencies();

    await archiveLocationRecord(
      dependencies,
      "location-1",
      "user-1",
      new Date("2026-06-16T00:00:00.000Z"),
    );

    expect(dependencies.updateLocation).toHaveBeenCalledWith("location-1", {
      archived_at: "2026-06-16T00:00:00.000Z",
      updated_by: "user-1",
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "location.archive",
        recordId: "location-1",
      }),
    );
  });

  it("creates active location options for future forms", () => {
    const archivedLocation = {
      ...locationRow,
      id: "location-2",
      name: "Archived Store",
      archived_at: "2026-06-16T00:00:00.000Z",
    };

    expect(toLocationOptions([archivedLocation, locationRow])).toEqual([
      {
        value: "location-1",
        label: "Ballarat Warehouse",
      },
    ]);
  });
});
