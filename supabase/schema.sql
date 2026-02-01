-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Public Profiles table (extends Supabase Auth users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  xp integer default 0,
  streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Tracks (e.g., AI Fundamentals, ML)
create table public.tracks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  order_index integer unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  track_id uuid references public.tracks(id) not null,
  title text not null,
  content jsonb, -- structured content for the lesson
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert dummy data for Tracks
insert into public.tracks (title, description, order_index)
values
('AI Fundamentals', 'Basics of Artificial Intelligence', 1),
('Machine Learning', 'Introduction to ML algorithms', 2),
('Deep Learning', 'Neural Networks and beyond', 3),
('Generative AI', 'LLMs and Image generation', 4),
('Prompt Engineering', 'Mastering prompts', 5);

-- Additional Placeholder Tables for Full Schema support

create table public.user_progress (
  user_id uuid references public.profiles(id),
  lesson_id uuid references public.lessons(id),
  completed boolean default false,
  score integer,
  completed_at timestamp with time zone default now(),
  primary key (user_id, lesson_id)
);

create table public.news_items (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  image_url text,
  published_at timestamp with time zone default now()
);

create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  passing_score integer default 70
);

create table public.user_certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  exam_id uuid references public.exams(id),
  issued_at timestamp with time zone default now(),
  certificate_url text
);

-- Milestone 1: Progress Tracking Tables

-- Lesson Attempts (History of individual lesson performance)
create table public.lesson_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  lesson_id uuid references public.lessons(id) not null,
  score integer default 0,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Lesson Attempts
alter table public.lesson_attempts enable row level security;

create policy "Users can insert their own attempts."
  on lesson_attempts for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own attempts."
  on lesson_attempts for select
  using ( auth.uid() = user_id );
