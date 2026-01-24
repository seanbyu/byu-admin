-- Create a new storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Policy: Allow authenticated users to upload files to 'avatars'
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Policy: Allow authenticated users to update their own avatars (or any if admin, simplified here to auth)
create policy "Authenticated users can update avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Policy: Allow public to view avatars
create policy "Public can view avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );
