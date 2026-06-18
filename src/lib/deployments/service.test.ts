import { describe, expect, it, vi } from "vitest";

import type { DeploymentRow } from "@/lib/deployments/service";
import {
  canTransitionDeploymentStatus,
  createDeploymentRecord,
  deploymentFormSchema,
  updateDeploymentRecord,
  type DeploymentDependencies,
} from "@/lib/deployments/service";
import { ok } from "@/lib/result";

function createDeployment(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    deployment_id: "DEP-001",
    deployment_name: "Community relief shift",
    purpose_reason: "Storm support",
    deployment_location_site: "Warrnambool",
    team_name: "Operations",
    team_leader: null,
    contact_number: null,
    start_datetime: "2026-06-18T09:00:00.000Z",
    expected_return_datetime: null,
    actual_return_datetime: null,
    status: "planned",
    notes: null,
    damage_fault_notes: null,
    created_by: "user-1",
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    ...overrides,
  };
}

function createDependencies(): DeploymentDependencies {
  return {
    insertDeployment: vi.fn(async (payload) => ok(createDeployment(payload))),
    updateDeployment: vi.fn(async (_id, payload) => ok(createDeployment(payload))),
    writeAuditLog: vi.fn(async () => ok({})),
  };
}

describe("deployments", () => {
  it("validates deployment form input", () => {
    const result = deploymentFormSchema.parse({
      deploymentId: "DEP-001",
      deploymentName: "Community relief shift",
      purposeReason: "Storm support",
      deploymentLocationSite: "Warrnambool",
      teamName: "Operations",
      teamLeader: "",
      contactNumber: "",
      startDatetime: "2026-06-18T09:00",
      expectedReturnDatetime: "",
      actualReturnDatetime: "",
      status: "planned",
      notes: "",
      damageFaultNotes: "",
    });

    expect(result.teamLeader).toBeNull();
    expect(result.status).toBe("planned");
  });

  it("validates status transitions", () => {
    expect(canTransitionDeploymentStatus("planned", "active")).toBe(true);
    expect(canTransitionDeploymentStatus("active", "returned")).toBe(true);
    expect(canTransitionDeploymentStatus("returned", "closed")).toBe(true);
    expect(canTransitionDeploymentStatus("closed", "active")).toBe(false);
    expect(canTransitionDeploymentStatus("returned", "active")).toBe(false);
  });

  it("creates deployments and writes audit log", async () => {
    const dependencies = createDependencies();
    const input = deploymentFormSchema.parse({
      deploymentId: "DEP-001",
      deploymentName: "Community relief shift",
      purposeReason: "Storm support",
      deploymentLocationSite: "Warrnambool",
      teamName: "Operations",
      teamLeader: "",
      contactNumber: "",
      startDatetime: "2026-06-18T09:00",
      expectedReturnDatetime: "",
      actualReturnDatetime: "",
      status: "planned",
      notes: "",
      damageFaultNotes: "",
    });

    const result = await createDeploymentRecord(dependencies, input, "user-1");

    expect(result.ok).toBe(true);
    expect(dependencies.insertDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        deployment_id: "DEP-001",
        created_by: "user-1",
      }),
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "deployment.create",
        recordType: "deployment",
      }),
    );
  });

  it("updates deployments and blocks invalid transitions", async () => {
    const dependencies = createDependencies();
    const current = createDeployment({ status: "closed" });
    const input = deploymentFormSchema.parse({
      deploymentId: "DEP-001",
      deploymentName: "Community relief shift",
      purposeReason: "Storm support",
      deploymentLocationSite: "Warrnambool",
      teamName: "Operations",
      teamLeader: "",
      contactNumber: "",
      startDatetime: "2026-06-18T09:00",
      expectedReturnDatetime: "",
      actualReturnDatetime: "",
      status: "active",
      notes: "",
      damageFaultNotes: "",
    });

    const result = await updateDeploymentRecord(dependencies, current, input, "user-1");

    expect(result.ok).toBe(false);
    expect(dependencies.updateDeployment).not.toHaveBeenCalled();
  });
});
