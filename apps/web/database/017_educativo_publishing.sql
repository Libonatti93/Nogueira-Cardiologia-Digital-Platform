-- Additive: legacy sections, URLs, publication dates and registrations are preserved.
alter table educativo_posts
  add column if not exists content_html text,
  add column if not exists content_type text not null default 'ARTICLE' check (content_type in ('ARTICLE','CLASS','EDUCATIONAL_MATERIAL')),
  add column if not exists requires_registration boolean not null default false,
  add column if not exists primary_keyword text not null default '',
  add column if not exists secondary_keywords text[] not null default '{}',
  add column if not exists cover_alt text not null default '',
  add column if not exists cover_caption text not null default '',
  add column if not exists author_profile_slug text,
  add column if not exists updated_by_id uuid references app_users(id) on delete set null,
  add column if not exists revision integer not null default 1,
  add column if not exists draft_payload jsonb,
  add column if not exists material_details jsonb not null default '{}',
  add column if not exists attachment_ids uuid[] not null default '{}';

create table if not exists educativo_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references educativo_posts(id) on delete restrict,
  type text not null check (type in ('IMAGE','PDF','POWERPOINT')),
  original_filename text not null,
  stored_name uuid not null unique,
  mime_type text not null,
  size bigint not null check (size > 0),
  checksum text not null,
  preview_bytes bytea,
  preview_kind text not null default 'cover' check (preview_kind in ('cover','embedded')),
  slide_count integer,
  title text not null,
  description text not null default '',
  alt text not null default '',
  caption text not null default '',
  purpose text not null check (purpose in ('COVER','INLINE','MATERIAL')),
  display_order integer not null default 0,
  created_by_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists educativo_attachments_post_idx on educativo_post_attachments(post_id,display_order);

-- Access sessions refer to the existing registration base; no duplicate subscriber table.
create table if not exists educativo_access_sessions (
  token_hash text primary key,
  educational_lead_id uuid not null references educativo_leads(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists educativo_access_expiry_idx on educativo_access_sessions(expires_at);
create index if not exists educativo_leads_email_post_idx on educativo_leads(lower(email::text),post_slug);
