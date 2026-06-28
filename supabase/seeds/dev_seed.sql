-- Development seed data for the SAES Asset Register.
-- Run migrations first, then create at least one QA/admin user profile before applying this seed.

with actor as (
  select user_id
  from public.app_user_profile
  order by created_at asc
  limit 1
)
insert into public.asset_category (name, description, created_by, updated_by)
select *
from (
  values
    ('Vehicles', 'Response vehicles, trailers, and tow-capable assets.'),
    ('Plant', 'Portable generators, pumps, and support equipment.')
) as seed(name, description)
cross join actor
on conflict do nothing;

with actor as (
  select user_id
  from public.app_user_profile
  order by created_at asc
  limit 1
)
insert into public.consumable_category (name, description, created_by, updated_by)
select *
from (
  values
    ('PPE', 'Protective equipment and field consumables.'),
    ('Food/Water', 'Food, drinking water, and refreshment supplies.'),
    ('Material Aid', 'Material aid and relief consumables.')
) as seed(name, description)
cross join actor
on conflict do nothing;

with actor as (
  select user_id
  from public.app_user_profile
  order by created_at asc
  limit 1
)
insert into public.location (name, type, address, state, notes, created_by, updated_by)
select *
from (
  values
    ('Ballarat depot', 'warehouse', '102 Depot Road, Ballarat VIC', 'Victoria', 'Primary warehousing and dispatch point.'),
    ('Hamilton staging', 'temporary_deployment', '17 Relief Lane, Hamilton VIC', 'Victoria', 'Temporary field staging location.')
) as seed(name, type, address, state, notes)
cross join actor
on conflict do nothing;

with actor as (
  select user_id
  from public.app_user_profile
  order by created_at asc
  limit 1
)
insert into public.maintenance_vendor (
  business_name,
  contact_name,
  phone,
  email,
  address,
  website,
  notes,
  created_by,
  updated_by
)
select *
from (
  values
    (
      'Western District Fleet',
      'Sam Taylor',
      '03 5550 1200',
      'service@wdfleet.example',
      '44 Industrial Drive, Ballarat VIC',
      'https://wdfleet.example',
      'Vehicles, trailers, and portable generators.'
    )
) as seed(business_name, contact_name, phone, email, address, website, notes)
cross join actor
on conflict do nothing;
