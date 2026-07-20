alter table app_users
  add column if not exists email_verified_at timestamptz;

update app_users
set email_verified_at = coalesce(email_verified_at, now())
where email_verified_at is null
  and created_at < now() - interval '1 minute';

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  sent_to_email citext not null,
  purpose text not null default 'signup'
);

create index if not exists email_verification_tokens_user_idx on email_verification_tokens(user_id, created_at desc);
create index if not exists email_verification_tokens_active_idx on email_verification_tokens(user_id, consumed_at, expires_at);
