"use client";

import { useState } from "react";

import { FieldHint, FormSection } from "@/components/form-helpers";
import { FieldError, FormValidationProvider, issuesToFieldErrors, type FieldErrors } from "@/components/form-validation";
import { Button } from "@/components/ui/button";
import { maintenanceVendorSchema } from "@/lib/maintenance/vendors";

type VendorDefaults = {
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
};

function VendorFields({ defaults }: { defaults?: VendorDefaults }) {
  return (
    <div className="grid gap-4">
      <FormSection
        description="Who the vendor is and how to contact them."
        title="Identity and contact"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Business name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.business_name ?? ""}
              name="businessName"
              placeholder="Acme Service Centre"
              required
            />
            <FieldError name="businessName" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Contact name
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.contact_name ?? ""}
              name="contactName"
              placeholder="Primary contact"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Phone
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.phone ?? ""}
              name="phone"
              placeholder="03 5555 5555"
              type="tel"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Email
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.email ?? ""}
              name="email"
              placeholder="service@example.com"
              type="email"
            />
            <FieldError name="email" />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Optional details to help staff recognise the vendor later."
        title="Address and website"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Address
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.address ?? ""}
              name="address"
              placeholder="Street or mailing address"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Website
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={defaults?.website ?? ""}
              name="website"
              placeholder="https://..."
              type="url"
            />
            <FieldError name="website" />
            <FieldHint>Use the full URL so it opens correctly from the browser.</FieldHint>
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Notes can hold preferred contacts, SLA details, or job booking guidance."
        title="Notes"
      >
        <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
          Notes
          <textarea
            className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
            defaultValue={defaults?.notes ?? ""}
            name="notes"
            placeholder="Booking instructions or preferred contact method"
          />
        </label>
      </FormSection>
    </div>
  );
}

export function MaintenanceVendorForm({
  action,
  defaults,
  vendorId,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: VendorDefaults;
  vendorId?: string;
  submitLabel: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});

  return (
    <form
      action={action}
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const result = maintenanceVendorSchema.safeParse({
          vendorId: vendorId ?? null,
          businessName: formData.get("businessName"),
          contactName: formData.get("contactName") ?? "",
          phone: formData.get("phone") ?? "",
          email: formData.get("email") ?? "",
          address: formData.get("address") ?? "",
          website: formData.get("website") ?? "",
          notes: formData.get("notes") ?? "",
        });

        if (!result.success) {
          event.preventDefault();
          setErrors(issuesToFieldErrors(result.error.issues));
          return;
        }

        setErrors({});
      }}
    >
      <input name="vendorId" type="hidden" value={vendorId ?? ""} />
      <FormValidationProvider errors={errors}>
        <VendorFields defaults={defaults} />
        <div>
          <Button size="sm" type="submit">
            {submitLabel}
          </Button>
        </div>
      </FormValidationProvider>
    </form>
  );
}
