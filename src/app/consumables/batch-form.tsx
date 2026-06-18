import type { ConsumableBatchRow, ConsumableItemRow } from "@/lib/consumables/service";
import type { LocationOption } from "@/lib/locations/service";

type BatchFieldsProps = {
  batch?: ConsumableBatchRow;
  items: ConsumableItemRow[];
  locations: LocationOption[];
  lockQuantityOnHand?: boolean;
};

function numberValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

export function BatchFields({
  batch,
  items,
  locations,
  lockQuantityOnHand = false,
}: BatchFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Item
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.item_id ?? ""}
          name="itemId"
          required
        >
          <option value="" disabled>
            Choose item
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Batch/lot number
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.batch_lot_number}
          name="batchLotNumber"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Quantity received
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.quantity_received ?? 0}
          min="0"
          name="quantityReceived"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Quantity on hand
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.quantity_on_hand ?? 0}
          min="0"
          name="quantityOnHand"
          readOnly={lockQuantityOnHand}
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Unit cost
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={numberValue(batch?.unit_cost)}
          min="0"
          name="unitCost"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Replacement cost
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={numberValue(batch?.replacement_cost)}
          min="0"
          name="replacementCost"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Date received
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.date_received}
          name="dateReceived"
          required
          type="date"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Expiry date
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.expiry_date ?? ""}
          name="expiryDate"
          type="date"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
        Location
        <select
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.location_id ?? ""}
          name="locationId"
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
        Supplier/donor
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.supplier_donor ?? ""}
          name="supplierDonor"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
        QR code value
        <input
          className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
          defaultValue={batch?.qr_code_value}
          name="qrCodeValue"
        />
      </label>
    </div>
  );
}
