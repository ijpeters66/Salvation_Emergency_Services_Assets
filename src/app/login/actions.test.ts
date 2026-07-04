import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, createSupabaseServerClientMock, getPublicEnvStatusMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  getPublicEnvStatusMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/env", () => ({
  getPublicEnvStatus: getPublicEnvStatusMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { loginAction } from "@/app/login/actions";

function buildFormData(overrides?: { email?: string; password?: string; next?: string }) {
  const formData = new FormData();
  formData.set("email", overrides?.email ?? "admin@example.com");
  formData.set("password", overrides?.password ?? "ChangeMe123!");
  formData.set("next", overrides?.next ?? "/dashboard");
  return formData;
}

describe("login action", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    createSupabaseServerClientMock.mockReset();
    getPublicEnvStatusMock.mockReset();
    redirectMock.mockImplementation((location: string) => {
      throw new Error(`redirect:${location}`);
    });
  });

  it("redirects when the account has no SAES profile", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        signInWithPassword,
        getUser,
        signOut,
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      }),
    });
    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });

    await expect(loginAction(buildFormData())).rejects.toThrow(
      "redirect:/login?error=profile&next=%2Fdashboard",
    );
    expect(signOut).toHaveBeenCalled();
  });

  it("redirects to the requested page when the profile is active", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { is_active: true }, error: null });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        signInWithPassword,
        getUser,
        signOut,
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      }),
    });
    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });

    await expect(loginAction(buildFormData({ next: "/assets" }))).rejects.toThrow(
      "redirect:/assets",
    );
    expect(signOut).not.toHaveBeenCalled();
  });
});
