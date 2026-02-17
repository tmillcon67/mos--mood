create extension if not exists pgcrypto;

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood smallint not null check (mood between 1 and 10),
  note text,
  checkin_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

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

create table if not exists public.quotes (
  id bigserial primary key,
  quote text not null,
  author text not null,
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
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

create index if not exists idx_checkins_user_id_checkin_at on public.checkins(user_id, checkin_at desc);
create index if not exists idx_quote_log_user_id on public.quote_log(user_id);

alter table public.checkins enable row level security;
alter table public.schedules enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_log enable row level security;

drop policy if exists "Users can read own checkins" on public.checkins;
drop policy if exists "Users can insert own checkins" on public.checkins;
drop policy if exists "Users can update own checkins" on public.checkins;
drop policy if exists "Users can delete own checkins" on public.checkins;
drop policy if exists "Users can read own schedules" on public.schedules;
drop policy if exists "Users can insert own schedules" on public.schedules;
drop policy if exists "Users can update own schedules" on public.schedules;
drop policy if exists "Authenticated users can read active quotes" on public.quotes;
drop policy if exists "Users can read own quote_log" on public.quote_log;
drop policy if exists "Users can insert own quote_log" on public.quote_log;

create policy "Users can read own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checkins"
  on public.checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own checkins"
  on public.checkins for delete
  using (auth.uid() = user_id);

create policy "Users can read own schedules"
  on public.schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own schedules"
  on public.schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on public.schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users can read active quotes"
  on public.quotes for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Users can read own quote_log"
  on public.quote_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own quote_log"
  on public.quote_log for insert
  with check (auth.uid() = user_id);

insert into public.quotes (quote, author, source, is_active)
values
  ('You have power over your mind, not outside events.', 'Marcus Aurelius', 'Meditations', true),
  ('The happiness of your life depends upon the quality of your thoughts.', 'Marcus Aurelius', 'Meditations', true),
  ('Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations', true)
on conflict do nothing;
