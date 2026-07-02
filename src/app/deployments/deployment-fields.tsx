import { deploymentStatusLabels, deploymentStatuses } from "@/lib/deployments/service";
import { defaultMovementReasonSeeds } from "@/lib/settings";
import { FieldHint, FormSection } from "@/components/form-helpers";

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
    <div className="grid gap-4 md:col-span-3">
      <FormSection
        description="Unique identifiers and the purpose of the deployment."
        title="Identity and purpose"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Deployment ID
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="deploymentId"
              defaultValue={deployment?.deployment_id ?? ""}
              placeholder="DEP-2026-001"
              required
            />
            <FieldHint>Keep this short and unique for phone, radio, and QR references.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="deploymentName"
              defaultValue={deployment?.deployment_name ?? ""}
              placeholder="Flood response - Hamilton"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
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
        </div>
      </FormSection>

      <FormSection
        description="Where the deployment is happening and who is on point."
        title="Crew and location"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Location/site
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="deploymentLocationSite"
              defaultValue={deployment?.deployment_location_site ?? ""}
              placeholder="Hamilton Fire Station"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Team name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="teamName"
              defaultValue={deployment?.team_name ?? ""}
              placeholder="Crew A"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Team leader
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="teamLeader"
              defaultValue={deployment?.team_leader ?? ""}
              placeholder="Leader name"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Contact number
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="contactNumber"
              defaultValue={deployment?.contact_number ?? ""}
              placeholder="+61..."
              type="tel"
            />
            <FieldHint>Use the best number for the crew while they are on site.</FieldHint>
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Start and return timing for the deployment window."
        title="Timing"
      >
        <div className="grid gap-3 md:grid-cols-3">
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
        </div>
      </FormSection>

      <FormSection
        description="Use status and notes to keep the handover trail readable."
        title="Status and notes"
      >
        <div className="grid gap-3 md:grid-cols-3">
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
              placeholder="General notes or handover details"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-3">
            Damage/fault notes
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="damageFaultNotes"
              defaultValue={deployment?.damage_fault_notes ?? ""}
              placeholder="Damage noted on return, missing items, or faults"
            />
          </label>
        </div>
      </FormSection>
    </div>
  );
}
