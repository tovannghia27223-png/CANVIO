-- CANVIO P170 · Kho tài nguyên mã hóa (Supabase Storage). Chạy MỘT LẦN trong SQL Editor, sau khi đã chạy SQL của P130.
insert into storage.buckets (id, name, public, file_size_limit)
values ('cv-assets', 'cv-assets', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "cv_assets_select_own" on storage.objects;
drop policy if exists "cv_assets_insert_own" on storage.objects;
drop policy if exists "cv_assets_update_own" on storage.objects;
drop policy if exists "cv_assets_delete_own" on storage.objects;

create policy "cv_assets_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_assets_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_assets_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_assets_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
