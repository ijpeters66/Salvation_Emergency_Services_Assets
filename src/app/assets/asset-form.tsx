import type { AssetRow, AssetCategoryRow } from "@/lib/assets/service";
import { assetStatusLabels } from "@/lib/assets/validation";
import { assetStatuses } from "@/lib/domain-types";
import type { LocationOption } from "@/lib/locations/service";

type AssetFormProps = {
  asset?: AssetRow;
  categories: AssetCategoryRow[];
  locations: LocationOption[];
};

function moneyValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

export function AssetFields({ asset, categories, locations }: AssetFormProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Unique asset ID
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.unique_asset_id}
          name="uniqueAssetId"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Asset name
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.asset_name}
          name="assetName"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Category
        <select
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
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Current location
        <select
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
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Status
        <select
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
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        QR code value
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.qr_code_value}
          name="qrCodeValue"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Serial number
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.serial_number ?? ""}
          name="serialNumber"
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
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Make
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.make ?? ""}
          name="make"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Model
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.model ?? ""}
          name="model"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Purchase cost
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={moneyValue(asset?.purchase_cost)}
          min="0"
          name="purchaseCost"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Replacement value
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={moneyValue(asset?.replacement_value)}
          min="0"
          name="replacementValue"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Current value
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={moneyValue(asset?.current_value)}
          min="0"
          name="currentValue"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
        Description
        <textarea
          className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.description ?? ""}
          name="description"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
        Notes
        <textarea
          className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
          defaultValue={asset?.notes ?? ""}
          name="notes"
        />
      </label>
    </div>
  );
}
