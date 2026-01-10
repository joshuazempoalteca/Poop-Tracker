-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public info for users)
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  level int default 1,
  xp int default 0,
  prestige int default 0,
  is_ai_enabled boolean default false,
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- POOP LOGS
create table poop_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default now(),
  type int not null, -- Bristol Type 1-7
  notes text,
  duration_minutes int,
  ai_commentary text,
  pain_level int,
  wipes int,
  is_clog boolean default false,
  size text, -- SMALL, MEDIUM, LARGE, MASSIVE
  has_blood boolean default false,
  xp_gained int default 0,
  image_url text,
  is_private boolean default false
);

alter table poop_logs enable row level security;
-- Users can full access their own logs
create policy "Users can CRUD their own logs" on poop_logs for all using (auth.uid() = user_id);
-- Friends can view logs (simplified to authenticated users for now for simplicity, or refine)
create policy "Authenticated users can view non-private logs" on poop_logs for select using (auth.role() = 'authenticated' and is_private = false);

-- FRIENDSHIPS
create table friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  friend_id uuid references profiles(id) not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

alter table friendships enable row level security;
create policy "Users can view their friendships" on friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can send requests" on friendships for insert with check (auth.uid() = user_id);
create policy "Users can update status (accept/reject)" on friendships for update using (auth.uid() = friend_id);

-- STORAGE (Run this if you want image uploads)
-- insert into storage.buckets (id, name, public) values ('poop-images', 'poop-images', true);
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'poop-images' );
-- create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'poop-images' and auth.role() = 'authenticated' );
