-- Fix: array indexing requires parentheses around the function call

-- Ensure bucket exists (safe if already created)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow only admins to manage the shared avatar library under avatars/library/*

drop policy if exists "Admins can upload avatar library" on storage.objects;
create policy "Admins can upload avatar library"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and public.has_role(auth.uid(), 'admin')
  and (storage.foldername(name))[1] = 'library'
);

drop policy if exists "Admins can update avatar library" on storage.objects;
create policy "Admins can update avatar library"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and public.has_role(auth.uid(), 'admin')
  and (storage.foldername(name))[1] = 'library'
)
with check (
  bucket_id = 'avatars'
  and public.has_role(auth.uid(), 'admin')
  and (storage.foldername(name))[1] = 'library'
);

drop policy if exists "Admins can delete avatar library" on storage.objects;
create policy "Admins can delete avatar library"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and public.has_role(auth.uid(), 'admin')
  and (storage.foldername(name))[1] = 'library'
);
