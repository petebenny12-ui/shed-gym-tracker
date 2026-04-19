-- Per-user exercise settings (weight mode: total vs per_side)
-- Each user can independently classify how they record weight for each exercise.
-- "per_side" means they enter the weight on one side; VS comparisons double it.
-- "total" means they enter the total bar weight; used as-is.

create table if not exists user_exercise_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  weight_mode text not null default 'total' check (weight_mode in ('total', 'per_side')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, exercise_id)
);

-- RLS
alter table user_exercise_settings enable row level security;

create policy "Users can read own exercise settings"
  on user_exercise_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own exercise settings"
  on user_exercise_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exercise settings"
  on user_exercise_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own exercise settings"
  on user_exercise_settings for delete
  using (auth.uid() = user_id);
