import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalMoney = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().nonnegative().nullable());

export const consumableItemFormSchema = z.object({
  name: z.string().trim().min(2, "Item name is required."),
  categoryId: z.string().uuid("Choose a category."),
  description: optionalText,
});

export const consumableBatchFormSchema = z
  .object({
    itemId: z.string().uuid("Choose an item."),
    batchLotNumber: z.string().trim().min(1, "Batch or lot number is required."),
    quantityReceived: z.coerce.number().int().nonnegative(),
    quantityOnHand: z.coerce.number().int().nonnegative(),
    unitCost: optionalMoney,
    replacementCost: optionalMoney,
    dateReceived: z.string().trim().min(1, "Date received is required."),
    supplierDonor: optionalText,
    expiryDate: optionalDate,
    locationId: z.string().uuid("Choose a location."),
    qrCodeValue: z.string().trim().optional(),
  })
  .refine((value) => value.quantityOnHand <= value.quantityReceived, {
    message: "Quantity on hand cannot exceed quantity received.",
    path: ["quantityOnHand"],
  });

export type ConsumableItemFormInput = z.infer<typeof consumableItemFormSchema>;
export type ConsumableBatchFormInput = z.infer<typeof consumableBatchFormSchema>;

export function buildConsumableQrCodeValue(itemName: string, batchLotNumber: string) {
  const item = itemName.trim().toUpperCase().replace(/\s+/g, "-");
  const batch = batchLotNumber.trim().toUpperCase().replace(/\s+/g, "-");

  return `SAES-CONSUMABLE:${item}:${batch}`;
}

export function parseConsumableItemFormData(formData: FormData) {
  return consumableItemFormSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? "",
  });
}

export function parseConsumableBatchFormData(formData: FormData, itemName = "BATCH") {
  const batchLotNumber = String(formData.get("batchLotNumber") ?? "");
  const qrCodeValue = String(formData.get("qrCodeValue") ?? "");

  return consumableBatchFormSchema.safeParse({
    itemId: formData.get("itemId"),
    batchLotNumber,
    quantityReceived: formData.get("quantityReceived"),
    quantityOnHand: formData.get("quantityOnHand"),
    unitCost: formData.get("unitCost") ?? "",
    replacementCost: formData.get("replacementCost") ?? "",
    dateReceived: formData.get("dateReceived"),
    supplierDonor: formData.get("supplierDonor") ?? "",
    expiryDate: formData.get("expiryDate") ?? "",
    locationId: formData.get("locationId"),
    qrCodeValue: qrCodeValue.trim() || buildConsumableQrCodeValue(itemName, batchLotNumber),
  });
}
