-- Additive migration. Existing users, passwords and clinical roles are preserved.
create table if not exists roles (
  id text primary key check (id ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  name text not null,
  description text not null default '',
  is_system boolean not null default false
);
create table if not exists permissions (
  id text primary key,
  module text not null,
  description text not null
);
create table if not exists user_roles (
  user_id uuid not null references app_users(id) on delete cascade,
  role_id text not null references roles(id) on delete restrict,
  primary key (user_id, role_id)
);
create table if not exists role_permissions (
  role_id text not null references roles(id) on delete cascade,
  permission_id text not null references permissions(id) on delete restrict,
  primary key (role_id, permission_id)
);
alter table app_users add column if not exists session_version integer not null default 0;
alter table audit_logs add column if not exists result text not null default 'success';
alter table audit_logs add column if not exists before_data jsonb;
alter table audit_logs add column if not exists after_data jsonb;
alter table audit_logs add column if not exists entity_key text;
create index if not exists audit_logs_action_created_idx on audit_logs(action, created_at desc);
create index if not exists audit_logs_actor_created_idx on audit_logs(actor_user_id, created_at desc);
create table if not exists auth_rate_limits (
  key text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);
insert into permissions (id, module, description) values
 ('internal.access', 'Operação', 'Dashboard clínico e operacional completo'),
 ('content.manage', 'Conteúdo', 'Criar, revisar e publicar conteúdos educativos'),
 ('reports.export', 'Relatórios', 'Consultar e exportar relatórios'),
 ('exams.read', 'Exames', 'Consultar arquivos de exames da clínica'),
 ('governance.read', 'Governança', 'Consultar usuários, perfis e permissões'),
 ('governance.manage', 'Governança', 'Criar usuários e administrar acessos'),
 ('audit.read', 'Auditoria', 'Consultar eventos e histórico de acesso'),
 ('lios.read', 'LIOS', 'Consultar RAGs, execuções e auditorias editoriais'),
 ('lios.manage', 'LIOS', 'Administrar RAGs e iniciar execuções'),
 ('lios.publish', 'LIOS', 'Enviar artigo aprovado para revisão no blog')
on conflict (id) do nothing;
insert into roles (id, name, description, is_system) values
 ('MASTER', 'MASTER', 'Administração geral de todos os módulos', true),
 ('DOCTOR', 'Médico', 'Acesso clínico e editorial existente', true),
 ('LIOS_EDITOR', 'Editor LIOS', 'Operação editorial sem acesso a pacientes', false),
 ('AUDITOR', 'Auditor', 'Consulta de governança e auditoria', false)
on conflict (id) do nothing;
insert into role_permissions select 'MASTER', id from permissions on conflict do nothing;
insert into role_permissions select 'DOCTOR', id from permissions
 where id in ('internal.access', 'content.manage', 'reports.export', 'exams.read') on conflict do nothing;
insert into role_permissions select 'LIOS_EDITOR', id from permissions
 where id in ('lios.read', 'lios.manage', 'lios.publish') on conflict do nothing;
insert into role_permissions select 'AUDITOR', id from permissions
 where id in ('governance.read', 'audit.read') on conflict do nothing;
-- Match identities verified in the production audit; never create duplicate accounts.
insert into user_roles (user_id, role_id)
 select id, 'MASTER' from app_users
 where (id = '4d6a92f6-2a80-428e-84be-d2369de3c22f' and email = 'drpaulo@nogueiracardiologia.com.br')
    or (id = '0c2a873f-828e-46f9-b9e1-6e4997a83d12' and email = 'libonattimatheus@gmail.com')
on conflict do nothing;
insert into user_roles (user_id, role_id)
 select id, 'DOCTOR' from app_users
 where id = '9dfce534-033f-4f74-91ef-61478581ef48' and email = 'dracris@nogueiracardiologia.com.br'
on conflict do nothing;
insert into audit_logs (action, entity_type, entity_id, after_data, metadata)
 select 'governance.master.bootstrap', 'app_users', ur.user_id, '{"roles":["MASTER"]}',
 '{"migration":"007_governance.sql","authorization":"production integration request"}'::jsonb
 from user_roles ur where ur.role_id = 'MASTER'
 and not exists (select 1 from audit_logs a where a.action = 'governance.master.bootstrap' and a.entity_id = ur.user_id);

insert into user_roles(user_id,role_id) select id,case when role::text='admin' then 'MASTER' else 'DOCTOR' end from app_users where role::text in ('admin','doctor') on conflict do nothing;
