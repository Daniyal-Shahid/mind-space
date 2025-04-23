create table "SleepEntry" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "UserProfile"(id) on delete cascade,
  date date not null default current_date,
  hours_slept numeric not null, 
  sleep_quality numeric not null, -- e.g., 1-12
  created_at timestamp default now()
);

-- RLS
alter table "SleepEntry" enable row level security;

create policy "Users can access their own sleep entries"
  on "SleepEntry"
  for all
  using (auth.uid() = user_id);

-- Add FoodEntry table
create table "FoodEntry" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "UserProfile"(id) on delete cascade,
  date date not null default current_date,
  meals text, -- user writes: "Pasta, apple, green tea"
  feeling_after text, -- optional note
  created_at timestamp default now()
);

-- RLS
alter table "FoodEntry" enable row level security;

create policy "Users can access their own food entries"
  on "FoodEntry"
  for all
  using (auth.uid() = user_id);

-- Add WaterEntry table
create table "WaterEntry" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "UserProfile"(id) on delete cascade,
  date date not null default current_date,
  cups integer not null, -- # of cups or glasses
  created_at timestamp default now()
);

-- RLS
alter table "WaterEntry" enable row level security;

create policy "Users can access their own water entries"
  on "WaterEntry"
  for all
  using (auth.uid() = user_id);


-- Add GratitudeEntry table
create table "GratitudeEntry" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "UserProfile"(id) on delete cascade,
  date date not null default current_date,
  gratitude_items text, -- comma-separated or paragraph style
  created_at timestamp default now()
);

-- RLS
alter table "GratitudeEntry" enable row level security;

create policy "Users can access their own gratitude entries"
  on "GratitudeEntry"
  for all
  using (auth.uid() = user_id);
