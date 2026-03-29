-- ============================================================
-- GOLF CHARITY PLATFORM — Supabase Schema
-- Run in Supabase SQL Editor in order
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text not null,
  avatar_url  text,
  role        text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  handicap    numeric(4,1),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                        uuid default uuid_generate_v4() primary key,
  user_id                   uuid references public.profiles(id) on delete cascade not null unique,
  stripe_subscription_id    text unique,
  stripe_customer_id        text,
  plan                      text not null check (plan in ('monthly', 'yearly')),
  status                    text not null default 'inactive'
                              check (status in ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean default false,
  charity_percentage        integer not null default 10 check (charity_percentage between 10 and 100),
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- ============================================================
-- 3. GOLF SCORES
-- ============================================================
create table public.golf_scores (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  score       integer not null check (score between 1 and 45),
  played_at   date not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast user score lookups
create index idx_golf_scores_user_date on public.golf_scores(user_id, played_at desc);

-- ============================================================
-- 4. CHARITIES
-- ============================================================
create table public.charities (
  id            uuid default uuid_generate_v4() primary key,
  name          text not null,
  slug          text not null unique,
  description   text not null,
  logo_url      text,
  banner_url    text,
  website_url   text,
  is_featured   boolean default false,
  is_active     boolean default true,
  total_raised  numeric(12,2) default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.charity_events (
  id          uuid default uuid_generate_v4() primary key,
  charity_id  uuid references public.charities(id) on delete cascade not null,
  title       text not null,
  description text,
  event_date  date not null,
  location    text,
  image_url   text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 5. USER → CHARITY LINK
-- ============================================================
create table public.user_charities (
  user_id                 uuid references public.profiles(id) on delete cascade primary key,
  charity_id              uuid references public.charities(id) on delete set null,
  contribution_percentage integer not null default 10 check (contribution_percentage between 10 and 100),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ============================================================
-- 6. DRAWS
-- ============================================================
create table public.draws (
  id                  uuid default uuid_generate_v4() primary key,
  month               text not null,                  -- e.g. "2025-06"
  title               text not null,
  status              text not null default 'upcoming'
                        check (status in ('upcoming', 'simulation', 'published', 'archived')),
  logic               text not null default 'random'
                        check (logic in ('random', 'algorithmic')),
  winning_numbers     integer[],
  jackpot_amount      numeric(12,2) default 0,
  four_match_amount   numeric(12,2) default 0,
  three_match_amount  numeric(12,2) default 0,
  total_pool          numeric(12,2) default 0,
  participant_count   integer default 0,
  rolled_over_from    uuid references public.draws(id),
  jackpot_rolled_to   uuid references public.draws(id),
  draw_date           date not null,
  published_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- 7. DRAW ENTRIES
-- ============================================================
create table public.draw_entries (
  id               uuid default uuid_generate_v4() primary key,
  draw_id          uuid references public.draws(id) on delete cascade not null,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  scores_snapshot  integer[] not null,
  match_type       text not null default 'no-match'
                     check (match_type in ('5-match', '4-match', '3-match', 'no-match')),
  prize_amount     numeric(12,2) default 0,
  created_at       timestamptz default now(),
  unique(draw_id, user_id)
);

-- ============================================================
-- 8. WINNERS
-- ============================================================
create table public.winners (
  id                    uuid default uuid_generate_v4() primary key,
  draw_id               uuid references public.draws(id) on delete cascade not null,
  user_id               uuid references public.profiles(id) on delete cascade not null,
  draw_entry_id         uuid references public.draw_entries(id),
  match_type            text not null check (match_type in ('5-match', '4-match', '3-match')),
  prize_amount          numeric(12,2) not null,
  verification_status   text not null default 'pending'
                          check (verification_status in ('pending', 'approved', 'rejected')),
  payment_status        text not null default 'pending'
                          check (payment_status in ('pending', 'paid')),
  proof_url             text,
  admin_notes           text,
  verified_at           timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.golf_scores    enable row level security;
alter table public.charities      enable row level security;
alter table public.charity_events enable row level security;
alter table public.user_charities enable row level security;
alter table public.draws          enable row level security;
alter table public.draw_entries   enable row level security;
alter table public.winners        enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Subscriptions: users can read own
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service role can manage all"     on public.subscriptions for all using (true) with check (true);

-- Golf scores: users manage own
create policy "Users can manage own scores" on public.golf_scores for all using (auth.uid() = user_id);
create policy "Admins can view all scores"  on public.golf_scores for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Charities: public read, admin write
create policy "Anyone can view active charities" on public.charities for select using (is_active = true);
create policy "Admins can manage charities"      on public.charities for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Charity events: public read
create policy "Anyone can view charity events" on public.charity_events for select using (true);
create policy "Admins can manage events"       on public.charity_events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- User charities: users manage own
create policy "Users can manage own charity" on public.user_charities for all using (auth.uid() = user_id);

-- Draws: public read (published), admin write
create policy "Anyone can view published draws" on public.draws for select using (status = 'published');
create policy "Admins can manage draws"         on public.draws for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Draw entries: users can view own
create policy "Users can view own draw entries" on public.draw_entries for select using (auth.uid() = user_id);
create policy "Admins can manage draw entries"  on public.draw_entries for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Winners: users can view own and upload proof
create policy "Users can view own winnings"     on public.winners for select using (auth.uid() = user_id);
create policy "Users can update own proof"      on public.winners for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can manage all winners"   on public.winners for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- 10. SEED DATA — Sample Charities
-- ============================================================
insert into public.charities (name, slug, description, is_featured, is_active) values
  ('Golf Foundation', 'golf-foundation', 'Making golf accessible for young people across the UK through grassroots programmes.', true, true),
  ('Macmillan Cancer Support', 'macmillan', 'Providing vital support to people living with cancer and their families.', true, true),
  ('Sport Relief', 'sport-relief', 'Using the power of sport to change lives in the UK and the world''s poorest countries.', false, true),
  ('The Princes Trust', 'princes-trust', 'Helping young people aged 11-30 to reach their potential through enterprise and employment.', false, true),
  ('Mind Mental Health', 'mind', 'Providing advice and support to empower anyone experiencing a mental health problem.', true, true);
