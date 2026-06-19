create table if not exists public.document_attachment (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (
    owner_type in ('asset', 'plant', 'maintenance_record', 'deployment', 'consumable_batch', 'location')
  ),
  owner_id uuid not null,
  file_name text not null,
  file_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz null
);

create index if not exists document_attachment_owner_idx
  on public.document_attachment(owner_type, owner_id, created_at desc);

create index if not exists document_attachment_active_idx
  on public.document_attachment(owner_type, owner_id)
  where archived_at is null;

alter table public.document_attachment enable row level security;

create policy "authenticated users can read active document attachments"
  on public.document_attachment
  for select
  to authenticated
  using (archived_at is null);

create policy "system admins can read archived document attachments"
  on public.document_attachment
  for select
  to authenticated
  using (
    archived_at is not null
    and exists (
      select 1
      from public.app_user_profile profile
      join public.role role_row on role_row.id = profile.role_id
      where profile.user_id = auth.uid()
        and role_row.name = 'system_admin'
    )
  );

create policy "authenticated users can create document attachments"
  on public.document_attachment
  for insert
  to authenticated
  with check (uploaded_by = auth.uid());

create policy "authenticated users can archive document attachments"
  on public.document_attachment
  for update
  to authenticated
  using (archived_at is null)
  with check (uploaded_by = auth.uid() or exists (
    select 1
    from public.app_user_profile profile
    join public.role role_row on role_row.id = profile.role_id
    where profile.user_id = auth.uid()
      and role_row.name = 'system_admin'
  ));

insert into storage.buckets (id, name, public)
values ('document-attachments', 'document-attachments', false)
on conflict (id) do nothing;

create policy "authenticated users can read document attachment objects"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'document-attachments');

create policy "authenticated users can upload document attachment objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'document-attachments'
    and auth.uid() is not null
  );

create policy "authenticated users can update document attachment objects"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'document-attachments')
  with check (bucket_id = 'document-attachments');

create policy "authenticated users can delete document attachment objects"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'document-attachments');
