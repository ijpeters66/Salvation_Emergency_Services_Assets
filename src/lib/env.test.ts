import { describe, expect, it } from "vitest";

import { getPublicEnvStatus, getSupabaseProjectRef } from "@/lib/env";

describe("getPublicEnvStatus", () => {
  it("reports configured when public Supabase variables are valid", () => {
    const status = getPublicEnvStatus({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(status).toEqual({
      configured: true,
      missing: [],
    });
  });

  it("reports missing keys without exposing values", () => {
    const status = getPublicEnvStatus({
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });

    expect(status.configured).toBe(false);
    expect(status.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(status.missing).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("extracts the Supabase project ref from the public URL", () => {
    expect(
      getSupabaseProjectRef({
        NEXT_PUBLIC_SUPABASE_URL: "https://tuiemqkkmgqarwvhwvwr.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toBe("tuiemqkkmgqarwvhwvwr");
  });
});
