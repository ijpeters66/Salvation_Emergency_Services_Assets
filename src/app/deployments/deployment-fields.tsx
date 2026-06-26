import { deploymentStatusLabels, deploymentStatuses } from "@/lib/deployments/service";
import { defaultMovementReasonSeeds } from "@/lib/settings";

type DeploymentFieldValue = {
  deployment_id: string;
  deployment_name: string;
  purpose_reason: string;
  deployment_location_site: string;
  team_name: string;
  team_leader: string | null;
  contact_number: string | null;
  start_datetime: string;
  expected_return_datetime: string | null;
  actual_return_datetime: string | null;
  status: string;
  notes: string | null;
  damage_fault_notes: string | null;
};

export function DeploymentFields({
  deployment,
  movementReasons = [...defaultMovementReasonSeeds],
}: {
  deployment?: DeploymentFieldValue;
  movementReasons?: string[];
}) {
  const toLocal = (value: string | null | undefined) => (value ? value.slice(0, 16) : "");

  return (
    <>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Deployment ID
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="deploymentId"
          defaultValue={deployment?.deployment_id ?? ""}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Name
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="deploymentName"
          defaultValue={deployment?.deployment_name ?? ""}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Purpose/reason
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="purposeReason"
          defaultValue={deployment?.purpose_reason ?? ""}
          required
        >
          <option value="" disabled>
            Choose reason
          </option>
          {movementReasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Location/site
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="deploymentLocationSite"
          defaultValue={deployment?.deployment_location_site ?? ""}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Team name
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="teamName"
          defaultValue={deployment?.team_name ?? ""}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Team leader
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="teamLeader"
          defaultValue={deployment?.team_leader ?? ""}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Contact number
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="contactNumber"
          defaultValue={deployment?.contact_number ?? ""}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Start
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="startDatetime"
          type="datetime-local"
          defaultValue={toLocal(deployment?.start_datetime)}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Expected return
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="expectedReturnDatetime"
          type="datetime-local"
          defaultValue={toLocal(deployment?.expected_return_datetime)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Actual return
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="actualReturnDatetime"
          type="datetime-local"
          defaultValue={toLocal(deployment?.actual_return_datetime)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Status
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="status"
          defaultValue={deployment?.status ?? "planned"}
        >
          {deploymentStatuses.map((status) => (
            <option key={status} value={status}>
              {deploymentStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
        Notes
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="notes"
          defaultValue={deployment?.notes ?? ""}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-3">
        Damage/fault notes
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          name="damageFaultNotes"
          defaultValue={deployment?.damage_fault_notes ?? ""}
        />
      </label>
    </>
  );
}
