import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100008_stock_thresholds.sql"),
  "utf-8",
);

describe("stock threshold migration", () => {
  it("creates stock thresholds by item and location", () => {
    expect(migration).toContain("create table if not exists public.stock_threshold");
    expect(migration).toContain(
      "consumable_item_id uuid not null references public.consumable_item",
    );
    expect(migration).toContain("location_id uuid not null references public.location");
    expect(migration).toContain("minimum_quantity integer not null check");
    expect(migration).toContain("unique (consumable_item_id, location_id)");
  });

  it("enables stock threshold RLS", () => {
    expect(migration).toContain("alter table public.stock_threshold enable row level security");
    expect(migration).toContain("authenticated users can read stock thresholds");
    expect(migration).toContain("authenticated users can create stock thresholds");
    expect(migration).toContain("authenticated users can update stock thresholds");
  });
});
