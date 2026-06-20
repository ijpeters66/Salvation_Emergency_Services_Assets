import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100016_maintenance_vendors.sql"),
  "utf-8",
);

describe("maintenance vendor migration", () => {
  it("creates the maintenance vendor table and requested fields", () => {
    expect(migration).toContain("create table if not exists public.maintenance_vendor");
    expect(migration).toContain("business_name text not null");
    expect(migration).toContain("contact_name text");
    expect(migration).toContain("phone text");
    expect(migration).toContain("email text");
    expect(migration).toContain("address text");
    expect(migration).toContain("website text");
    expect(migration).toContain("notes text");
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain("alter table public.maintenance_vendor enable row level security");
    expect(migration).toContain("authenticated users can read active maintenance vendors");
    expect(migration).toContain("authenticated users can create maintenance vendors");
    expect(migration).toContain("authenticated users can update maintenance vendors");
    expect(migration).toContain("system admins can archive maintenance vendors");
  });
});
