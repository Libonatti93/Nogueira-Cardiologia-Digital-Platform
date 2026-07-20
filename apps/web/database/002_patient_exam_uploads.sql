create table if not exists patient_exam_uploads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploaded_by_user_id uuid references app_users(id) on delete set null,
  patient_id uuid references patient_profiles(id) on delete set null,
  patient_full_name text not null,
  patient_email citext not null,
  patient_phone_whatsapp text,
  exam_type text not null,
  exam_date date,
  notes text,
  original_file_name text not null,
  stored_file_name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes integer not null check (file_size_bytes > 0),
  status text not null default 'received',
  doctor_comment text,
  reviewed_by_user_id uuid references app_users(id) on delete set null,
  reviewed_at timestamptz
);

create index if not exists patient_exam_uploads_created_idx on patient_exam_uploads(created_at desc);
create index if not exists patient_exam_uploads_patient_email_idx on patient_exam_uploads(patient_email);
create index if not exists patient_exam_uploads_uploaded_by_idx on patient_exam_uploads(uploaded_by_user_id);
create index if not exists patient_exam_uploads_status_idx on patient_exam_uploads(status, created_at desc);
