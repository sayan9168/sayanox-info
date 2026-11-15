-- Sayanox Info Wiki - Supabase Schema
-- Run this in your Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz default now()
);

create table public.pages (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  content text not null default '',
  category text,
  tags text[] default '{}',
  status text default 'pending' check (status in ('draft', 'pending', 'published', 'rejected')),
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version integer default 1
);

create table public.page_versions (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  content text not null,
  title text not null,
  version integer not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  change_summary text
);

create index pages_status_idx on public.pages(status);
create index pages_category_idx on public.pages(category);
create index pages_updated_at_idx on public.pages(updated_at desc);
create index pages_slug_idx on public.pages(slug);
create index pages_tags_idx on public.pages using gin(tags);

alter table public.pages add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) stored;

create index pages_fts_idx on public.pages using gin(fts);

alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Published pages are viewable by everyone"
  on public.pages for select using (
    status = 'published' or 
    author_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator'))
  );

create policy "Authenticated users can insert pages"
  on public.pages for insert with check (auth.uid() = author_id);

create policy "Authors and admins can update pages"
  on public.pages for update using (
    author_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator'))
  );

create policy "Versions viewable with page"
  on public.page_versions for select using (true);

create policy "Authenticated can insert versions"
  on public.page_versions for insert with check (auth.uid() = author_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on public.pages
  for each row execute procedure public.handle_updated_at();
