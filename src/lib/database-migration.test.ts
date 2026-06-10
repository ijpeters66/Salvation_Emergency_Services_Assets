import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100001_database_foundation.sql"),
  "utf-8",
);

describe("database foundation migration", () => {
  it("creates the required foundation tables", () => {
    for (const tableName of [
      "app_user_profile",
      "role",
      "permission",
      "role_permission",
      "audit_log",
    ]) {
      expect(migration).toContain(`create table if not exists public.${tableName}`);
    }
  });

  it("enables RLS and seeds the required roles", () => {
    expect(migration).toContain("alter table public.audit_log enable row level security");
    expect(migration).toContain("alter table public.app_user_profile enable row level security");
    expect(migration).toContain("'system_admin'");
    expect(migration).toContain("'user'");
  });

  it("defines the required profile and audit policies", () => {
    expect(migration).toContain("authenticated users can read their own profile");
    expect(migration).toContain("system admins can read all profiles");
    expect(migration).toContain("authenticated users can insert audit logs");
    expect(migration).toContain("system admins can read all audit logs");
  });
});
