-- CANVIO P130 · Đồng bộ đám mây có mã hóa đầu-cuối. Chạy MỘT LẦN trong Supabase → SQL Editor.
-- Máy chủ chỉ lưu dữ liệu ĐÃ MÃ HÓA bằng cụm mật khẩu của bạn; RLS bảo đảm mỗi tài khoản chỉ đọc/ghi dữ liệu của chính mình.

create table if not exists public.cv_meta (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  salt       text  not null,
  kdf_iter   int   not null default 600000,
  check_enc  jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cv_documents (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doc_key    text not null check (char_length(doc_key) between 1 and 300),
  updated_at timestamptz not null,
  enc        jsonb not null,
  size_bytes int,
  primary key (user_id, doc_key)
);

alter table public.cv_meta      enable row level security;
alter table public.cv_documents enable row level security;

drop policy if exists "cv_meta_own"      on public.cv_meta;
drop policy if exists "cv_documents_own" on public.cv_documents;

create policy "cv_meta_own" on public.cv_meta
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "cv_documents_own" on public.cv_documents
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Người chưa đăng nhập (anon) không được chạm vào hai bảng này.
revoke all on public.cv_meta, public.cv_documents from anon;
grant select, insert, update, delete on public.cv_meta, public.cv_documents to authenticated;
