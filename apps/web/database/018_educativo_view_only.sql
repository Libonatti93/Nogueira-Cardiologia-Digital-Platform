-- Originals stay private. Rendered pages are covered by the existing database backup.
alter table educativo_post_attachments add column if not exists page_count integer not null default 0 check (page_count between 0 and 100);
create table if not exists educativo_material_pages (
  attachment_id uuid not null references educativo_post_attachments(id) on delete cascade,
  page_number integer not null check (page_number between 1 and 100),
  image_bytes bytea not null check (octet_length(image_bytes) between 1 and 3145728),
  primary key (attachment_id, page_number)
);

-- Classes/materials always belong to the professor and require registration.
update educativo_posts set author_profile_slug='dr-paulo-roberto-nogueira',requires_registration=true
where content_type in ('CLASS','EDUCATIONAL_MATERIAL');
update educativo_posts set draft_payload=draft_payload || '{"author_profile_slug":"dr-paulo-roberto-nogueira","requires_registration":true}'::jsonb
where draft_payload->>'content_type' in ('CLASS','EDUCATIONAL_MATERIAL');
