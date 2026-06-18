create table if not exists public.stock_threshold (
  id uuid primary key default gen_random_uuid(),
  consumable_item_id uuid not null references public.consumable_item(id) on delete cascade,
  location_id uuid not null references public.location(id) on delete cascade,
  minimum_quantity integer not null check (minimum_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (consumable_item_id, location_id)
);

create index if not exists stock_threshold_item_location_idx
on public.stock_threshold(consumable_item_id, location_id);

alter table public.stock_threshold enable row level security;

drop trigger if exists set_stock_threshold_updated_at on public.stock_threshold;
create trigger set_stock_threshold_updated_at
before update on public.stock_threshold
for each row execute function public.set_updated_at();

drop policy if exists "authenticated users can read stock thresholds" on public.stock_threshold;
create policy "authenticated users can read stock thresholds"
on public.stock_threshold
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create stock thresholds" on public.stock_threshold;
create policy "authenticated users can create stock thresholds"
on public.stock_threshold
for insert
to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists "authenticated users can update stock thresholds" on public.stock_threshold;
create policy "authenticated users can update stock thresholds"
on public.stock_threshold
for update
to authenticated
using (true)
with check (updated_by = auth.uid());
