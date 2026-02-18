-- Phase 2: apply RLS to schedules, quote_log, notification_tokens, and quotes read-only access.

create extension if not exists pgcrypto;

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  reminder_time time not null default '09:00:00',
  timezone text not null default 'America/New_York',
  email_enabled boolean not null default true,
  quote_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  quote_id bigint references public.quotes(id) on delete set null,
  delivery_type text not null check (delivery_type in ('daily_quote', 'mood_reminder')),
  status text not null default 'sent',
  metadata jsonb not null default '{}'::jsonb,
  delivered_at timestamptz not null default now()
);

create table if not exists public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  provider text not null default 'email',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (token)
);

create table if not exists public.quotes (
  id bigserial primary key,
  quote text not null,
  author text not null,
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.schedules to authenticated;
grant select, insert, update, delete on public.quote_log to authenticated;
grant select, insert, update, delete on public.notification_tokens to authenticated;
grant select on public.quotes to authenticated;
revoke insert, update, delete on public.quotes from authenticated;
revoke all on public.quotes from anon;

alter table public.schedules enable row level security;
alter table public.quote_log enable row level security;
alter table public.notification_tokens enable row level security;
alter table public.quotes enable row level security;

do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'schedules' loop
    execute format('drop policy if exists %I on public.schedules', pol.policyname);
  end loop;

  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'quote_log' loop
    execute format('drop policy if exists %I on public.quote_log', pol.policyname);
  end loop;

  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'notification_tokens' loop
    execute format('drop policy if exists %I on public.notification_tokens', pol.policyname);
  end loop;

  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'quotes' loop
    execute format('drop policy if exists %I on public.quotes', pol.policyname);
  end loop;
end
$$;

create policy schedules_select_own
  on public.schedules
  for select
  using (user_id = auth.uid());

create policy schedules_insert_own
  on public.schedules
  for insert
  with check (user_id = auth.uid());

create policy schedules_update_own
  on public.schedules
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy schedules_delete_own
  on public.schedules
  for delete
  using (user_id = auth.uid());

create policy quote_log_select_own
  on public.quote_log
  for select
  using (user_id = auth.uid());

create policy quote_log_insert_own
  on public.quote_log
  for insert
  with check (user_id = auth.uid());

create policy quote_log_update_own
  on public.quote_log
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy quote_log_delete_own
  on public.quote_log
  for delete
  using (user_id = auth.uid());

create policy notification_tokens_select_own
  on public.notification_tokens
  for select
  using (user_id = auth.uid());

create policy notification_tokens_insert_own
  on public.notification_tokens
  for insert
  with check (user_id = auth.uid());

create policy notification_tokens_update_own
  on public.notification_tokens
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notification_tokens_delete_own
  on public.notification_tokens
  for delete
  using (user_id = auth.uid());

-- Quotes are read-only for authenticated users.
create policy quotes_select_authenticated
  on public.quotes
  for select
  using (auth.role() = 'authenticated');

create index if not exists idx_schedules_user_id on public.schedules(user_id);
create index if not exists idx_quote_log_user_id on public.quote_log(user_id);
create index if not exists idx_notification_tokens_user_id on public.notification_tokens(user_id);
