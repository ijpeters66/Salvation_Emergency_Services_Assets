create table if not exists public.deployment (
  id uuid primary key default gen_random_uuid(),
  deployment_id text not null unique,
  deployment_name text not null,
  purpose_reason text not null,
  deployment_location_site text not null,
  team_name text not null,
  team_leader text,
  contact_number text,
  start_datetime timestamptz not null,
  expected_return_datetime timestamptz,
  actual_return_datetime timestamptz,
  status text not null default 'planned' check (status in ('planned', 'active', 'returned', 'closed')),
  notes text,
  damage_fault_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deployment_status_idx on public.deployment(status);
create index if not exists deployment_start_datetime_idx on public.deployment(start_datetime desc);

alter table public.deployment enable row level security;

drop trigger if exists set_deployment_updated_at on public.deployment;
create trigger set_deployment_updated_at
before update on public.deployment
for each row execute function public.set_updated_at();

drop policy if exists "authenticated users can read deployments" on public.deployment;
create policy "authenticated users can read deployments"
on public.deployment
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create deployments" on public.deployment;
create policy "authenticated users can create deployments"
on public.deployment
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "authenticated users can update deployments" on public.deployment;
create policy "authenticated users can update deployments"
on public.deployment
for update
to authenticated
using (true)
with check (true);
