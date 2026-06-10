create extension if not exists "pgcrypto";

create table if not exists public.role (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permission (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permission (
  role_id uuid not null references public.role(id) on delete cascade,
  permission_id uuid not null references public.permission(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.app_user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role_id uuid not null references public.role(id),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  action_type text not null,
  record_type text not null,
  record_id text not null,
  old_value jsonb,
  new_value jsonb,
  device_source text,
  offline_sync_reference text,
  created_at timestamptz not null default now()
);

create index if not exists app_user_profile_user_id_idx on public.app_user_profile(user_id);
create index if not exists app_user_profile_role_id_idx on public.app_user_profile(role_id);
create index if not exists audit_log_user_id_idx on public.audit_log(user_id);
create index if not exists audit_log_record_idx on public.audit_log(record_type, record_id);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at desc);

alter table public.role enable row level security;
alter table public.permission enable row level security;
alter table public.role_permission enable row level security;
alter table public.app_user_profile enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.current_user_is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_user_profile profile
    join public.role user_role on user_role.id = profile.role_id
    where profile.user_id = auth.uid()
      and user_role.key = 'system_admin'
  );
$$;

drop policy if exists "authenticated users can read their own profile" on public.app_user_profile;
create policy "authenticated users can read their own profile"
on public.app_user_profile
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "system admins can read all profiles" on public.app_user_profile;
create policy "system admins can read all profiles"
on public.app_user_profile
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can insert audit logs" on public.audit_log;
create policy "authenticated users can insert audit logs"
on public.audit_log
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "system admins can read all audit logs" on public.audit_log;
create policy "system admins can read all audit logs"
on public.audit_log
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can read roles" on public.role;
create policy "authenticated users can read roles"
on public.role
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read permissions" on public.permission;
create policy "authenticated users can read permissions"
on public.permission
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read role permissions" on public.role_permission;
create policy "authenticated users can read role permissions"
on public.role_permission
for select
to authenticated
using (true);

insert into public.role (key, name, description)
values
  ('system_admin', 'System Admin', 'Can manage system settings, users, reports, exports, archive actions, and audit trail.'),
  ('user', 'User', 'Can manage operational asset, stock, deployment, maintenance, attachment, dashboard, and report workflows.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description;

insert into public.permission (key, name, description)
values
  ('users.manage', 'Manage users', 'Create and manage application users.'),
  ('locations.manage', 'Manage locations', 'Create, edit, and archive locations.'),
  ('asset_categories.manage', 'Manage asset categories', 'Create, edit, and archive asset categories.'),
  ('consumable_categories.manage', 'Manage consumable categories', 'Create, edit, and archive consumable categories.'),
  ('settings.manage', 'Manage system settings', 'Update system-level configuration.'),
  ('reports.view', 'View reports', 'View operational and management reports.'),
  ('reports.export', 'Export reports', 'Export reports to supported formats.'),
  ('records.archive', 'Archive records', 'Archive or soft-delete operational records.'),
  ('audit.view', 'View audit trail', 'View system audit history.'),
  ('assets.manage', 'Manage assets', 'Add, edit, move, deploy, maintain, and archive assets.'),
  ('consumables.manage', 'Manage consumables', 'Add and edit consumable items and batches.'),
  ('stock_movements.record', 'Record stock movements', 'Record received, issued, transferred, returned, adjusted, written off, and stocktake variance movements.'),
  ('deployments.manage', 'Manage deployments', 'Record deployments and assigned assets or consumables.'),
  ('maintenance.record', 'Record maintenance', 'Record maintenance schedules and completed maintenance.'),
  ('attachments.upload', 'Upload attachments', 'Upload documents and photos.'),
  ('dashboard.view', 'View dashboard', 'View dashboard and operational alerts.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description;

insert into public.role_permission (role_id, permission_id)
select role.id, permission.id
from public.role
cross join public.permission
where role.key = 'system_admin'
on conflict do nothing;

insert into public.role_permission (role_id, permission_id)
select role.id, permission.id
from public.role
join public.permission on permission.key in (
  'reports.view',
  'assets.manage',
  'consumables.manage',
  'stock_movements.record',
  'deployments.manage',
  'maintenance.record',
  'attachments.upload',
  'dashboard.view'
)
where role.key = 'user'
on conflict do nothing;
