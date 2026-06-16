create table if not exists public.location (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('warehouse', 'storage_facility', 'temporary_deployment')),
  address text,
  state text not null default 'Victoria',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index if not exists location_active_name_idx on public.location(name) where archived_at is null;
create index if not exists location_type_idx on public.location(type);
create index if not exists location_archived_at_idx on public.location(archived_at);

alter table public.location enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_location_updated_at on public.location;
create trigger set_location_updated_at
before update on public.location
for each row
execute function public.set_updated_at();

drop policy if exists "authenticated users can read active locations" on public.location;
create policy "authenticated users can read active locations"
on public.location
for select
to authenticated
using (archived_at is null);

drop policy if exists "system admins can read archived locations" on public.location;
create policy "system admins can read archived locations"
on public.location
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can create locations" on public.location;
create policy "authenticated users can create locations"
on public.location
for insert
to authenticated
with check (
  created_by = auth.uid()
  and updated_by = auth.uid()
  and archived_at is null
);

drop policy if exists "authenticated users can update active locations" on public.location;
create policy "authenticated users can update active locations"
on public.location
for update
to authenticated
using (archived_at is null)
with check (
  updated_by = auth.uid()
  and archived_at is null
);

drop policy if exists "system admins can archive locations" on public.location;
create policy "system admins can archive locations"
on public.location
for update
to authenticated
using (public.current_user_is_system_admin())
with check (
  public.current_user_is_system_admin()
  and updated_by = auth.uid()
);
