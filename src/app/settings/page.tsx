import Image from "next/image";
import { redirect } from "next/navigation";
import { Archive, Palette, Shield, Tags, Users } from "lucide-react";

import {
  archiveAssetCategoryAdminAction,
  archiveConsumableCategoryAdminAction,
  archiveMovementReasonAction,
  createAssetCategoryAdminAction,
  createConsumableCategoryAdminAction,
  createUserAccessAction,
  createMovementReasonAction,
  saveReportBrandingAction,
} from "@/app/settings/actions";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { PageHero } from "@/components/page-hero";
import { SettingsUserManagement } from "@/components/settings-user-management";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth";
import { getPublicEnvStatus, getSupabaseProjectRef } from "@/lib/env";
import { filterSettingsUsers, getRoleOptions } from "@/lib/settings";
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
  "user-created": "User login created or refreshed.",
  "user-password-reset": "User password reset.",
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
  const userSearch = getParam(params.userSearch) ?? "";
  const envStatus = getPublicEnvStatus();
  const supabaseProjectRef = getSupabaseProjectRef();
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
  const visibleUsers = filterSettingsUsers(users, roleOptions, userSearch);

  return (
    <AppShell>
      <section className="grid gap-6">
        <PageHero
          aside={
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,white)] bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-red)]">
                System administration
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Manage user access, operational categories, configurable movement reasons, and report branding.
              </p>
            </div>
          }
          description="Manage user access, operational categories, configurable movement reasons, and report branding for the SAES asset register."
          eyebrow="System administration"
          title="Settings"
        />

        {message ? (
          <Notice title="Settings update" variant="info">
            {message}
          </Notice>
        ) : null}

        <Notice title="Current Supabase project" variant={envStatus.configured ? "info" : "warning"}>
          {envStatus.configured && supabaseProjectRef ? (
            <>
              This UAT build is connected to <strong>{supabaseProjectRef}</strong>. If admin users
              were created in a different Supabase project, they will not appear in user search
              here.
            </>
          ) : (
            <>
              Supabase is not fully configured, so the current project cannot be identified from
              this environment.
            </>
          )}
        </Notice>

        <section className="panel-card p-5">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create user</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Add a new login for an admin or user, or refresh an existing email with a new password
            and role.
          </p>
          <form action={createUserAccessAction} className="mt-4 grid gap-4 xl:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Email
              <input
                autoComplete="email"
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="email"
                placeholder="new.user@example.com"
                required
                type="email"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Display name
              <input
                autoComplete="name"
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                name="displayName"
                placeholder="Optional display name"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Role
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
                defaultValue="user"
                name="role"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Temporary password
              <input
                autoComplete="new-password"
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base outline-none focus:border-[var(--brand-red)]"
                minLength={8}
                name="password"
                placeholder="Set a temporary password"
                required
                type="password"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] xl:col-span-2">
              Status
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base outline-none focus:border-[var(--brand-red)]"
                defaultValue="1"
                name="isActive"
              >
                <option value="1">Active</option>
                <option value="0">Deactivate</option>
              </select>
            </label>
            <div className="xl:col-span-2">
              <Button type="submit">Create user</Button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <SettingsUserManagement
            initialSearch={userSearch}
            roleOptions={roleOptions}
            roles={roles}
            users={visibleUsers}
          />

          <aside className="panel-card-soft p-5">
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
                <Image alt="SAES logo" height={96} src="/saes-logo.png" width={96} />
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
