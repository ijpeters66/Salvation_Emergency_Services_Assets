import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100004_asset_movements.sql"),
  "utf-8",
);

describe("asset movement migration", () => {
  it("creates the asset movement table", () => {
    expect(migration).toContain("create table if not exists public.asset_movement");
    expect(migration).toContain("asset_id uuid not null references public.asset");
    expect(migration).toContain("from_location_id uuid references public.location");
    expect(migration).toContain("to_location_id uuid references public.location");
    expect(migration).toContain("created_by uuid not null references auth.users");
  });

  it("enforces approved movement statuses and RLS", () => {
    expect(migration).toContain("from_status text check");
    expect(migration).toContain("to_status text not null check");
    expect(migration).toContain("alter table public.asset_movement enable row level security");
    expect(migration).toContain("authenticated users can read asset movements");
    expect(migration).toContain("authenticated users can create asset movements");
  });
});
