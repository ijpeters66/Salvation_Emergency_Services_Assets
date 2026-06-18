import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100010_maintenance_schedules.sql"),
  "utf-8",
);

describe("maintenance schedule migration", () => {
  it("creates the maintenance schedule table and core fields", () => {
    expect(migration).toContain("create table if not exists public.maintenance_schedule");
    expect(migration).toContain("asset_id uuid not null references public.asset(id)");
    expect(migration).toContain("maintenance_type text not null");
    expect(migration).toContain("service_interval_date integer");
    expect(migration).toContain("service_interval_odometer integer");
    expect(migration).toContain("service_interval_hours numeric(12,1)");
    expect(migration).toContain("next_service_due_date date");
    expect(migration).toContain("next_service_due_reading numeric(12,1)");
    expect(migration).toContain("reminder_threshold_days integer");
  });

  it("restricts schedule status values", () => {
    for (const status of ["active", "paused", "archived"]) {
      expect(migration).toContain(`'${status}'`);
    }
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain(
      "alter table public.maintenance_schedule enable row level security",
    );
    expect(migration).toContain("authenticated users can read maintenance schedules");
    expect(migration).toContain("authenticated users can create maintenance schedules");
    expect(migration).toContain("authenticated users can update maintenance schedules");
  });
});
