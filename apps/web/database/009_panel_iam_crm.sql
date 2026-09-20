-- Additive evolution of existing identities and RBAC. No password is created or changed.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
ALTER TABLE internal_calendar_events ADD COLUMN IF NOT EXISTS crm_visible boolean NOT NULL DEFAULT false;

INSERT INTO permissions(id,module,description) VALUES
 ('panel.access','Painel','Entrar no painel interno com credencial local'),
 ('crm.access','CRM','Entrar no workspace operacional'),
 ('crm.leads.read','CRM','Consultar leads e histórico operacional'),
 ('crm.leads.manage','CRM','Criar leads e atualizar acompanhamento'),
 ('crm.patients.read','CRM','Consultar contatos cadastrais de pacientes'),
 ('crm.appointments.read','CRM','Consultar atendimentos e agenda operacional'),
 ('crm.appointments.manage','CRM','Organizar agendamentos e compromissos operacionais')
ON CONFLICT(id) DO NOTHING;
INSERT INTO roles(id,name,description,is_system) VALUES
 ('CRM_OPERATOR','Operador CRM','Atendimento operacional, sem administração financeira ou de acessos',true)
ON CONFLICT(id) DO NOTHING;
INSERT INTO role_permissions SELECT 'CRM_OPERATOR',id FROM permissions
 WHERE id IN ('panel.access','crm.access','crm.leads.read','crm.leads.manage',
   'crm.patients.read','crm.appointments.read','crm.appointments.manage') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT id,'panel.access' FROM roles
 WHERE id IN ('MASTER','DOCTOR','LIOS_EDITOR','AUDITOR') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT 'MASTER',id FROM permissions ON CONFLICT DO NOTHING;

-- Identity checked against the existing production account; preserve DOCTOR and clinical links.
INSERT INTO user_roles(user_id,role_id)
 SELECT id,'MASTER' FROM app_users
 WHERE id='9dfce534-033f-4f74-91ef-61478581ef48'
 AND email='dracris@nogueiracardiologia.com.br'
ON CONFLICT DO NOTHING;
INSERT INTO audit_logs(action,entity_type,entity_id,after_data,metadata)
 SELECT 'governance.master.bootstrap','app_users',id,'{"added_role":"MASTER","preserved_role":"DOCTOR"}',
 '{"migration":"009_panel_iam_crm.sql"}' FROM app_users
 WHERE id='9dfce534-033f-4f74-91ef-61478581ef48' AND email='dracris@nogueiracardiologia.com.br';
UPDATE app_users SET session_version=session_version+1 WHERE id IN (SELECT user_id FROM user_roles);
