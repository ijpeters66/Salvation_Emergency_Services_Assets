import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100013_deployment_assets.sql"),
  "utf-8",
);

describe("deployment asset migration", () => {
  it("creates the deployment asset table and core fields", () => {
    expect(migration).toContain("create table if not exists public.deployment_asset");
    expect(migration).toContain("deployment_id uuid not null references public.deployment(id)");
    expect(migration).toContain("asset_id uuid not null references public.asset(id)");
    expect(migration).toContain("checked_out_at timestamptz not null default now()");
    expect(migration).toContain("checked_in_at timestamptz");
    expect(migration).toContain("checked_out_by uuid not null references auth.users(id)");
    expect(migration).toContain("checked_in_by uuid references auth.users(id)");
  });

  it("prevents one asset from being actively deployed twice", () => {
    expect(migration).toContain("deployment_asset_active_asset_idx");
    expect(migration).toContain("where checked_in_at is null");
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain("alter table public.deployment_asset enable row level security");
    expect(migration).toContain("authenticated users can read deployment assets");
    expect(migration).toContain("authenticated users can create deployment assets");
    expect(migration).toContain("authenticated users can update deployment assets");
  });
});
