import { z } from "zod";

export const locationTypes = ["warehouse", "storage_facility", "temporary_deployment"] as const;

export type LocationType = (typeof locationTypes)[number];

export const locationTypeLabels: Record<LocationType, string> = {
  warehouse: "Warehouse",
  storage_facility: "Storage facility",
  temporary_deployment: "Temporary deployment",
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const locationFormSchema = z.object({
  name: z.string().trim().min(2, "Location name is required."),
  type: z.enum(locationTypes),
  address: optionalText,
  state: z.string().trim().min(2).default("Victoria"),
  notes: optionalText,
});

export type LocationFormInput = z.infer<typeof locationFormSchema>;

export function parseLocationFormData(formData: FormData) {
  return locationFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address") ?? "",
    state: formData.get("state") || "Victoria",
    notes: formData.get("notes") ?? "",
  });
}
