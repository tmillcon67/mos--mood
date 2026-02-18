-- Phase 1: checkins only (safe rollout)

create extension if not exists pgcrypto;

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood smallint not null check (mood between 1 and 10),
  note text,
  checkin_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Ensure authenticated users can operate on this table.
grant select, insert, update, delete on public.checkins to authenticated;

alter table public.checkins enable row level security;

-- Drop all existing policies to avoid accidental broad access via policy union.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'checkins'
  loop
    execute format('drop policy if exists %I on public.checkins', pol.policyname);
  end loop;
end
$$;

create policy checkins_select_own
  on public.checkins
  for select
  using (user_id = auth.uid());

create policy checkins_insert_own
  on public.checkins
  for insert
  with check (user_id = auth.uid());

create policy checkins_update_own
  on public.checkins
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy checkins_delete_own
  on public.checkins
  for delete
  using (user_id = auth.uid());

create index if not exists idx_checkins_user_id on public.checkins(user_id);
