create table if not exists public.deployment_asset (
  id uuid primary key default gen_random_uuid(),
  deployment_id uuid not null references public.deployment(id) on delete cascade,
  asset_id uuid not null references public.asset(id) on delete restrict,
  checked_out_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_out_by uuid not null references auth.users(id),
  checked_in_by uuid references auth.users(id),
  notes text
);

create index if not exists deployment_asset_deployment_id_idx on public.deployment_asset(deployment_id);
create index if not exists deployment_asset_asset_id_idx on public.deployment_asset(asset_id);
create unique index if not exists deployment_asset_active_asset_idx
on public.deployment_asset(asset_id)
where checked_in_at is null;

alter table public.deployment_asset enable row level security;

drop policy if exists "authenticated users can read deployment assets" on public.deployment_asset;
create policy "authenticated users can read deployment assets"
on public.deployment_asset
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create deployment assets" on public.deployment_asset;
create policy "authenticated users can create deployment assets"
on public.deployment_asset
for insert
to authenticated
with check (checked_out_by = auth.uid());

drop policy if exists "authenticated users can update deployment assets" on public.deployment_asset;
create policy "authenticated users can update deployment assets"
on public.deployment_asset
for update
to authenticated
using (true)
with check (true);
