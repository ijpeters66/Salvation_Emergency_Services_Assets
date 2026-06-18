import { z } from "zod";

import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import { ok, type AppResult } from "@/lib/result";

export const deploymentStatuses = ["planned", "active", "returned", "closed"] as const;
export type DeploymentStatus = (typeof deploymentStatuses)[number];

export const deploymentStatusLabels: Record<DeploymentStatus, string> = {
  planned: "Planned",
  active: "Active",
  returned: "Returned",
  closed: "Closed",
};

export type DeploymentRow = Database["public"]["Tables"]["deployment"]["Row"];
export type DeploymentInsert = Database["public"]["Tables"]["deployment"]["Insert"];
export type DeploymentUpdate = Database["public"]["Tables"]["deployment"]["Update"];

export type DeploymentDependencies = {
  insertDeployment(payload: DeploymentInsert): Promise<AppResult<DeploymentRow>>;
  updateDeployment(id: string, payload: DeploymentUpdate): Promise<AppResult<DeploymentRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalDateTime = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const deploymentFormSchema = z.object({
  deploymentId: z.string().trim().min(2, "Deployment ID is required."),
  deploymentName: z.string().trim().min(2, "Deployment name is required."),
  purposeReason: z.string().trim().min(2, "Purpose/reason is required."),
  deploymentLocationSite: z.string().trim().min(2, "Location/site is required."),
  teamName: z.string().trim().min(2, "Team name is required."),
  teamLeader: optionalText,
  contactNumber: optionalText,
  startDatetime: z.string().trim().min(1, "Start date/time is required."),
  expectedReturnDatetime: optionalDateTime,
  actualReturnDatetime: optionalDateTime,
  status: z.enum(deploymentStatuses),
  notes: optionalText,
  damageFaultNotes: optionalText,
});

export type DeploymentFormInput = z.infer<typeof deploymentFormSchema>;

export function parseDeploymentFormData(formData: FormData) {
  return deploymentFormSchema.safeParse({
    deploymentId: formData.get("deploymentId"),
    deploymentName: formData.get("deploymentName"),
    purposeReason: formData.get("purposeReason"),
    deploymentLocationSite: formData.get("deploymentLocationSite"),
    teamName: formData.get("teamName"),
    teamLeader: formData.get("teamLeader") ?? "",
    contactNumber: formData.get("contactNumber") ?? "",
    startDatetime: formData.get("startDatetime"),
    expectedReturnDatetime: formData.get("expectedReturnDatetime") ?? "",
    actualReturnDatetime: formData.get("actualReturnDatetime") ?? "",
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
    damageFaultNotes: formData.get("damageFaultNotes") ?? "",
  });
}

export function canTransitionDeploymentStatus(from: DeploymentStatus, to: DeploymentStatus) {
  if (from === to) return true;
  const allowed: Record<DeploymentStatus, DeploymentStatus[]> = {
    planned: ["active", "closed"],
    active: ["returned", "closed"],
    returned: ["closed"],
    closed: [],
  };
  return allowed[from].includes(to);
}

function toIsoDatetime(value: string | null) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function buildDeploymentInsertPayload(
  input: DeploymentFormInput,
  userId: string,
): DeploymentInsert {
  return {
    deployment_id: input.deploymentId,
    deployment_name: input.deploymentName,
    purpose_reason: input.purposeReason,
    deployment_location_site: input.deploymentLocationSite,
    team_name: input.teamName,
    team_leader: input.teamLeader,
    contact_number: input.contactNumber,
    start_datetime: toIsoDatetime(input.startDatetime) ?? input.startDatetime,
    expected_return_datetime: toIsoDatetime(input.expectedReturnDatetime),
    actual_return_datetime: toIsoDatetime(input.actualReturnDatetime),
    status: input.status,
    notes: input.notes,
    damage_fault_notes: input.damageFaultNotes,
    created_by: userId,
  };
}

export function buildDeploymentUpdatePayload(input: DeploymentFormInput): DeploymentUpdate {
  return {
    deployment_id: input.deploymentId,
    deployment_name: input.deploymentName,
    purpose_reason: input.purposeReason,
    deployment_location_site: input.deploymentLocationSite,
    team_name: input.teamName,
    team_leader: input.teamLeader,
    contact_number: input.contactNumber,
    start_datetime: toIsoDatetime(input.startDatetime) ?? input.startDatetime,
    expected_return_datetime: toIsoDatetime(input.expectedReturnDatetime),
    actual_return_datetime: toIsoDatetime(input.actualReturnDatetime),
    status: input.status,
    notes: input.notes,
    damage_fault_notes: input.damageFaultNotes,
  };
}

export async function createDeploymentRecord(
  dependencies: DeploymentDependencies,
  input: DeploymentFormInput,
  userId: string,
) {
  const result = await dependencies.insertDeployment(buildDeploymentInsertPayload(input, userId));
  if (!result.ok) return result;

  await dependencies.writeAuditLog({
    userId,
    actionType: "deployment.create",
    recordType: "deployment",
    recordId: result.data.id,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function updateDeploymentRecord(
  dependencies: DeploymentDependencies,
  current: DeploymentRow,
  input: DeploymentFormInput,
  userId: string,
) {
  if (
    !canTransitionDeploymentStatus(
      current.status as DeploymentStatus,
      input.status as DeploymentStatus,
    )
  ) {
    return { ok: false, error: "Invalid deployment status transition." } as const;
  }

  const result = await dependencies.updateDeployment(
    current.id,
    buildDeploymentUpdatePayload(input),
  );
  if (!result.ok) return result;

  await dependencies.writeAuditLog({
    userId,
    actionType: "deployment.update",
    recordType: "deployment",
    recordId: result.data.id,
    oldValue: current,
    newValue: result.data,
  });

  return ok(result.data);
}
