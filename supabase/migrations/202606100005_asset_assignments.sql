create table if not exists public.asset_assignment (
  id uuid primary key default gen_random_uuid(),
  parent_asset_id uuid not null references public.asset(id) on delete cascade,
  child_asset_id uuid not null references public.asset(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  notes text,
  constraint asset_assignment_not_self check (parent_asset_id <> child_asset_id)
);

create unique index if not exists asset_assignment_active_child_idx
on public.asset_assignment(child_asset_id)
where unassigned_at is null;

create index if not exists asset_assignment_parent_active_idx
on public.asset_assignment(parent_asset_id)
where unassigned_at is null;

create index if not exists asset_assignment_child_history_idx
on public.asset_assignment(child_asset_id, assigned_at desc);

create or replace function public.prevent_circular_asset_assignment()
returns trigger
language plpgsql
as $$
begin
  if new.unassigned_at is not null then
    return new;
  end if;

  if exists (
    with recursive descendants(child_asset_id) as (
      select child_asset_id
      from public.asset_assignment
      where parent_asset_id = new.child_asset_id
        and unassigned_at is null
      union
      select assignment.child_asset_id
      from public.asset_assignment assignment
      join descendants on descendants.child_asset_id = assignment.parent_asset_id
      where assignment.unassigned_at is null
    )
    select 1
    from descendants
    where child_asset_id = new.parent_asset_id
  ) then
    raise exception 'Circular asset assignment is not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_circular_asset_assignment on public.asset_assignment;
create trigger prevent_circular_asset_assignment
before insert or update on public.asset_assignment
for each row
execute function public.prevent_circular_asset_assignment();

alter table public.asset_assignment enable row level security;

drop policy if exists "authenticated users can read asset assignments" on public.asset_assignment;
create policy "authenticated users can read asset assignments"
on public.asset_assignment
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create asset assignments" on public.asset_assignment;
create policy "authenticated users can create asset assignments"
on public.asset_assignment
for insert
to authenticated
with check (assigned_by = auth.uid());

drop policy if exists "authenticated users can update asset assignments" on public.asset_assignment;
create policy "authenticated users can update asset assignments"
on public.asset_assignment
for update
to authenticated
using (true)
with check (true);
