import { describe, expect, it } from "vitest";

import { filterSettingsUsers } from "@/components/settings-user-management";

describe("filterSettingsUsers", () => {
  const roleOptions = [
    { value: "system_admin", label: "System Admin" },
    { value: "user", label: "User" },
  ];

  const users = [
    {
      user_id: "user-1",
      email: "alex.admin@example.com",
      display_name: "Alex Admin",
      role_id: "role-1",
      role_key: "system_admin",
      role_name: "System Admin",
      is_active: true,
    },
    {
      user_id: "user-2",
      email: "ops.user@example.com",
      display_name: "Ops User",
      role_id: "role-2",
      role_key: "user",
      role_name: "User",
      is_active: true,
    },
  ];

  it("returns all users when search is blank", () => {
    expect(filterSettingsUsers(users, roleOptions, "")).toHaveLength(2);
  });

  it("matches users by email, display name, role, or id", () => {
    expect(filterSettingsUsers(users, roleOptions, "alex")).toHaveLength(1);
    expect(filterSettingsUsers(users, roleOptions, "ops.user@example.com")).toHaveLength(1);
    expect(filterSettingsUsers(users, roleOptions, "system admin")).toHaveLength(1);
    expect(filterSettingsUsers(users, roleOptions, "user-2")).toHaveLength(1);
  });
});
