update public.consumable_category
set archived_at = coalesce(archived_at, now())
where name in ('Clinical', 'Clinical consumables', 'Logistics', 'Logistics consumables');

insert into public.consumable_category (name, description)
values
  ('Food/Water', 'Food, drinking water, and refreshment supplies.'),
  ('Material Aid', 'Material aid and relief consumables.')
on conflict (name) do update
set
  description = excluded.description,
  archived_at = null;
