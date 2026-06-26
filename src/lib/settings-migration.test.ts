import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100017_admin_settings.sql"),
  "utf-8",
);

describe("admin settings migration", () => {
  it("adds profile activation and the new admin settings tables", () => {
    expect(migration).toContain("add column if not exists is_active boolean not null default true");
    expect(migration).toContain("create table if not exists public.system_setting");
    expect(migration).toContain("create table if not exists public.movement_reason");
  });

  it("defines the admin list function and required policies", () => {
    expect(migration).toContain("create or replace function public.admin_list_user_profiles()");
    expect(migration).toContain("system admins can update profiles");
    expect(migration).toContain("system admins can manage movement reasons");
    expect(migration).toContain("system admins can manage system settings");
  });

  it("seeds the required movement reasons and branding key", () => {
    expect(migration).toContain("'report_branding'");
    expect(migration).toContain("'flood_response'");
    expect(migration).toContain("'fire_response'");
    expect(migration).toContain("'training_exercise'");
    expect(migration).toContain("'community_support'");
    expect(migration).toContain("'stock_transfer'");
    expect(migration).toContain("'maintenance'");
    expect(migration).toContain("'disposal_write_off'");
  });
});
