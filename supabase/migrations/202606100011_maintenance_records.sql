create table if not exists public.maintenance_record (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset(id) on delete cascade,
  maintenance_schedule_id uuid references public.maintenance_schedule(id) on delete set null,
  date date not null,
  service_type text not null,
  description text not null,
  cost numeric(12,2) not null default 0,
  supplier_provider text not null,
  odometer_hour_reading numeric(12,1),
  notes text,
  attachment_metadata jsonb not null default '[]'::jsonb,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists maintenance_record_asset_id_idx on public.maintenance_record(asset_id);
create index if not exists maintenance_record_schedule_id_idx on public.maintenance_record(maintenance_schedule_id);
create index if not exists maintenance_record_date_idx on public.maintenance_record(date desc);

alter table public.maintenance_record enable row level security;

drop policy if exists "authenticated users can read maintenance records" on public.maintenance_record;
create policy "authenticated users can read maintenance records"
on public.maintenance_record
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create maintenance records" on public.maintenance_record;
create policy "authenticated users can create maintenance records"
on public.maintenance_record
for insert
to authenticated
with check (recorded_by = auth.uid());
