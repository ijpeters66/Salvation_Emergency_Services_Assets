import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606100015_document_attachments.sql"),
  "utf-8",
);

describe("document attachment migration", () => {
  it("creates the document attachment table with required fields", () => {
    expect(migration).toContain("create table if not exists public.document_attachment");
    expect(migration).toContain("owner_type text not null");
    expect(migration).toContain("owner_id uuid not null");
    expect(migration).toContain("file_path text not null unique");
    expect(migration).toContain("archived_at timestamptz null");
  });

  it("supports the required owner types", () => {
    for (const ownerType of [
      "asset",
      "plant",
      "maintenance_record",
      "deployment",
      "consumable_batch",
      "location",
    ]) {
      expect(migration).toContain(`'${ownerType}'`);
    }
  });

  it("configures RLS and storage policies", () => {
    expect(migration).toContain("alter table public.document_attachment enable row level security");
    expect(migration).toContain("authenticated users can create document attachments");
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("authenticated users can upload document attachment objects");
    expect(migration).toContain("authenticated users can delete document attachment objects");
  });
});
