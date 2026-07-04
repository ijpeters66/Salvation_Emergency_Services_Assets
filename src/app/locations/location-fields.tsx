"use client";

import { FieldHint, FormSection } from "@/components/form-helpers";
import { FieldError, useFieldError } from "@/components/form-validation";
import { locationTypeLabels, locationTypes } from "@/lib/locations/validation";

export function LocationFields({
  defaults,
}: {
  defaults?: {
    name: string;
    type: string;
    address: string | null;
    state: string;
    notes: string | null;
  };
}) {
  const nameError = useFieldError("name");
  const typeError = useFieldError("type");
  const stateError = useFieldError("state");

  return (
    <div className="grid gap-4">
      <FormSection
        description="Use the clearest location name staff will recognise in the field."
        title="Identity"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Name
            <input
              aria-invalid={Boolean(nameError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.name}
              name="name"
              placeholder="Hamilton Depot"
              required
            />
            <FieldError name="name" />
            <FieldHint>Short names are easier to scan on tablets and in tables.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Type
            <select
              aria-invalid={Boolean(typeError)}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.type ?? "warehouse"}
              name="type"
              required
            >
              {locationTypes.map((type) => (
                <option key={type} value={type}>
                  {locationTypeLabels[type]}
                </option>
              ))}
            </select>
            <FieldError name="type" />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Address details help staff and reporting tools locate the site."
        title="Address"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Address
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.address ?? ""}
              name="address"
              placeholder="12 Example Rd"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            State
            <input
              aria-invalid={Boolean(stateError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.state ?? "Victoria"}
              name="state"
              required
            />
            <FieldError name="state" />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Notes are for access instructions, local quirks, or handover details."
        title="Notes"
      >
        <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
          Notes
          <textarea
            className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
            defaultValue={defaults?.notes ?? ""}
            name="notes"
            placeholder="Access notes, opening hours, or site-specific instructions"
          />
        </label>
      </FormSection>
    </div>
  );
}
