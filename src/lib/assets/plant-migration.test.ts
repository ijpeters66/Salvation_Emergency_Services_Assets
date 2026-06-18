import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100009_plant_details.sql"),
  "utf-8",
);

describe("plant details migration", () => {
  it("creates plant details as an asset extension", () => {
    expect(migration).toContain("create table if not exists public.plant_details");
    expect(migration).toContain("asset_id uuid primary key references public.asset");
    expect(migration).toContain("registration_number text");
    expect(migration).toContain("odometer_reading integer");
    expect(migration).toContain("hour_meter_reading numeric");
  });

  it("enables plant detail RLS", () => {
    expect(migration).toContain("alter table public.plant_details enable row level security");
    expect(migration).toContain("authenticated users can read plant details");
    expect(migration).toContain("authenticated users can create plant details");
    expect(migration).toContain("authenticated users can update plant details");
  });
});
