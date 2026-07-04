"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { resetUserPasswordAction, updateUserAccessAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { filterSettingsUsers } from "@/lib/settings";
import type { SettingsUserRow } from "@/lib/settings/server";

export { filterSettingsUsers } from "@/lib/settings";

type SettingsUserManagementProps = {
  users: SettingsUserRow[];
  roles: Array<{ id: string; key: string; name: string }>;
  roleOptions: Array<{ value: string; label: string }>;
  initialSearch: string;
};

export function SettingsUserManagement({
  users,
  roles,
  roleOptions,
  initialSearch,
}: SettingsUserManagementProps) {
  const [search, setSearch] = useState(initialSearch);
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const visibleUsers = filterSettingsUsers(users, roleOptions, search);
  const roleNameByKey = new Map(roleOptions.map((option) => [option.value, option.label]));

  return (
    <section className="panel-card p-5">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-[var(--ink)]">User management</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Search user accounts by name, role, or ID, then update access below.
      </p>
      <form className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end" method="get">
        <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
          Search users
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-[var(--border)] bg-white pl-9 pr-3 text-base outline-none focus:border-[var(--brand-red)]"
              name="userSearch"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, role, or user ID"
              value={search}
            />
          </div>
        </label>
        <div className="text-sm text-[var(--muted)] md:text-right">
          Showing <span className="font-medium text-[var(--ink)]">{visibleUsers.length}</span> of{" "}
          <span className="font-medium text-[var(--ink)]">{users.length}</span> users
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search ? (
          <Button asChild variant="ghost">
            <Link href="/settings">Clear</Link>
          </Button>
        ) : (
          <span />
        )}
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visibleUsers.length > 0 ? (
              visibleUsers.map((profile) => (
                <tr key={profile.user_id}>
                  <td className="px-4 py-4">
                    <span className="block font-medium text-[var(--ink)]">
                      {profile.display_name ?? `User ${profile.user_id.slice(0, 8)}`}
                    </span>
                    {profile.email ? (
                      <span className="block text-xs text-[var(--muted)]">{profile.email}</span>
                    ) : null}
                    <span className="block text-xs text-[var(--muted)]">{profile.user_id}</span>
                  </td>
                  <td className="px-4 py-4 text-[var(--muted)]">
                    {roleNameByKey.get(profile.role_key as "system_admin" | "user") ??
                      profile.role_name}
                  </td>
                  <td className="px-4 py-4 text-[var(--muted)]">
                    {profile.is_active ? "Active" : "Deactivated"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid gap-3">
                      <form action={updateUserAccessAction} className="flex flex-wrap gap-2">
                        <input name="userId" type="hidden" value={profile.user_id} />
                        <select
                          className="h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]"
                          defaultValue={profile.role_key}
                          name="role"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.key}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]"
                          defaultValue={profile.is_active ? "1" : "0"}
                          name="isActive"
                        >
                          <option value="1">Active</option>
                          <option value="0">Deactivate</option>
                        </select>
                        <Button size="sm" type="submit" variant="outline">
                          Save
                        </Button>
                      </form>
                      <form action={resetUserPasswordAction} className="flex flex-wrap gap-2">
                        <input name="userId" type="hidden" value={profile.user_id} />
                        <input
                          autoComplete="new-password"
                          className="h-9 min-w-56 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]"
                          name="password"
                          minLength={8}
                          placeholder="Temporary password"
                          required
                          type="password"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          Reset password
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-[var(--muted)]" colSpan={4}>
                  No users match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
