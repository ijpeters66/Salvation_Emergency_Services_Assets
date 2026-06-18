import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100012_deployments.sql"),
  "utf-8",
);

describe("deployment migration", () => {
  it("creates the deployment table and core fields", () => {
    expect(migration).toContain("create table if not exists public.deployment");
    expect(migration).toContain("deployment_id text not null unique");
    expect(migration).toContain("deployment_name text not null");
    expect(migration).toContain("purpose_reason text not null");
    expect(migration).toContain("deployment_location_site text not null");
    expect(migration).toContain("team_name text not null");
    expect(migration).toContain("start_datetime timestamptz not null");
    expect(migration).toContain("expected_return_datetime timestamptz");
    expect(migration).toContain("actual_return_datetime timestamptz");
    expect(migration).toContain("damage_fault_notes text");
  });

  it("restricts deployment statuses", () => {
    for (const status of ["planned", "active", "returned", "closed"]) {
      expect(migration).toContain(`'${status}'`);
    }
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain("alter table public.deployment enable row level security");
    expect(migration).toContain("authenticated users can read deployments");
    expect(migration).toContain("authenticated users can create deployments");
    expect(migration).toContain("authenticated users can update deployments");
  });
});
