import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100002_locations.sql"),
  "utf-8",
);

describe("location migration", () => {
  it("creates the location table with audit ownership fields", () => {
    expect(migration).toContain("create table if not exists public.location");
    expect(migration).toContain("created_by uuid not null references auth.users");
    expect(migration).toContain("updated_by uuid not null references auth.users");
    expect(migration).toContain("archived_at timestamptz");
  });

  it("enables RLS and required location policies", () => {
    expect(migration).toContain("alter table public.location enable row level security");
    expect(migration).toContain("authenticated users can read active locations");
    expect(migration).toContain("system admins can read archived locations");
    expect(migration).toContain("authenticated users can create locations");
    expect(migration).toContain("authenticated users can update active locations");
    expect(migration).toContain("system admins can archive locations");
  });
});
