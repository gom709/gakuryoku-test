create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total integer not null check (total between 0 and 130),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path=public
stable
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role='admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "scores_insert_anon" on public.scores;
drop policy if exists "scores_select_admin" on public.scores;
drop policy if exists "profiles_select_self" on public.profiles;

create policy "scores_insert_anon"
on public.scores for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 40
  and total between 0 and 130
  and jsonb_typeof(breakdown)='object'
);

create policy "scores_select_admin"
on public.scores for select
to authenticated
using (public.is_admin());

create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (id=auth.uid());

create or replace function public.get_public_ranking()
returns table(name text,total integer,created_at timestamptz)
language sql
security definer
set search_path=public
stable
as $$
  select s.name,s.total,s.created_at
  from public.scores s
  order by s.total desc,s.created_at asc
  limit 100;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to anon, authenticated;

-- 管理者ユーザーをSupabase Authentication > Usersで作成した後、
-- そのUser IDを以下のSQLの 'AUTH_USER_UUID' に入れて実行してください。
--
-- insert into public.profiles(id,role)
-- values ('AUTH_USER_UUID','admin')
-- on conflict(id) do update set role='admin';
