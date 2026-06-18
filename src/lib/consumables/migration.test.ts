import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100006_consumables.sql"),
  "utf-8",
);

describe("consumable migration", () => {
  it("creates category, item, and batch tables", () => {
    expect(migration).toContain("create table if not exists public.consumable_category");
    expect(migration).toContain("create table if not exists public.consumable_item");
    expect(migration).toContain("create table if not exists public.consumable_batch");
    expect(migration).toContain("quantity_on_hand integer not null check (quantity_on_hand >= 0)");
    expect(migration).toContain("qr_code_value text not null unique");
  });

  it("enables RLS and batch policies", () => {
    expect(migration).toContain("alter table public.consumable_batch enable row level security");
    expect(migration).toContain("authenticated users can read active consumable batches");
    expect(migration).toContain("authenticated users can create consumable batches");
    expect(migration).toContain("authenticated users can update active consumable batches");
    expect(migration).toContain("system admins can archive consumable batches");
  });
});
