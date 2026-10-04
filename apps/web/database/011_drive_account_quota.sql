-- A null override keeps the existing 50 GiB default. No account is changed here.
alter table app_users add column drive_quota_bytes bigint
 check (drive_quota_bytes > 0 and drive_quota_bytes <= 9007199254740991);
