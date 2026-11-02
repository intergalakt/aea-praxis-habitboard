-- HAB-3: Habit-Tracker — Tabellen, Constraints, Indizes, Row Level Security.
-- Quelle: docs/data-model.md. Idempotent formuliert, damit `supabase db reset`
-- und ein erneutes Anwenden aus dem Repo nicht brechen.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- habits
create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now(),

  -- AC-1 / AC-9: 1–80 Zeichen nach Trim, keine reinen Leerzeichen.
  constraint habits_title_length check (char_length(btrim(title)) between 1 and 80)
);

create index if not exists habits_user_created_idx
  on public.habits (user_id, created_at);

-- --------------------------------------------------------- habit_entries
create table if not exists public.habit_entries (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  -- denormalisiert, damit die Policy ohne Join auf habits auskommt
  user_id    uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),

  -- AC-3 / EC-3: doppeltes Abhaken ist ein No-Op, kein zweiter Eintrag.
  constraint habit_entries_unique_day unique (habit_id, entry_date),
  -- AC-9: keine Einträge in der Zukunft.
  constraint habit_entries_no_future check (entry_date <= current_date)
);

create index if not exists habit_entries_habit_date_idx
  on public.habit_entries (habit_id, entry_date desc);

create index if not exists habit_entries_user_idx
  on public.habit_entries (user_id);

-- ------------------------------------------------------- Row Level Security
alter table public.habits        enable row level security;
alter table public.habit_entries enable row level security;

-- habits: Zeilen gehören dem Nutzer, der sie angelegt hat (AC-8).
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (user_id = (select auth.uid()));

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete using (user_id = (select auth.uid()));

-- habit_entries: gleiche Regel, ohne Join auf habits (AC-8).
drop policy if exists "habit_entries_select_own" on public.habit_entries;
create policy "habit_entries_select_own" on public.habit_entries
  for select using (user_id = (select auth.uid()));

drop policy if exists "habit_entries_insert_own" on public.habit_entries;
create policy "habit_entries_insert_own" on public.habit_entries
  for insert with check (
    user_id = (select auth.uid())
    -- Der Eintrag muss zu einer eigenen Gewohnheit gehören.
    and exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = (select auth.uid())
    )
  );

drop policy if exists "habit_entries_update_own" on public.habit_entries;
create policy "habit_entries_update_own" on public.habit_entries
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "habit_entries_delete_own" on public.habit_entries;
create policy "habit_entries_delete_own" on public.habit_entries
  for delete using (user_id = (select auth.uid()));
