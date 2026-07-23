create table if not exists internal_calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references app_users(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text
);

create index if not exists internal_calendar_events_starts_at_idx on internal_calendar_events(starts_at);
