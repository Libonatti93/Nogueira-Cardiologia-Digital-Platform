create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type user_role as enum ('patient', 'secretary', 'doctor', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type lead_stage as enum (
    'new',
    'contact_started',
    'interested',
    'registered',
    'awaiting_payment',
    'paid',
    'confirmed',
    'reschedule',
    'lost'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type appointment_status as enum (
    'requested',
    'awaiting_payment',
    'paid',
    'confirmed',
    'cancelled',
    'rescheduled',
    'attended',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum (
    'pending',
    'authorized',
    'paid',
    'overdue',
    'refunded',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type post_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email citext not null unique,
  password_hash text,
  role user_role not null default 'patient',
  full_name text not null,
  phone_whatsapp text,
  is_active boolean not null default true,
  last_login_at timestamptz
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  crm text,
  specialty text,
  bio text,
  is_active boolean not null default true
);

create table if not exists secretaries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references app_users(id) on delete set null,
  full_name text not null,
  is_active boolean not null default true
);

create table if not exists patient_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references app_users(id) on delete set null,
  full_name text not null,
  cpf text unique,
  email citext not null,
  phone_whatsapp text not null,
  birth_date date,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  lgpd_consent_at timestamptz,
  lgpd_consent_ip inet
);

create table if not exists patient_health_intakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  has_hypertension boolean not null default false,
  has_diabetes boolean not null default false,
  has_high_cholesterol boolean not null default false,
  is_smoker boolean not null default false,
  notes text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email citext,
  phone_whatsapp text,
  source text not null default 'site',
  source_detail text,
  stage lead_stage not null default 'new',
  assigned_secretary_id uuid references secretaries(id) on delete set null,
  patient_id uuid references patient_profiles(id) on delete set null,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  lost_reason text
);

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  event_type text not null,
  old_stage lead_stage,
  new_stage lead_stage,
  note text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  patient_id uuid not null references patient_profiles(id) on delete restrict,
  doctor_id uuid references doctors(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  scheduled_for timestamptz,
  status appointment_status not null default 'requested',
  reason text,
  internal_notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  patient_id uuid not null references patient_profiles(id) on delete restrict,
  appointment_id uuid references appointments(id) on delete set null,
  provider text not null default 'asaas',
  provider_customer_id text,
  provider_payment_id text unique,
  billing_type text,
  status payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  checkout_url text,
  pix_qr_code text,
  due_date date,
  paid_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists educativo_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  author_id uuid references app_users(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text not null,
  category text not null,
  tags text[] not null default '{}',
  cover_image_url text,
  seo_title text,
  seo_description text,
  reading_time text,
  status post_status not null default 'draft',
  sections jsonb not null default '[]'::jsonb
);

create table if not exists educativo_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email citext not null,
  phone_whatsapp text not null,
  post_slug text not null,
  post_title text not null,
  source text not null default 'educativo',
  user_agent text,
  lead_id uuid references leads(id) on delete set null,
  contacted_at timestamptz,
  notes text
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists app_users_role_idx on app_users(role);
create index if not exists patient_profiles_email_idx on patient_profiles(email);
create index if not exists patient_profiles_phone_idx on patient_profiles(phone_whatsapp);
create index if not exists patient_profiles_cpf_idx on patient_profiles(cpf);
create index if not exists leads_stage_created_at_idx on leads(stage, created_at desc);
create index if not exists leads_phone_idx on leads(phone_whatsapp);
create index if not exists leads_email_idx on leads(email);
create index if not exists lead_events_lead_created_idx on lead_events(lead_id, created_at desc);
create index if not exists appointments_status_scheduled_idx on appointments(status, scheduled_for);
create index if not exists appointments_patient_idx on appointments(patient_id);
create index if not exists appointments_doctor_idx on appointments(doctor_id);
create index if not exists payments_status_created_idx on payments(status, created_at desc);
create index if not exists payments_provider_payment_idx on payments(provider_payment_id);
create unique index if not exists doctors_full_name_unique_idx on doctors(full_name);
create index if not exists educativo_posts_status_published_idx on educativo_posts(status, published_at desc);
create index if not exists educativo_posts_slug_idx on educativo_posts(slug);
create index if not exists educativo_leads_created_idx on educativo_leads(created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs(entity_type, entity_id, created_at desc);

insert into doctors (full_name, crm, specialty, bio)
values
  (
    'Dr. Paulo Roberto Nogueira',
    'CRM 53.790/SP',
    'Cardiologia clínica e terapia intensiva',
    'Cardiologista intensivista, referência em cardiologia clínica, com foco de atuação em coronariopatias e cardiomiopatias.'
  ),
  (
    'Dra. Cristiani Monteiro de Oliveira Nogueira',
    'CRM 77.127/SP',
    'Cardiologia clínica',
    'Médica cardiologista clínica, com atendimento humanizado de alto padrão voltado para o cuidado da saúde global.'
  )
on conflict (full_name) do nothing;
