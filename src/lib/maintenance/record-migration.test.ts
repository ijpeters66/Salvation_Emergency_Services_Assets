import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100011_maintenance_records.sql"),
  "utf-8",
);

describe("maintenance record migration", () => {
  it("creates the maintenance record table and core fields", () => {
    expect(migration).toContain("create table if not exists public.maintenance_record");
    expect(migration).toContain("asset_id uuid not null references public.asset(id)");
    expect(migration).toContain(
      "maintenance_schedule_id uuid references public.maintenance_schedule(id)",
    );
    expect(migration).toContain("date date not null");
    expect(migration).toContain("service_type text not null");
    expect(migration).toContain("description text not null");
    expect(migration).toContain("cost numeric(12,2) not null default 0");
    expect(migration).toContain("supplier_provider text not null");
    expect(migration).toContain("odometer_hour_reading numeric(12,1)");
    expect(migration).toContain("attachment_metadata jsonb not null default");
    expect(migration).toContain("recorded_by uuid not null references auth.users(id)");
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain("alter table public.maintenance_record enable row level security");
    expect(migration).toContain("authenticated users can read maintenance records");
    expect(migration).toContain("authenticated users can create maintenance records");
    expect(migration).toContain("recorded_by = auth.uid()");
  });
});
