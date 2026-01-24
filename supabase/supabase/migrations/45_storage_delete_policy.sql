-- Policy: Allow authenticated users to delete their own avatars (or any if admin)
create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );
