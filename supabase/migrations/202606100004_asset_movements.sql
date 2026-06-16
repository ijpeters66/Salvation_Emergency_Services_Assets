create table if not exists public.asset_movement (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset(id) on delete cascade,
  from_location_id uuid references public.location(id),
  to_location_id uuid references public.location(id),
  from_status text check (
    from_status is null
    or from_status in (
      'available',
      'deployed',
      'in_transit',
      'under_maintenance',
      'damaged',
      'retired',
      'lost_stolen'
    )
  ),
  to_status text not null check (
    to_status in (
      'available',
      'deployed',
      'in_transit',
      'under_maintenance',
      'damaged',
      'retired',
      'lost_stolen'
    )
  ),
  reason text not null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists asset_movement_asset_id_created_at_idx
on public.asset_movement(asset_id, created_at desc);
create index if not exists asset_movement_to_location_id_idx
on public.asset_movement(to_location_id);
create index if not exists asset_movement_to_status_idx
on public.asset_movement(to_status);

alter table public.asset_movement enable row level security;

drop policy if exists "authenticated users can read asset movements" on public.asset_movement;
create policy "authenticated users can read asset movements"
on public.asset_movement
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create asset movements" on public.asset_movement;
create policy "authenticated users can create asset movements"
on public.asset_movement
for insert
to authenticated
with check (created_by = auth.uid());
