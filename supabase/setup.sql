-- Portfolio content storage. Run once in Supabase → SQL Editor (safe to re-run).
--
-- • portfolio_content  one row (id = 1) holding all site content as JSON;
--                      anyone can read it, only admins can write it.
-- • portfolio_admins   the Supabase Auth users allowed to edit.
-- • storage "portfolio" public bucket for uploaded images; admins upload.

create table if not exists public.portfolio_content (
  id         int primary key default 1 check (id = 1),
  content    jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.portfolio_content enable row level security;
alter table public.portfolio_admins  enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()));
$$;

-- Content: public read, admin write.
drop policy if exists "portfolio content is public"   on public.portfolio_content;
drop policy if exists "admins insert portfolio content" on public.portfolio_content;
drop policy if exists "admins update portfolio content" on public.portfolio_content;

create policy "portfolio content is public" on public.portfolio_content
  for select to anon, authenticated using (true);
create policy "admins insert portfolio content" on public.portfolio_content
  for insert to authenticated with check (public.is_portfolio_admin());
create policy "admins update portfolio content" on public.portfolio_content
  for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

-- Admins can see their own membership (the admin page checks it at sign-in).
drop policy if exists "admins see themselves" on public.portfolio_admins;
create policy "admins see themselves" on public.portfolio_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- File bucket: public read, admin list/upload/replace/delete. 10 MB; images
-- (projects/) and résumés as PDF or Word (resumes/).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 10485760, array[
  'image/webp', 'image/png', 'image/jpeg', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins list portfolio files" on storage.objects;
drop policy if exists "admins upload portfolio images" on storage.objects;
drop policy if exists "admins update portfolio images" on storage.objects;
drop policy if exists "admins delete portfolio images" on storage.objects;

-- Listing (and deleting, which Supabase checks through select too) needs this.
create policy "admins list portfolio files" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());
create policy "admins upload portfolio images" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_portfolio_admin());
create policy "admins update portfolio images" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());
create policy "admins delete portfolio images" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_portfolio_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Make yourself an admin:
--   1. Authentication → Users → "Add user" → create your email + password
--      (tick "Auto Confirm User").
--   2. Replace the email below and run this line:
--
-- insert into public.portfolio_admins (user_id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict do nothing;
-- ─────────────────────────────────────────────────────────────────────────
