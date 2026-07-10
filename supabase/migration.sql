-- PTE Tracker — initial schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query > paste > Run).

create table if not exists skill_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  overall integer,
  listening integer not null,
  reading integer not null,
  speaking integer not null,
  writing integer not null,
  exam_date date not null,
  prep_start_date date not null,
  goal_type text,
  goal_name text,
  updated_at timestamptz not null default now()
);

create table if not exists question_types (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  skill text not null,
  target numeric,
  primary key (user_id, code)
);

create table if not exists entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  tipo text not null,
  skill text not null,
  detalle text not null,
  puntaje integer not null,
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists question_details (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  skill text not null,
  item text not null,
  contribute numeric not null,
  correctness numeric not null,
  notas text,
  entry_id text,
  entry_detalle text,
  completed boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_id_idx on entries (user_id);
create index if not exists question_details_user_id_idx on question_details (user_id);

alter table skill_targets enable row level security;
alter table question_types enable row level security;
alter table entries enable row level security;
alter table question_details enable row level security;

create policy "Users manage their own skill_targets" on skill_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own question_types" on question_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own question_details" on question_details
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
