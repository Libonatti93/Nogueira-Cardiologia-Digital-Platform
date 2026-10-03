-- Additive: no existing identities, credentials, clinical data or migrations change.
insert into permissions(id,module,description) values
 ('files.access','Arquivos','Gerenciar somente seus próprios arquivos privados') on conflict do nothing;
insert into role_permissions(role_id,permission_id) values ('MASTER','files.access') on conflict do nothing;

create table drive_folders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references app_users(id) on delete restrict,
 parent_id uuid,
 name text not null check (length(name) between 1 and 180),
 favorite boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 trash_batch_id uuid,
 unique(id,owner_id),
 foreign key(parent_id,owner_id) references drive_folders(id,owner_id) deferrable initially deferred,
 check (parent_id is distinct from id),
 check ((deleted_at is null) = (trash_batch_id is null))
);
create unique index drive_folder_live_name on drive_folders(owner_id,coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),lower(name)) where deleted_at is null;
create index drive_folders_parent on drive_folders(owner_id,parent_id);
create table drive_files (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references app_users(id) on delete restrict,
 folder_id uuid,
 original_name text not null check(length(original_name) between 1 and 180),
 stored_name uuid not null unique,
 mime_type text not null,
 extension text not null,
 size bigint not null check(size>=0),
 checksum text not null check(checksum ~ '^[a-f0-9]{64}$'),
 favorite boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 trash_batch_id uuid,
 foreign key(folder_id,owner_id) references drive_folders(id,owner_id) deferrable initially deferred,
 check ((deleted_at is null) = (trash_batch_id is null))
);
create index drive_files_folder on drive_files(owner_id,folder_id);
create index drive_files_recent on drive_files(owner_id,updated_at desc) where deleted_at is null;
-- Transactional deletion queue: an interrupted unlink is safely retried.
create table drive_file_cleanup (
 stored_name uuid primary key,
 owner_id uuid not null references app_users(id) on delete restrict,
 created_at timestamptz not null default now()
);
