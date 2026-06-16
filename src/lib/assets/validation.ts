import { z } from "zod";

import { assetStatuses } from "@/lib/domain-types";

export const assetStatusLabels = {
  available: "Available",
  deployed: "Deployed",
  in_transit: "In transit",
  under_maintenance: "Under maintenance",
  damaged: "Damaged",
  retired: "Retired",
  lost_stolen: "Lost/Stolen",
} as const;

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

export const assetFormSchema = z.object({
  uniqueAssetId: z.string().trim().min(2, "Unique asset ID is required."),
  assetName: z.string().trim().min(2, "Asset name is required."),
  categoryId: z.string().uuid("Choose an asset category."),
  currentLocationId: z.string().uuid("Choose a current location."),
  status: z.enum(assetStatuses),
  qrCodeValue: z.string().trim().optional(),
  description: optionalText,
  serialNumber: optionalText,
  make: optionalText,
  model: optionalText,
  purchaseDate: optionalDate,
  purchaseCost: optionalMoney,
  replacementValue: optionalMoney,
  currentValue: optionalMoney,
  notes: optionalText,
});

export type AssetFormInput = z.infer<typeof assetFormSchema>;

export function normaliseAssetId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export function buildQrCodeValue(uniqueAssetId: string) {
  return `SAES-ASSET:${normaliseAssetId(uniqueAssetId)}`;
}

export function parseAssetFormData(formData: FormData) {
  const uniqueAssetId = String(formData.get("uniqueAssetId") ?? "");
  const qrCodeValue = String(formData.get("qrCodeValue") ?? "");

  return assetFormSchema.safeParse({
    uniqueAssetId,
    assetName: formData.get("assetName"),
    categoryId: formData.get("categoryId"),
    currentLocationId: formData.get("currentLocationId"),
    status: formData.get("status"),
    qrCodeValue: qrCodeValue.trim() || buildQrCodeValue(uniqueAssetId),
    description: formData.get("description") ?? "",
    serialNumber: formData.get("serialNumber") ?? "",
    make: formData.get("make") ?? "",
    model: formData.get("model") ?? "",
    purchaseDate: formData.get("purchaseDate") ?? "",
    purchaseCost: formData.get("purchaseCost") ?? "",
    replacementValue: formData.get("replacementValue") ?? "",
    currentValue: formData.get("currentValue") ?? "",
    notes: formData.get("notes") ?? "",
  });
}
