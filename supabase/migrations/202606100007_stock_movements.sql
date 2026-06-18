create table if not exists public.stock_movement (
  id uuid primary key default gen_random_uuid(),
  consumable_batch_id uuid not null references public.consumable_batch(id) on delete cascade,
  movement_type text not null check (
    movement_type in (
      'received',
      'issued',
      'transferred',
      'returned',
      'adjusted',
      'written_off',
      'stocktake_variance'
    )
  ),
  quantity integer not null check (quantity > 0),
  from_location_id uuid references public.location(id),
  to_location_id uuid references public.location(id),
  reason text not null,
  related_deployment_id uuid,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists stock_movement_batch_created_at_idx
on public.stock_movement(consumable_batch_id, created_at desc);
create index if not exists stock_movement_type_idx on public.stock_movement(movement_type);
create index if not exists stock_movement_from_location_id_idx on public.stock_movement(from_location_id);
create index if not exists stock_movement_to_location_id_idx on public.stock_movement(to_location_id);

alter table public.stock_movement enable row level security;

drop policy if exists "authenticated users can read stock movements" on public.stock_movement;
create policy "authenticated users can read stock movements"
on public.stock_movement
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create stock movements" on public.stock_movement;
create policy "authenticated users can create stock movements"
on public.stock_movement
for insert
to authenticated
with check (created_by = auth.uid());
