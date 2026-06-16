import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100005_asset_assignments.sql"),
  "utf-8",
);

describe("asset assignment migration", () => {
  it("creates the assignment table and active child uniqueness", () => {
    expect(migration).toContain("create table if not exists public.asset_assignment");
    expect(migration).toContain("parent_asset_id uuid not null references public.asset");
    expect(migration).toContain("child_asset_id uuid not null references public.asset");
    expect(migration).toContain("asset_assignment_not_self");
    expect(migration).toContain("asset_assignment_active_child_idx");
  });

  it("adds circular assignment protection and RLS policies", () => {
    expect(migration).toContain("prevent_circular_asset_assignment");
    expect(migration).toContain("with recursive descendants");
    expect(migration).toContain("alter table public.asset_assignment enable row level security");
    expect(migration).toContain("authenticated users can read asset assignments");
    expect(migration).toContain("authenticated users can create asset assignments");
    expect(migration).toContain("authenticated users can update asset assignments");
  });
});
