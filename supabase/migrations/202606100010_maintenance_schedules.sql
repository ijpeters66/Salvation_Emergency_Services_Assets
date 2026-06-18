create table if not exists public.maintenance_schedule (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset(id) on delete cascade,
  maintenance_type text not null,
  service_interval_date integer,
  service_interval_odometer integer,
  service_interval_hours numeric(12,1),
  next_service_due_date date,
  next_service_due_reading numeric(12,1),
  service_provider text,
  reminder_threshold_days integer,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index if not exists maintenance_schedule_asset_id_idx on public.maintenance_schedule(asset_id);
create index if not exists maintenance_schedule_due_date_idx on public.maintenance_schedule(next_service_due_date);
create index if not exists maintenance_schedule_status_idx on public.maintenance_schedule(status);

alter table public.maintenance_schedule enable row level security;

drop trigger if exists set_maintenance_schedule_updated_at on public.maintenance_schedule;
create trigger set_maintenance_schedule_updated_at
before update on public.maintenance_schedule
for each row execute function public.set_updated_at();

drop policy if exists "authenticated users can read maintenance schedules" on public.maintenance_schedule;
create policy "authenticated users can read maintenance schedules"
on public.maintenance_schedule
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create maintenance schedules" on public.maintenance_schedule;
create policy "authenticated users can create maintenance schedules"
on public.maintenance_schedule
for insert
to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists "authenticated users can update maintenance schedules" on public.maintenance_schedule;
create policy "authenticated users can update maintenance schedules"
on public.maintenance_schedule
for update
to authenticated
using (true)
with check (updated_by = auth.uid());
