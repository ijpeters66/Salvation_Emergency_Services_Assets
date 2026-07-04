"use client";

import type { AssetCategoryRow, AssetRow } from "@/lib/assets/service";
import type { PlantDetailsRow } from "@/lib/assets/plant";
import { assetStatusLabels } from "@/lib/assets/validation";
import { assetStatuses } from "@/lib/domain-types";
import type { LocationOption } from "@/lib/locations/service";
import { FieldHint, FormSection } from "@/components/form-helpers";
import { FieldError, useFieldError } from "@/components/form-validation";

type AssetFormProps = {
  asset?: AssetRow;
  plantDetails?: PlantDetailsRow | null;
  categories: AssetCategoryRow[];
  locations: LocationOption[];
};

function moneyValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

export function AssetFields({ asset, plantDetails, categories, locations }: AssetFormProps) {
  const uniqueAssetIdError = useFieldError("uniqueAssetId");
  const assetNameError = useFieldError("assetName");
  const categoryIdError = useFieldError("categoryId");
  const currentLocationIdError = useFieldError("currentLocationId");
  const statusError = useFieldError("status");
  const purchaseCostError = useFieldError("purchaseCost");
  const replacementValueError = useFieldError("replacementValue");
  const currentValueError = useFieldError("currentValue");
  const registrationNumberError = useFieldError("registrationNumber");
  const registrationExpiryError = useFieldError("registrationExpiry");
  const insuranceExpiryError = useFieldError("insuranceExpiry");
  const roadworthyComplianceDateError = useFieldError("roadworthyComplianceDate");
  const odometerReadingError = useFieldError("odometerReading");
  const hourMeterReadingError = useFieldError("hourMeterReading");

  return (
    <div className="grid gap-4">
      <FormSection
        description="Core identity and location fields that staff use when finding or scanning an asset."
        title="Identity and location"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Unique asset ID
            <input
              aria-invalid={Boolean(uniqueAssetIdError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.unique_asset_id}
              name="uniqueAssetId"
              placeholder="SAES-TRAILER-001"
              required
            />
            <FieldError name="uniqueAssetId" />
            <FieldHint>Use the same ID printed on the QR label and kept stable over time.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Asset name
            <input
              aria-invalid={Boolean(assetNameError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.asset_name}
              name="assetName"
              placeholder="Trailer 2"
              required
            />
            <FieldError name="assetName" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Category
            <select
              aria-invalid={Boolean(categoryIdError)}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.category_id ?? ""}
              name="categoryId"
              required
            >
              <option value="" disabled>
                Choose category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError name="categoryId" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Current location
            <select
              aria-invalid={Boolean(currentLocationIdError)}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.current_location_id ?? ""}
              name="currentLocationId"
              required
            >
              <option value="" disabled>
                Choose location
              </option>
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <FieldError name="currentLocationId" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            QR code value
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.qr_code_value}
              name="qrCodeValue"
              placeholder="Optional custom scan payload"
            />
            <FieldHint>Leave blank to use the default asset QR payload from the register.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Status
            <select
              aria-invalid={Boolean(statusError)}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.status ?? "available"}
              name="status"
              required
            >
              {assetStatuses.map((status) => (
                <option key={status} value={status}>
                  {assetStatusLabels[status]}
                </option>
              ))}
            </select>
            <FieldError name="status" />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Common operational details staff will use when moving or checking the asset."
        title="Operational details"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Serial number
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.serial_number ?? ""}
              name="serialNumber"
              placeholder="Manufacturer serial"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Purchase date
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.purchase_date ?? ""}
              name="purchaseDate"
              type="date"
            />
            <FieldHint>Use the date the asset entered service or was purchased.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Make
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.make ?? ""}
              name="make"
              placeholder="Toyota"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Model
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.model ?? ""}
              name="model"
              placeholder="HiAce"
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Keep values and free text grouped together so they are easy to review later."
        title="Value and notes"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Purchase cost
            <input
              aria-invalid={Boolean(purchaseCostError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={moneyValue(asset?.purchase_cost)}
              min="0"
              name="purchaseCost"
              step="0.01"
              type="number"
              inputMode="decimal"
            />
            <FieldError name="purchaseCost" />
            <FieldHint>Enter AUD only. Leave blank if the cost is unknown.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Replacement value
            <input
              aria-invalid={Boolean(replacementValueError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={moneyValue(asset?.replacement_value)}
              min="0"
              name="replacementValue"
              step="0.01"
              type="number"
              inputMode="decimal"
            />
            <FieldError name="replacementValue" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Current value
            <input
              aria-invalid={Boolean(currentValueError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={moneyValue(asset?.current_value)}
              min="0"
              name="currentValue"
              step="0.01"
              type="number"
              inputMode="decimal"
            />
            <FieldError name="currentValue" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
            Description
            <textarea
              className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.description ?? ""}
              name="description"
              placeholder="Short operational description"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
            Notes
            <textarea
              className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={asset?.notes ?? ""}
              name="notes"
              placeholder="Operational notes, condition notes, or special handling"
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        description="Plant fields only matter when the asset needs compliance tracking."
        title="Plant and fleet"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink)] md:col-span-2">
            <input defaultChecked={Boolean(plantDetails)} name="isPlant" type="checkbox" />
            Mark as plant/fleet item
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Registration number
            <input
              aria-invalid={Boolean(registrationNumberError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.registration_number ?? ""}
              name="registrationNumber"
              placeholder="ABC-123"
            />
            <FieldError name="registrationNumber" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Registration expiry
            <input
              aria-invalid={Boolean(registrationExpiryError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.registration_expiry ?? ""}
              name="registrationExpiry"
              type="date"
            />
            <FieldError name="registrationExpiry" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Insurance expiry
            <input
              aria-invalid={Boolean(insuranceExpiryError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.insurance_expiry ?? ""}
              name="insuranceExpiry"
              type="date"
            />
            <FieldError name="insuranceExpiry" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Roadworthy/compliance date
            <input
              aria-invalid={Boolean(roadworthyComplianceDateError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.roadworthy_compliance_date ?? ""}
              name="roadworthyComplianceDate"
              type="date"
            />
            <FieldError name="roadworthyComplianceDate" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Odometer reading
            <input
              aria-invalid={Boolean(odometerReadingError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.odometer_reading ?? ""}
              min="0"
              name="odometerReading"
              type="number"
              inputMode="numeric"
            />
            <FieldError name="odometerReading" />
            <FieldHint>Record whole kilometres only.</FieldHint>
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Hour meter reading
            <input
              aria-invalid={Boolean(hourMeterReadingError)}
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.hour_meter_reading ?? ""}
              min="0"
              name="hourMeterReading"
              step="0.1"
              type="number"
              inputMode="decimal"
            />
            <FieldError name="hourMeterReading" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Fuel type
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.fuel_type ?? ""}
              name="fuelType"
              placeholder="Diesel"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Service provider
            <input
              className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              defaultValue={plantDetails?.service_provider ?? ""}
              name="serviceProvider"
              placeholder="Local mechanic or dealer"
            />
          </label>
        </div>
      </FormSection>
    </div>
  );
}
