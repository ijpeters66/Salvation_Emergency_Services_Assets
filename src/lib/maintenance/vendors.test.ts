import { describe, expect, it, vi } from "vitest";

import {
  createMaintenanceVendorRecord,
  parseMaintenanceVendorFormData,
  toMaintenanceVendorNames,
  updateMaintenanceVendorRecord,
  type MaintenanceVendorDependencies,
  type MaintenanceVendorRow,
} from "@/lib/maintenance/vendors";
import { ok } from "@/lib/result";

const vendorId = "33333333-3333-4333-8333-333333333333";

function createVendor(overrides: Partial<MaintenanceVendorRow> = {}): MaintenanceVendorRow {
  return {
    id: vendorId,
    business_name: "Ballarat Fleet Service",
    contact_name: "Pat Taylor",
    phone: "03 5555 0101",
    email: "service@example.com",
    address: "12 Example Street, Ballarat",
    website: "https://example.com",
    notes: "Vehicles, trailers, generators",
    archived_at: null,
    created_at: "2026-06-20T00:00:00.000Z",
    updated_at: "2026-06-20T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    ...overrides,
  };
}

function createDependencies(): MaintenanceVendorDependencies {
  return {
    insertVendor: vi.fn(async (payload) =>
      ok({
        ...createVendor(),
        ...payload,
      }),
    ),
    updateVendor: vi.fn(async (_id, payload) =>
      ok({
        ...createVendor(),
        ...payload,
      }),
    ),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("maintenance vendors", () => {
  it("parses valid vendor fields", () => {
    const formData = new FormData();
    formData.set("businessName", "Ballarat Fleet Service");
    formData.set("contactName", "Pat Taylor");
    formData.set("phone", "03 5555 0101");
    formData.set("email", "service@example.com");
    formData.set("address", "12 Example Street");
    formData.set("website", "https://example.com");
    formData.set("notes", "Vehicles and trailers");

    const result = parseMaintenanceVendorFormData(formData);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.businessName).toBe("Ballarat Fleet Service");
    expect(result.data.email).toBe("service@example.com");
  });

  it("rejects invalid email and website fields", () => {
    const formData = new FormData();
    formData.set("businessName", "Ballarat Fleet Service");
    formData.set("email", "not-an-email");
    formData.set("website", "bad-url");

    const result = parseMaintenanceVendorFormData(formData);
    expect(result.success).toBe(false);
  });

  it("creates vendors and writes an audit log", async () => {
    const dependencies = createDependencies();
    const result = await createMaintenanceVendorRecord(
      dependencies,
      {
        vendorId: null,
        businessName: "Ballarat Fleet Service",
        contactName: "Pat Taylor",
        phone: "03 5555 0101",
        email: "service@example.com",
        address: "12 Example Street",
        website: "https://example.com",
        notes: "Vehicles and trailers",
      },
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(dependencies.insertVendor).toHaveBeenCalled();
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "maintenance.vendor.create",
        recordType: "maintenance_vendor",
      }),
    );
  });

  it("updates vendors and writes an audit log", async () => {
    const dependencies = createDependencies();
    const result = await updateMaintenanceVendorRecord(
      dependencies,
      vendorId,
      {
        vendorId,
        businessName: "Updated Vendor",
        contactName: null,
        phone: null,
        email: null,
        address: null,
        website: null,
        notes: null,
      },
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(dependencies.updateVendor).toHaveBeenCalledWith(
      vendorId,
      expect.objectContaining({ business_name: "Updated Vendor" }),
    );
  });

  it("returns sorted active vendor names", () => {
    expect(
      toMaintenanceVendorNames([
        createVendor({ business_name: "Zeta Mechanical" }),
        createVendor({ business_name: "Alpha Auto" }),
        createVendor({ business_name: "Archived Vendor", archived_at: "2026-06-20T00:00:00.000Z" }),
      ]),
    ).toEqual(["Alpha Auto", "Zeta Mechanical"]);
  });
});
