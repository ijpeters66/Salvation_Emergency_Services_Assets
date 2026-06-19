import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100014_deployment_consumables.sql"),
  "utf-8",
);

describe("deployment consumable migration", () => {
  it("creates the deployment consumable table and core fields", () => {
    expect(migration).toContain("create table if not exists public.deployment_consumable");
    expect(migration).toContain("deployment_id uuid not null references public.deployment(id)");
    expect(migration).toContain(
      "consumable_batch_id uuid not null references public.consumable_batch(id)",
    );
    expect(migration).toContain(
      "stock_movement_id uuid not null references public.stock_movement(id)",
    );
    expect(migration).toContain("quantity integer not null check (quantity > 0)");
    expect(migration).toContain("issued_by uuid not null references auth.users(id)");
  });

  it("enables RLS and required policies", () => {
    expect(migration).toContain(
      "alter table public.deployment_consumable enable row level security",
    );
    expect(migration).toContain("authenticated users can read deployment consumables");
    expect(migration).toContain("authenticated users can create deployment consumables");
  });
});
