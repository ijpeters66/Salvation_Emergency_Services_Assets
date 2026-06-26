alter table public.app_user_profile
add column if not exists is_active boolean not null default true;

create table if not exists public.system_setting (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.movement_reason (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  sort_order integer not null default 0,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete restrict,
  updated_by uuid null references auth.users(id) on delete restrict
);

create index if not exists movement_reason_active_sort_idx
  on public.movement_reason(sort_order, label)
  where archived_at is null;

create index if not exists movement_reason_archived_at_idx
  on public.movement_reason(archived_at);

alter table public.system_setting enable row level security;
alter table public.movement_reason enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_system_setting_updated_at on public.system_setting;
create trigger set_system_setting_updated_at
before update on public.system_setting
for each row
execute function public.set_updated_at();

drop trigger if exists set_movement_reason_updated_at on public.movement_reason;
create trigger set_movement_reason_updated_at
before update on public.movement_reason
for each row
execute function public.set_updated_at();

create or replace function public.admin_list_user_profiles()
returns table (
  user_id uuid,
  display_name text,
  role_id uuid,
  role_key text,
  role_name text,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profile.user_id,
    profile.display_name,
    profile.role_id,
    role_row.key as role_key,
    role_row.name as role_name,
    profile.is_active
  from public.app_user_profile profile
  join public.role role_row on role_row.id = profile.role_id
  where public.current_user_is_system_admin();
$$;

drop policy if exists "system admins can update profiles" on public.app_user_profile;
create policy "system admins can update profiles"
on public.app_user_profile
for update
to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin());

drop policy if exists "authenticated users can read active movement reasons" on public.movement_reason;
create policy "authenticated users can read active movement reasons"
on public.movement_reason
for select
to authenticated
using (archived_at is null);

drop policy if exists "system admins can read archived movement reasons" on public.movement_reason;
create policy "system admins can read archived movement reasons"
on public.movement_reason
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "system admins can manage movement reasons" on public.movement_reason;
create policy "system admins can manage movement reasons"
on public.movement_reason
for all
to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin());

drop policy if exists "system admins can read system settings" on public.system_setting;
create policy "system admins can read system settings"
on public.system_setting
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "system admins can manage system settings" on public.system_setting;
create policy "system admins can manage system settings"
on public.system_setting
for all
to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin());

insert into public.system_setting (key, value)
values (
  'report_branding',
  jsonb_build_object(
    'organizationName', 'Salvation Emergency Services',
    'productName', 'SAES Asset Register',
    'logoText', 'SAES',
    'tagline', 'Victoria emergency services logistics',
    'primaryColor', '#e12d3c',
    'secondaryColor', '#003450',
    'accentColor', '#007faf',
    'surfaceColor', '#f4f4f4',
    'fontFamily', 'Roboto'
  )
)
on conflict (key) do nothing;

insert into public.movement_reason (key, label, description, sort_order)
select
  seed.key,
  seed.label,
  seed.description,
  seed.sort_order
from (
  values
    ('flood_response', 'Flood Response', 'Movement or deployment related to flood operations.', 10),
    ('fire_response', 'Fire Response', 'Movement or deployment related to fire operations.', 20),
    ('training_exercise', 'Training Exercise', 'Training, simulation, or readiness exercise.', 30),
    ('community_support', 'Community Support', 'Community assistance, welfare, or event support.', 40),
    ('stock_transfer', 'Stock Transfer', 'Inventory redistribution between sites or vehicles.', 50),
    ('maintenance', 'Maintenance', 'Scheduled or unscheduled maintenance activity.', 60),
    ('disposal_write_off', 'Disposal/Write-Off', 'Disposal, write-off, or retirement activity.', 70)
) as seed(key, label, description, sort_order)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;
