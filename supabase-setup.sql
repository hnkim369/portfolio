-- =====================================================
-- Supabase 초기 설정 (Dashboard > SQL Editor 에 통째로 붙여넣고 Run)
-- ⚠ 아래 'me@example.com' 을 본인 관리자 이메일로 모두 바꾸세요 (총 4곳)
--    js/config.js 의 ADMIN_EMAIL 과 같아야 합니다.
-- =====================================================

-- 1) 게시글 테이블
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  tags        text[] not null default '{}',
  img_url     text not null,
  img_path    text not null,
  w           int,
  h           int,
  created_at  timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2) RLS: 읽기는 누구나, 쓰기/수정/삭제는 관리자 이메일만
alter table public.posts enable row level security;

create policy "posts_read_all" on public.posts
  for select using (true);

create policy "posts_admin_insert" on public.posts
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'hnkim369@gmail.com');

create policy "posts_admin_update" on public.posts
  for update to authenticated
  using      ((auth.jwt() ->> 'email') = 'hnkim369@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'hnkim369@gmail.com');

create policy "posts_admin_delete" on public.posts
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'hnkim369@gmail.com');

-- 3) 이미지 버킷 (공개 읽기, 5MB 제한, 이미지 형식만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- 4) 스토리지 RLS: 업로드/수정/삭제는 관리자만 (읽기는 공개 버킷이라 URL로 누구나 가능)
create policy "images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (auth.jwt() ->> 'email') = 'hnkim369@gmail.com');

create policy "images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (auth.jwt() ->> 'email') = 'hnkim369@gmail.com');

create policy "images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (auth.jwt() ->> 'email') = 'hnkim369@gmail.com');
