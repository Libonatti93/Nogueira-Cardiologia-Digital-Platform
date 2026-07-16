create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  phone_whatsapp text,
  role text not null default 'patient' check (role in ('patient', 'admin', 'doctor', 'medico', 'médico'))
);

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.educativo_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text not null,
  category text not null,
  tags text[] not null default '{}',
  cover_image_url text,
  seo_title text,
  seo_description text,
  reading_time text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sections jsonb not null default '[]'::jsonb
);

create index if not exists educativo_posts_status_published_at_idx
  on public.educativo_posts (status, published_at desc);

create index if not exists educativo_posts_slug_idx
  on public.educativo_posts (slug);

create index if not exists educativo_posts_category_idx
  on public.educativo_posts (category);

alter table public.profiles enable row level security;
alter table public.educativo_posts enable row level security;

create or replace function public.is_medical_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'doctor', 'medico', 'médico')
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Medical admins can manage posts" on public.educativo_posts;
create policy "Medical admins can manage posts"
  on public.educativo_posts
  for all
  using (public.is_medical_admin())
  with check (public.is_medical_admin());

drop policy if exists "Everyone can read published posts" on public.educativo_posts;
create policy "Everyone can read published posts"
  on public.educativo_posts
  for select
  using (status = 'published');

insert into storage.buckets (id, name, public)
values ('educativo-covers', 'educativo-covers', true)
on conflict (id) do nothing;

drop policy if exists "Medical admins can upload educativo covers" on storage.objects;
create policy "Medical admins can upload educativo covers"
  on storage.objects
  for insert
  with check (bucket_id = 'educativo-covers' and public.is_medical_admin());

drop policy if exists "Medical admins can update educativo covers" on storage.objects;
create policy "Medical admins can update educativo covers"
  on storage.objects
  for update
  using (bucket_id = 'educativo-covers' and public.is_medical_admin())
  with check (bucket_id = 'educativo-covers' and public.is_medical_admin());

drop policy if exists "Everyone can read educativo covers" on storage.objects;
create policy "Everyone can read educativo covers"
  on storage.objects
  for select
  using (bucket_id = 'educativo-covers');
