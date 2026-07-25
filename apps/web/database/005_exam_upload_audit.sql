alter table patient_exam_uploads
  add column if not exists upload_ip inet,
  add column if not exists user_agent text,
  add column if not exists device_platform text,
  add column if not exists accept_language text,
  add column if not exists location_latitude numeric(9,6),
  add column if not exists location_longitude numeric(9,6),
  add column if not exists location_accuracy_m integer,
  add column if not exists location_consent_at timestamptz,
  add column if not exists international_transfer_consent_at timestamptz,
  add column if not exists privacy_notice_version text,
  add column if not exists file_sha256 text;

create index if not exists patient_exam_uploads_unreviewed_idx
  on patient_exam_uploads(status, created_at desc)
  where reviewed_at is null;
