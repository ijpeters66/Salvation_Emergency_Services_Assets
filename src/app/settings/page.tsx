import Image from "next/image";
import { redirect } from "next/navigation";
import { Archive, Palette, Shield, Tags, Users } from "lucide-react";

import {
  archiveAssetCategoryAdminAction,
  archiveConsumableCategoryAdminAction,
  archiveMovementReasonAction,
  createAssetCategoryAdminAction,
  createConsumableCategoryAdminAction,
  createMovementReasonAction,
  saveReportBrandingAction,
  updateUserAccessAction,
} from "@/app/settings/actions";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getRoleOptions } from "@/lib/settings";
import {
  getStoredReportBrandingSettings,
  listAssetCategoriesForSettings,
  listConsumableCategoriesForSettings,
  listMovementReasons,
  listRoles,
  listSettingsUsers,
} from "@/lib/settings/server";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  "auth-error": "You need an active system admin session to change settings.",
  "save-error": "The settings change could not be saved. Check the data and Supabase setup.",
  "self-lockout": "You cannot remove your own system admin access or deactivate your own profile.",
  "user-saved": "User access updated.",
  "branding-saved": "Report branding saved.",
  "asset-category-saved": "Asset category added.",
  "asset-category-archived": "Asset category archived.",
  "consumable-category-saved": "Consumable category added.",
  "consumable-category-archived": "Consumable category archived.",
  "movement-reason-saved": "Movement reason added.",
  "movement-reason-archived": "Movement reason archived.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUserContext();

  if (user?.role !== "system_admin") {
    redirect("/dashboard");
  }

  const statusMessage = getParam(params.statusMessage) ?? "";
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const [branding, users, roles, assetCategories, consumableCategories, movementReasons] =
    await Promise.all([
      getStoredReportBrandingSettings(),
      listSettingsUsers(),
      listRoles(),
      listAssetCategoriesForSettings(true, "system_admin"),
      listConsumableCategoriesForSettings(true, "system_admin"),
      listMovementReasons(true, "system_admin"),
    ]);
  const roleOptions = getRoleOptions();
  const roleNameByKey = new Map(roleOptions.map((option) => [option.value, option.label]));

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            System administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            Settings
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Manage user access, operational categories, configurable movement reasons, and report
            branding for the SAES asset register.
          </p>
        </div>

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">User management</h2>
            </div>
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
                  {users.map((profile) => (
                    <tr key={profile.user_id}>
                      <td className="px-4 py-4">
                        <span className="block font-medium text-[var(--ink)]">
                          {profile.display_name ?? `User ${profile.user_id.slice(0, 8)}`}
                        </span>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Report branding</h2>
            </div>
            <form action={saveReportBrandingAction} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Organisation
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  defaultValue={branding.organizationName}
                  name="organizationName"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Product
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  defaultValue={branding.productName}
                  name="productName"
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                  Logo text
                  <input
                    className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                    defaultValue={branding.logoText}
                    name="logoText"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                  Font family
                  <input
                    className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                    defaultValue={branding.fontFamily}
                    name="fontFamily"
                    required
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Tagline
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  defaultValue={branding.tagline}
                  name="tagline"
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["primaryColor", "Primary"],
                  ["secondaryColor", "Secondary"],
                  ["accentColor", "Accent"],
                  ["surfaceColor", "Surface"],
                ].map(([field, label]) => (
                  <label className="grid gap-1 text-sm font-medium text-[var(--ink)]" key={field}>
                    {label}
                    <input
                      className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                      defaultValue={branding[field as keyof typeof branding] as string}
                      name={field}
                      required
                    />
                  </label>
                ))}
              </div>
              <Button type="submit">Save branding</Button>
            </form>

            <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <Image alt="SAES report mark" height={40} src="/saes-report-mark.svg" width={40} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">{branding.organizationName}</p>
                  <p className="text-sm text-[var(--muted)]">{branding.productName}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Tags className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Asset categories</h2>
            </div>
            <form action={createAssetCategoryAdminAction} className="mt-4 grid gap-3">
              <input name="type" type="hidden" value="asset" />
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="name"
                placeholder="New asset category"
                required
              />
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="description"
                placeholder="Optional description"
              />
              <Button type="submit">Add asset category</Button>
            </form>
            <div className="mt-4 grid gap-3">
              {assetCategories.map((category) => (
                <div className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3" key={category.id}>
                  <div>
                    <p className="font-medium text-[var(--ink)]">{category.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {category.description ?? "No description"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {category.archived_at ? "Archived" : "Active"}
                    </p>
                  </div>
                  {!category.archived_at ? (
                    <ConfirmActionForm
                      action={archiveAssetCategoryAdminAction}
                      confirmMessage={`Archive ${category.name}?`}
                    >
                      <input name="id" type="hidden" value={category.id} />
                      <Button size="sm" type="submit" variant="outline">
                        <Archive className="size-4" aria-hidden="true" />
                        Archive
                      </Button>
                    </ConfirmActionForm>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Tags className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Consumable categories</h2>
            </div>
            <form action={createConsumableCategoryAdminAction} className="mt-4 grid gap-3">
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="name"
                placeholder="New consumable category"
                required
              />
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="description"
                placeholder="Optional description"
              />
              <Button type="submit">Add consumable category</Button>
            </form>
            <div className="mt-4 grid gap-3">
              {consumableCategories.map((category) => (
                <div className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3" key={category.id}>
                  <div>
                    <p className="font-medium text-[var(--ink)]">{category.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {category.description ?? "No description"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {category.archived_at ? "Archived" : "Active"}
                    </p>
                  </div>
                  {!category.archived_at ? (
                    <ConfirmActionForm
                      action={archiveConsumableCategoryAdminAction}
                      confirmMessage={`Archive ${category.name}?`}
                    >
                      <input name="id" type="hidden" value={category.id} />
                      <Button size="sm" type="submit" variant="outline">
                        <Archive className="size-4" aria-hidden="true" />
                        Archive
                      </Button>
                    </ConfirmActionForm>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-white p-5">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--ink)]">Movement reasons</h2>
            </div>
            <form action={createMovementReasonAction} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Reason label
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  name="label"
                  placeholder="New movement reason"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Description
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  name="description"
                  placeholder="Optional description"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                Sort order
                <input
                  className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                  defaultValue={movementReasons.length + 10}
                  min="0"
                  name="sortOrder"
                  type="number"
                />
              </label>
              <Button type="submit">Add movement reason</Button>
            </form>
            <div className="mt-4 grid gap-3">
              {movementReasons.map((reason) => (
                <div className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3" key={reason.id}>
                  <div>
                    <p className="font-medium text-[var(--ink)]">{reason.label}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {reason.description ?? "No description"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {reason.archived_at ? "Archived" : "Active"}
                    </p>
                  </div>
                  {!reason.archived_at ? (
                    <ConfirmActionForm
                      action={archiveMovementReasonAction}
                      confirmMessage={`Archive ${reason.label}?`}
                    >
                      <input name="id" type="hidden" value={reason.id} />
                      <Button size="sm" type="submit" variant="outline">
                        <Archive className="size-4" aria-hidden="true" />
                        Archive
                      </Button>
                    </ConfirmActionForm>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </AppShell>
  );
}
