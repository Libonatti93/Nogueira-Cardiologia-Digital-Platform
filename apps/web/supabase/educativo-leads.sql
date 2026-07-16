create extension if not exists pgcrypto;

create table if not exists public.educativo_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone_whatsapp text not null,
  post_slug text not null,
  post_title text not null,
  source text not null default 'educativo',
  user_agent text,
  contacted_at timestamptz,
  notes text
);

create index if not exists educativo_leads_created_at_idx
  on public.educativo_leads (created_at desc);

create index if not exists educativo_leads_email_idx
  on public.educativo_leads (lower(email));

create index if not exists educativo_leads_phone_whatsapp_idx
  on public.educativo_leads (phone_whatsapp);

create index if not exists educativo_leads_post_slug_idx
  on public.educativo_leads (post_slug);

alter table public.educativo_leads enable row level security;

drop policy if exists "Block public lead reads" on public.educativo_leads;
create policy "Block public lead reads"
  on public.educativo_leads
  for select
  using (false);

drop policy if exists "Block public lead writes" on public.educativo_leads;
create policy "Block public lead writes"
  on public.educativo_leads
  for insert
  with check (false);
