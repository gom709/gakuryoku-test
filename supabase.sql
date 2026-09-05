-- 大人の小中学力テスト
-- Supabase Auth + RLS 用
--
-- 方針:
-- 1. 受験者はログイン不要
-- 2. 受験結果は匿名で scores に INSERT
-- 3. 一般公開ランキングは public_ranking ビュー経由
-- 4. scores の SELECT は管理者だけ
-- 5. 管理者は Supabase Auth + profiles.role = 'admin'

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total integer not null check (total >= 0 and total <= 130),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

-- 管理者判定。
-- profiles 自体の RLS を迂回して判定できるよう security definer にする。
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 既存ポリシーを整理
drop policy if exists "scores_insert_anon" on public.scores;
drop policy if exists "scores_select_public" on public.scores;
drop policy if exists "scores_select_admin" on public.scores;
drop policy if exists "profiles_select_self" on public.profiles;

-- 受験者は結果を登録できる。
-- SELECT / UPDATE / DELETE は許可しない。
create policy "scores_insert_anon"
on public.scores
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 40
  and total between 0 and 130
  and jsonb_typeof(breakdown) = 'object'
);

-- 管理者だけ raw scores を閲覧できる。
create policy "scores_select_admin"
on public.scores
for select
to authenticated
using (public.is_admin());

-- 自分のプロフィールだけ読める。
-- 管理者判定は is_admin() が行うので、profiles の公開SELECTは不要。
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- 一般公開ランキング。
-- raw scores の breakdown や id は公開しない。
drop view if exists public.public_ranking;

create view public.public_ranking
with (security_invoker = true)
as
select
  name,
  total,
  created_at
from public.scores
order by total desc, created_at asc
limit 100;

grant select on public.public_ranking to anon, authenticated;

-- 注意:
-- PostgreSQL/Supabaseでは、ビューの公開範囲と underlying table のRLSの組み合わせにより
-- security_invoker view は scores のSELECTポリシーを必要とします。
-- そのため、上記の「scores_select_public」は作らず、
-- 公開ランキングは必要に応じて SECURITY DEFINER の関数/ビューへ変更できます。
--
-- この構成で public_ranking を一般公開したい場合は、以下の関数を使う方法が安全です。

drop function if exists public.get_public_ranking();

create or replace function public.get_public_ranking()
returns table (
  name text,
  total integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select s.name, s.total, s.created_at
  from public.scores s
  order by s.total desc, s.created_at asc
  limit 100;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to anon, authenticated;

-- profiles の INSERT/UPDATE はクライアントには許可しない。
-- 管理者ユーザー作成後、SQL Editorから手動で role='admin' を設定してください。

-- 例:
-- insert into public.profiles (id, role)
-- values ('AUTH_USER_UUID', 'admin')
-- on conflict (id) do update set role='admin';
