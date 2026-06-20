create table if not exists public.maintenance_vendor (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  website text,
  notes text,
  archived_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index if not exists maintenance_vendor_business_name_idx
  on public.maintenance_vendor(business_name);

create index if not exists maintenance_vendor_active_idx
  on public.maintenance_vendor(archived_at);

drop trigger if exists set_maintenance_vendor_updated_at on public.maintenance_vendor;
create trigger set_maintenance_vendor_updated_at
before update on public.maintenance_vendor
for each row execute procedure public.set_updated_at();

alter table public.maintenance_vendor enable row level security;

drop policy if exists "authenticated users can read active maintenance vendors" on public.maintenance_vendor;
create policy "authenticated users can read active maintenance vendors"
on public.maintenance_vendor
for select
to authenticated
using (archived_at is null);

drop policy if exists "system admins can read archived maintenance vendors" on public.maintenance_vendor;
create policy "system admins can read archived maintenance vendors"
on public.maintenance_vendor
for select
to authenticated
using (
  archived_at is not null
  and exists (
    select 1
    from public.app_user_profile profile
    join public.role role_row on role_row.id = profile.role_id
    where profile.user_id = auth.uid()
      and role_row.name = 'system_admin'
  )
);

drop policy if exists "authenticated users can create maintenance vendors" on public.maintenance_vendor;
create policy "authenticated users can create maintenance vendors"
on public.maintenance_vendor
for insert
to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists "authenticated users can update maintenance vendors" on public.maintenance_vendor;
create policy "authenticated users can update maintenance vendors"
on public.maintenance_vendor
for update
to authenticated
using (archived_at is null)
with check (updated_by = auth.uid());

drop policy if exists "system admins can archive maintenance vendors" on public.maintenance_vendor;
create policy "system admins can archive maintenance vendors"
on public.maintenance_vendor
for update
to authenticated
using (
  exists (
    select 1
    from public.app_user_profile profile
    join public.role role_row on role_row.id = profile.role_id
    where profile.user_id = auth.uid()
      and role_row.name = 'system_admin'
  )
)
with check (
  exists (
    select 1
    from public.app_user_profile profile
    join public.role role_row on role_row.id = profile.role_id
    where profile.user_id = auth.uid()
      and role_row.name = 'system_admin'
  )
);
