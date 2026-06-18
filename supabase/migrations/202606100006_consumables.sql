create table if not exists public.consumable_category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict
);

create table if not exists public.consumable_item (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references public.consumable_category(id),
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (name, category_id)
);

create table if not exists public.consumable_batch (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.consumable_item(id),
  batch_lot_number text not null,
  quantity_received integer not null check (quantity_received >= 0),
  quantity_on_hand integer not null check (quantity_on_hand >= 0),
  unit_cost numeric(12,2),
  replacement_cost numeric(12,2),
  date_received date not null,
  supplier_donor text,
  expiry_date date,
  location_id uuid not null references public.location(id),
  qr_code_value text not null unique,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (item_id, batch_lot_number)
);

create index if not exists consumable_category_active_name_idx on public.consumable_category(name)
where archived_at is null;
create index if not exists consumable_item_category_id_idx on public.consumable_item(category_id);
create index if not exists consumable_item_active_name_idx on public.consumable_item(name)
where archived_at is null;
create index if not exists consumable_batch_item_id_idx on public.consumable_batch(item_id);
create index if not exists consumable_batch_location_id_idx on public.consumable_batch(location_id);
create index if not exists consumable_batch_expiry_date_idx on public.consumable_batch(expiry_date);
create index if not exists consumable_batch_quantity_on_hand_idx on public.consumable_batch(quantity_on_hand);
create index if not exists consumable_batch_archived_at_idx on public.consumable_batch(archived_at);

alter table public.consumable_category enable row level security;
alter table public.consumable_item enable row level security;
alter table public.consumable_batch enable row level security;

drop trigger if exists set_consumable_category_updated_at on public.consumable_category;
create trigger set_consumable_category_updated_at
before update on public.consumable_category
for each row execute function public.set_updated_at();

drop trigger if exists set_consumable_item_updated_at on public.consumable_item;
create trigger set_consumable_item_updated_at
before update on public.consumable_item
for each row execute function public.set_updated_at();

drop trigger if exists set_consumable_batch_updated_at on public.consumable_batch;
create trigger set_consumable_batch_updated_at
before update on public.consumable_batch
for each row execute function public.set_updated_at();

insert into public.consumable_category (name, description)
values
  ('Clinical consumables', 'Single-use or batch-managed clinical supplies.'),
  ('PPE', 'Personal protective equipment and safety consumables.'),
  ('Logistics consumables', 'Consumable supplies used for deployments and logistics support.')
on conflict (name) do update set description = excluded.description;

drop policy if exists "authenticated users can read active consumable categories" on public.consumable_category;
create policy "authenticated users can read active consumable categories"
on public.consumable_category for select to authenticated using (archived_at is null);

drop policy if exists "system admins can read archived consumable categories" on public.consumable_category;
create policy "system admins can read archived consumable categories"
on public.consumable_category for select to authenticated using (public.current_user_is_system_admin());

drop policy if exists "system admins can manage consumable categories" on public.consumable_category;
create policy "system admins can manage consumable categories"
on public.consumable_category for all to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin());

drop policy if exists "authenticated users can read active consumable items" on public.consumable_item;
create policy "authenticated users can read active consumable items"
on public.consumable_item for select to authenticated using (archived_at is null);

drop policy if exists "system admins can read archived consumable items" on public.consumable_item;
create policy "system admins can read archived consumable items"
on public.consumable_item for select to authenticated using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can create consumable items" on public.consumable_item;
create policy "authenticated users can create consumable items"
on public.consumable_item for insert to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid() and archived_at is null);

drop policy if exists "authenticated users can update active consumable items" on public.consumable_item;
create policy "authenticated users can update active consumable items"
on public.consumable_item for update to authenticated
using (archived_at is null)
with check (updated_by = auth.uid() and archived_at is null);

drop policy if exists "authenticated users can read active consumable batches" on public.consumable_batch;
create policy "authenticated users can read active consumable batches"
on public.consumable_batch for select to authenticated using (archived_at is null);

drop policy if exists "system admins can read archived consumable batches" on public.consumable_batch;
create policy "system admins can read archived consumable batches"
on public.consumable_batch for select to authenticated using (public.current_user_is_system_admin());

drop policy if exists "authenticated users can create consumable batches" on public.consumable_batch;
create policy "authenticated users can create consumable batches"
on public.consumable_batch for insert to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid() and archived_at is null);

drop policy if exists "authenticated users can update active consumable batches" on public.consumable_batch;
create policy "authenticated users can update active consumable batches"
on public.consumable_batch for update to authenticated
using (archived_at is null)
with check (updated_by = auth.uid() and archived_at is null);

drop policy if exists "system admins can archive consumable batches" on public.consumable_batch;
create policy "system admins can archive consumable batches"
on public.consumable_batch for update to authenticated
using (public.current_user_is_system_admin())
with check (public.current_user_is_system_admin() and updated_by = auth.uid());
