import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  getCurrentUserContextMock,
  getCurrentSupabaseUserIdMock,
  createSupabaseSettingsDependenciesMock,
  getPublicEnvStatusMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  getCurrentUserContextMock: vi.fn(),
  getCurrentSupabaseUserIdMock: vi.fn(),
  createSupabaseSettingsDependenciesMock: vi.fn(),
  getPublicEnvStatusMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
}));

vi.mock("@/lib/env", () => ({
  getPublicEnvStatus: getPublicEnvStatusMock,
}));

vi.mock("@/lib/settings/server", () => ({
  createSupabaseSettingsDependencies: createSupabaseSettingsDependenciesMock,
  getCurrentSupabaseUserId: getCurrentSupabaseUserIdMock,
}));

import { updateUserAccessAction } from "@/app/settings/actions";

function buildFormData(overrides?: {
  userId?: string;
  role?: string;
  isActive?: string;
}) {
  const formData = new FormData();
  formData.set("userId", overrides?.userId ?? "target-user");
  formData.set("role", overrides?.role ?? "user");
  formData.set("isActive", overrides?.isActive ?? "1");
  return formData;
}

describe("settings actions", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    getCurrentUserContextMock.mockReset();
    getCurrentSupabaseUserIdMock.mockReset();
    createSupabaseSettingsDependenciesMock.mockReset();
    getPublicEnvStatusMock.mockReset();
    redirectMock.mockImplementation((location: string) => {
      throw new Error(`redirect:${location}`);
    });
  });

  it("blocks non-admin role updates", async () => {
    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });
    getCurrentUserContextMock.mockResolvedValue({
      email: "user@example.com",
      displayName: "User",
      role: "user",
    });

    await expect(updateUserAccessAction(buildFormData())).rejects.toThrow(
      "redirect:/settings?statusMessage=auth-error",
    );
  });

  it("prevents an admin from removing their own admin access", async () => {
    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });
    getCurrentUserContextMock.mockResolvedValue({
      email: "admin@example.com",
      displayName: "Admin",
      role: "system_admin",
    });
    getCurrentSupabaseUserIdMock.mockResolvedValue("admin-user");
    createSupabaseSettingsDependenciesMock.mockReturnValue({
      getRoleIdByKey: vi.fn(),
      updateUserProfile: vi.fn(),
      writeAuditLog: vi.fn(),
    });

    await expect(
      updateUserAccessAction(
        buildFormData({ userId: "admin-user", role: "user", isActive: "1" }),
      ),
    ).rejects.toThrow("redirect:/settings?statusMessage=self-lockout");
  });

  it("updates another user role and revalidates settings pages", async () => {
    const updateUserProfile = vi.fn().mockResolvedValue({
      data: { user_id: "target-user" },
      error: null,
    });
    const getRoleIdByKey = vi.fn().mockResolvedValue("role-2");
    const writeAuditLog = vi.fn().mockResolvedValue({ ok: true });

    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });
    getCurrentUserContextMock.mockResolvedValue({
      email: "admin@example.com",
      displayName: "Admin",
      role: "system_admin",
    });
    getCurrentSupabaseUserIdMock.mockResolvedValue("admin-user");
    createSupabaseSettingsDependenciesMock.mockReturnValue({
      getRoleIdByKey,
      updateUserProfile,
      writeAuditLog,
    });

    await expect(
      updateUserAccessAction(
        buildFormData({ userId: "target-user", role: "system_admin", isActive: "1" }),
      ),
    ).rejects.toThrow("redirect:/settings?statusMessage=user-saved");

    expect(getRoleIdByKey).toHaveBeenCalledWith("system_admin");
    expect(updateUserProfile).toHaveBeenCalledWith(
      "target-user",
      expect.objectContaining({
        role_id: "role-2",
        is_active: true,
      }),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "settings.user.update",
        recordId: "target-user",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings");
  });
});
