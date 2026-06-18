import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100007_stock_movements.sql"),
  "utf-8",
);

describe("stock movement migration", () => {
  it("creates the stock movement table", () => {
    expect(migration).toContain("create table if not exists public.stock_movement");
    expect(migration).toContain(
      "consumable_batch_id uuid not null references public.consumable_batch",
    );
    expect(migration).toContain("movement_type text not null check");
    expect(migration).toContain("quantity integer not null check (quantity > 0)");
    expect(migration).toContain("related_deployment_id uuid");
  });

  it("supports all approved stock movement types", () => {
    for (const movementType of [
      "received",
      "issued",
      "transferred",
      "returned",
      "adjusted",
      "written_off",
      "stocktake_variance",
    ]) {
      expect(migration).toContain(`'${movementType}'`);
    }
  });

  it("enables stock movement RLS", () => {
    expect(migration).toContain("alter table public.stock_movement enable row level security");
    expect(migration).toContain("authenticated users can read stock movements");
    expect(migration).toContain("authenticated users can create stock movements");
  });
});
