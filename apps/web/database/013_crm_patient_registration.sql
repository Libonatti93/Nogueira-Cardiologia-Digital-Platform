-- Extend existing patient records; do not create portal credentials for CRM contacts.
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('female','male','intersex','not_informed')),
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS medications text;

INSERT INTO permissions(id,module,description) VALUES
  ('crm.patients.manage','CRM','Cadastrar e atualizar pacientes e medicamentos informados no cadastro')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) VALUES
  ('CRM_OPERATOR','crm.patients.manage'), ('MASTER','crm.patients.manage')
ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS leads_patient_created_idx ON leads(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_lead_idx ON appointments(lead_id);
INSERT INTO audit_logs(action,entity_type,entity_key,after_data,metadata) VALUES
  ('governance.role.update','roles','CRM_OPERATOR','{"added_permission":"crm.patients.manage"}',
   '{"migration":"013_crm_patient_registration.sql"}');
