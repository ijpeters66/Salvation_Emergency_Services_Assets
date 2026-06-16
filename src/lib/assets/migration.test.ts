import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100003_assets.sql"),
  "utf-8",
);

describe("asset migration", () => {
  it("creates asset category and asset tables", () => {
    expect(migration).toContain("create table if not exists public.asset_category");
    expect(migration).toContain("create table if not exists public.asset");
    expect(migration).toContain("unique_asset_id text not null unique");
    expect(migration).toContain("qr_code_value text not null unique");
    expect(migration).toContain("current_location_id uuid not null references public.location");
  });

  it("restricts statuses to approved asset statuses", () => {
    for (const status of [
      "available",
      "deployed",
      "in_transit",
      "under_maintenance",
      "damaged",
      "retired",
      "lost_stolen",
    ]) {
      expect(migration).toContain(`'${status}'`);
    }
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain("alter table public.asset enable row level security");
    expect(migration).toContain("authenticated users can read active assets");
    expect(migration).toContain("system admins can read archived assets");
    expect(migration).toContain("authenticated users can create assets");
    expect(migration).toContain("authenticated users can update active assets");
    expect(migration).toContain("system admins can archive assets");
  });
});
