import { describe, expect, it } from "vitest";

import { locationFormSchema } from "@/lib/locations/validation";

describe("location validation", () => {
  it("accepts valid location details", () => {
    const result = locationFormSchema.safeParse({
      name: "Ballarat Warehouse",
      type: "warehouse",
      address: "12 Example Street",
      state: "Victoria",
      notes: "Primary storage site",
    });

    expect(result.success).toBe(true);
  });

  it("normalises empty optional text fields", () => {
    const result = locationFormSchema.parse({
      name: "Warrnambool Store",
      type: "storage_facility",
      address: "",
      state: "Victoria",
      notes: " ",
    });

    expect(result.address).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("accepts corps as a location type", () => {
    const result = locationFormSchema.safeParse({
      name: "Warrnambool Corps",
      type: "corps",
      address: "",
      state: "Victoria",
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid location types", () => {
    const result = locationFormSchema.safeParse({
      name: "Invalid Site",
      type: "office",
      address: "",
      state: "Victoria",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
