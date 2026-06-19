create table if not exists public.deployment_consumable (
  id uuid primary key default gen_random_uuid(),
  deployment_id uuid not null references public.deployment(id) on delete cascade,
  consumable_batch_id uuid not null references public.consumable_batch(id) on delete restrict,
  stock_movement_id uuid not null references public.stock_movement(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  issued_at timestamptz not null default now(),
  issued_by uuid not null references auth.users(id)
);

create index if not exists deployment_consumable_deployment_id_idx
on public.deployment_consumable(deployment_id);

create index if not exists deployment_consumable_batch_id_idx
on public.deployment_consumable(consumable_batch_id);

alter table public.deployment_consumable enable row level security;

drop policy if exists "authenticated users can read deployment consumables" on public.deployment_consumable;
create policy "authenticated users can read deployment consumables"
on public.deployment_consumable
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create deployment consumables" on public.deployment_consumable;
create policy "authenticated users can create deployment consumables"
on public.deployment_consumable
for insert
to authenticated
with check (issued_by = auth.uid());
