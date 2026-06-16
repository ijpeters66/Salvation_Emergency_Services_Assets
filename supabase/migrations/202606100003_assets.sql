create table if not exists public.asset_category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict
);

create table if not exists public.asset (
  id uuid primary key default gen_random_uuid(),
  unique_asset_id text not null unique,
  qr_code_value text not null unique,
  asset_name text not null,
  category_id uuid not null references public.asset_category(id),
  description text,
  serial_number text,
  make text,
  model text,
  purchase_date date,
  purchase_cost numeric(12,2),
  replacement_value numeric(12,2),
  current_value numeric(12,2),
  current_location_id uuid not null references public.location(id),
  status text not null check (
    status in (
      'available',
      'deployed',
      'in_transit',
      'under_maintenance',
      'damaged',
      'retired',
      'lost_stolen'
    )
  ),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index if not exists asset_category_active_name_idx on public.asset_category(name)
where archived_at is null;
create index if not exists asset_category_archived_at_idx on public.asset_category(archived_at);
create index if not exists asset_category_updated_at_idx on public.asset_category(updated_at desc);

create index if not exists asset_category_id_idx on public.asset(category_id);
create index if not exists asset_current_location_id_idx on public.asset(current_location_id);
create index if not exists asset_status_idx on public.asset(status);
create index if not exists asset_archived_at_idx on public.asset(archived_at);
create index if not exists asset_qr_code_value_idx on public.asset(qr_code_value);
create index if not exists asset_updated_at_idx on public.asset(updated_at desc);

alter table public.asset_category enable row level security;
alter table public.asset enable row level security;

drop trigger if exists set_asset_category_updated_at on public.asset_category;
create trigger set_asset_category_updated_at
before update on public.asset_category
for each row
execute function public.set_updated_at();

drop trigger if exists set_asset_updated_at on public.asset;
create trigger set_asset_updated_at
before update on public.asset
for each row
execute function public.set_updated_at();

insert into public.asset_category (name, description)
values
  ('Vehicles and trailers', 'Fleet, trailers, and road-registered operational assets.'),
  ('Communications', 'Radios, chargers, antennas, and communications kits.'),
  ('Medical equipment', 'Reusable medical equipment and clinical support assets.'),
  ('Logistics and shelter', 'Tents, tables, lighting, power, and general logistics assets.')
on conflict (name) do update
set description = excluded.description;

drop policy if exists "authenticated users can read active asset categories" on public.asset_category;
create policy "authenticated users can read active asset categories"
on public.asset_category
for select
to authenticated
using (archived_at is null);

drop policy if exists "system admins can read archived asset categories" on public.asset_category;
create policy "system admins can read archived asset categories"
on public.asset_category
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "system admins can manage asset categories" on public.asset_category;
create policy "system admins can manage asset categories"
on public.asset_category
for all
to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin());

drop policy if exists "authenticated users can read active assets" on public.asset;
create policy "authenticated users can read active assets"
on public.asset
for select
to authenticated
using (archived_at is null);

drop policy if exists "system admins can read archived assets" on public.asset;
create policy "system admins can read archived assets"
on public.asset
for select
to authenticated
using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can create assets" on public.asset;
create policy "authenticated users can create assets"
on public.asset
for insert
to authenticated
with check (
  created_by = auth.uid()
  and updated_by = auth.uid()
  and archived_at is null
);

drop policy if exists "authenticated users can update active assets" on public.asset;
create policy "authenticated users can update active assets"
on public.asset
for update
to authenticated
using (archived_at is null)
with check (
  updated_by = auth.uid()
  and archived_at is null
);

drop policy if exists "system admins can archive assets" on public.asset;
create policy "system admins can archive assets"
on public.asset
for update
to authenticated
using (public.current_user_is_system_admin())
with check (
  public.current_user_is_system_admin()
  and updated_by = auth.uid()
);
