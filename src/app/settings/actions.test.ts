import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  getCurrentUserContextMock,
  getCurrentSupabaseUserIdMock,
  createSupabaseAdminClientMock,
  createSupabaseSettingsDependenciesMock,
  getPublicEnvStatusMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  getCurrentUserContextMock: vi.fn(),
  getCurrentSupabaseUserIdMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
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
  createSupabaseAdminClient: createSupabaseAdminClientMock,
  createSupabaseSettingsDependencies: createSupabaseSettingsDependenciesMock,
  getCurrentSupabaseUserId: getCurrentSupabaseUserIdMock,
}));

import {
  createUserAccessAction,
  resetUserPasswordAction,
  updateUserAccessAction,
} from "@/app/settings/actions";

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
    createSupabaseAdminClientMock.mockReset();
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
    createSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn(),
          createUser: vi.fn(),
          updateUserById: vi.fn(),
        },
      },
      from: vi.fn(),
    });
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
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { user_id: "target-user" },
          error: null,
        }),
      }),
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
    createSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn(),
          createUser: vi.fn(),
          updateUserById: vi.fn(),
        },
      },
      from: vi.fn().mockReturnValue({ upsert }),
    });
    createSupabaseSettingsDependenciesMock.mockReturnValue({
      getRoleIdByKey,
      writeAuditLog,
    });

    await expect(
      updateUserAccessAction(
        buildFormData({ userId: "target-user", role: "system_admin", isActive: "1" }),
      ),
    ).rejects.toThrow("redirect:/settings?statusMessage=user-saved");

    expect(getRoleIdByKey).toHaveBeenCalledWith("system_admin");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "target-user",
        role_id: "role-2",
        is_active: true,
      }),
      expect.any(Object),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "settings.user.update",
        recordId: "target-user",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings");
  });

  it("creates a new user login and profile", async () => {
    const authAdmin = {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null,
      }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-user" } },
        error: null,
      }),
      updateUserById: vi.fn(),
    };
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { user_id: "new-user" },
          error: null,
        }),
      }),
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
    createSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: authAdmin },
      from: vi.fn().mockReturnValue({ upsert }),
    });
    createSupabaseSettingsDependenciesMock.mockReturnValue({
      getRoleIdByKey,
      updateUserProfile: vi.fn(),
      writeAuditLog,
    });

    const formData = new FormData();
    formData.set("email", "new.user@example.com");
    formData.set("displayName", "New User");
    formData.set("password", "temporary123");
    formData.set("role", "user");
    formData.set("isActive", "1");

    await expect(createUserAccessAction(formData)).rejects.toThrow(
      "redirect:/settings?statusMessage=user-created",
    );

    expect(authAdmin.listUsers).toHaveBeenCalled();
    expect(authAdmin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new.user@example.com",
        password: "temporary123",
        email_confirm: true,
      }),
    );
    expect(getRoleIdByKey).toHaveBeenCalledWith("user");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "new-user",
        role_id: "role-2",
        display_name: "New User",
        is_active: true,
      }),
      expect.any(Object),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "settings.user.create",
        recordId: "new-user",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings");
  });

  it("resets an existing user password", async () => {
    const authAdmin = {
      listUsers: vi.fn(),
      createUser: vi.fn(),
      updateUserById: vi.fn().mockResolvedValue({ error: null }),
    };
    const writeAuditLog = vi.fn().mockResolvedValue({ ok: true });

    getPublicEnvStatusMock.mockReturnValue({ configured: true, missing: [] });
    getCurrentUserContextMock.mockResolvedValue({
      email: "admin@example.com",
      displayName: "Admin",
      role: "system_admin",
    });
    getCurrentSupabaseUserIdMock.mockResolvedValue("admin-user");
    createSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: authAdmin },
      from: vi.fn(),
    });
    createSupabaseSettingsDependenciesMock.mockReturnValue({
      getRoleIdByKey: vi.fn(),
      updateUserProfile: vi.fn(),
      writeAuditLog,
    });

    const formData = new FormData();
    formData.set("userId", "target-user");
    formData.set("password", "temporary123");

    await expect(resetUserPasswordAction(formData)).rejects.toThrow(
      "redirect:/settings?statusMessage=user-password-reset",
    );

    expect(authAdmin.updateUserById).toHaveBeenCalledWith("target-user", {
      password: "temporary123",
    });
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "settings.user.password_reset",
        recordId: "target-user",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings");
  });
});
