create table if not exists public.plant_details (
  asset_id uuid primary key references public.asset(id) on delete cascade,
  registration_number text,
  registration_expiry date,
  insurance_expiry date,
  roadworthy_compliance_date date,
  odometer_reading integer,
  hour_meter_reading numeric(12,1),
  fuel_type text,
  service_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index if not exists plant_details_registration_expiry_idx
on public.plant_details(registration_expiry);
create index if not exists plant_details_insurance_expiry_idx
on public.plant_details(insurance_expiry);
create index if not exists plant_details_roadworthy_compliance_date_idx
on public.plant_details(roadworthy_compliance_date);

alter table public.plant_details enable row level security;

drop trigger if exists set_plant_details_updated_at on public.plant_details;
create trigger set_plant_details_updated_at
before update on public.plant_details
for each row execute function public.set_updated_at();

drop policy if exists "authenticated users can read plant details" on public.plant_details;
create policy "authenticated users can read plant details"
on public.plant_details
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create plant details" on public.plant_details;
create policy "authenticated users can create plant details"
on public.plant_details
for insert
to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists "authenticated users can update plant details" on public.plant_details;
create policy "authenticated users can update plant details"
on public.plant_details
for update
to authenticated
using (true)
with check (updated_by = auth.uid());
