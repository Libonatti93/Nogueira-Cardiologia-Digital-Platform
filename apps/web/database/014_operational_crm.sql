-- Additive CRM evolution. Original enum stages, payments and history remain intact.
ALTER TABLE patient_profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE patient_profiles ALTER COLUMN phone_whatsapp DROP NOT NULL;
ALTER TABLE patient_profiles
 ADD COLUMN IF NOT EXISTS relationship_status text NOT NULL DEFAULT 'lead' CHECK (relationship_status IN ('lead','active','follow_up','cold','lost','deceased')),
 ADD COLUMN IF NOT EXISTS contact_source text NOT NULL DEFAULT 'crm',
 ADD COLUMN IF NOT EXISTS referred_by text,
 ADD COLUMN IF NOT EXISTS insurance text,
 ADD COLUMN IF NOT EXISTS contact_notes text,
 ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES app_users(id),
 ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS last_relevant_contact_at timestamptz,
 ADD COLUMN IF NOT EXISTS deceased_at date,
 ADD COLUMN IF NOT EXISTS deceased_source text,
 ADD COLUMN IF NOT EXISTS deceased_note text,
 ADD COLUMN IF NOT EXISTS communication_blocked boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS recovery_cycle integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS recovery_status text NOT NULL DEFAULT 'none' CHECK (recovery_status IN ('none','running','completed','converted'));
ALTER TABLE leads
 ADD COLUMN IF NOT EXISTS pipeline_stage text CHECK (pipeline_stage IN ('entry','connection','negotiation','follow_up','conditions','scheduling','waiting','completed','post_sale')),
 ADD COLUMN IF NOT EXISTS pipeline_entered_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS operational_status text NOT NULL DEFAULT 'active' CHECK (operational_status IN ('active','lost','cold','deceased')),
 ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES app_users(id),
 ADD COLUMN IF NOT EXISTS next_action text,
 ADD COLUMN IF NOT EXISTS objection text;
ALTER TABLE appointments
 ADD COLUMN IF NOT EXISTS care_status text CHECK (care_status IN ('requested','confirmed','rescheduled','cancelled','attended','no_show')),
 ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60 CHECK(duration_minutes BETWEEN 5 AND 480),
 ADD COLUMN IF NOT EXISTS operational_notes text,
 ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE internal_calendar_events
 ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES doctors(id),
 ADD COLUMN IF NOT EXISTS blocks_time boolean NOT NULL DEFAULT false;
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patient_profiles(id);
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS pipeline_from text;
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS pipeline_to text;
ALTER TABLE lead_events ALTER COLUMN lead_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS crm_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE RESTRICT,
 lead_id uuid REFERENCES leads(id) ON DELETE SET NULL, appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
 assigned_user_id uuid REFERENCES app_users(id), created_by uuid REFERENCES app_users(id),
 kind text NOT NULL DEFAULT 'follow_up', description text NOT NULL CHECK(length(description)>0),
 due_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done','cancelled')),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
 completed_at timestamptz, completed_by uuid REFERENCES app_users(id), result text, outcome text,
 cancellation_reason text, automation_key text UNIQUE
);
CREATE TABLE IF NOT EXISTS crm_exam_followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE RESTRICT,
 appointment_id uuid REFERENCES appointments(id), requested_exams text NOT NULL, performed_exams text,
 exam_date date, recommended_return date, return_guidance text, return_appointment_id uuid REFERENCES appointments(id),
 updated_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_tasks_due_idx ON crm_tasks(status,due_at);
CREATE INDEX IF NOT EXISTS crm_tasks_person_idx ON crm_tasks(patient_id,status,due_at);
CREATE INDEX IF NOT EXISTS crm_tasks_lead_idx ON crm_tasks(lead_id,status,due_at);
CREATE INDEX IF NOT EXISTS crm_events_person_idx ON lead_events(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS crm_leads_pipeline_idx ON leads(operational_status,pipeline_stage);
CREATE INDEX IF NOT EXISTS crm_exam_person_idx ON crm_exam_followups(patient_id);
CREATE INDEX IF NOT EXISTS crm_people_owner_idx ON patient_profiles(assigned_user_id,relationship_status);

CREATE OR REPLACE FUNCTION crm_actor() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('app.crm_actor',true),'')::uuid
$$;
CREATE OR REPLACE FUNCTION crm_default_owner() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT u.id FROM app_users u WHERE u.is_active AND EXISTS(
 SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id
 WHERE ur.user_id=u.id AND rp.permission_id='crm.leads.manage')
 ORDER BY EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_id='CRM_OPERATOR') DESC,u.created_at,u.id LIMIT 1
$$;

-- Give each previously unlinked opportunity a canonical person, retaining every lead ID.
DO $$ DECLARE l record; person uuid; BEGIN
 FOR l IN SELECT * FROM leads WHERE patient_id IS NULL ORDER BY created_at,id LOOP
  INSERT INTO patient_profiles(full_name,email,phone_whatsapp,contact_source,assigned_user_id,created_at)
   VALUES(l.full_name,l.email,l.phone_whatsapp,l.source,coalesce(l.assigned_user_id,crm_default_owner()),l.created_at) RETURNING id INTO person;
  UPDATE leads SET patient_id=person WHERE id=l.id;
 END LOOP;
END $$;
UPDATE patient_profiles SET assigned_user_id=crm_default_owner() WHERE assigned_user_id IS NULL;
UPDATE leads SET assigned_user_id=coalesce((SELECT s.user_id FROM secretaries s WHERE s.id=leads.assigned_secretary_id),crm_default_owner()) WHERE assigned_user_id IS NULL;
UPDATE leads SET pipeline_stage=CASE
 WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.lead_id=leads.id AND a.status='attended') THEN 'completed'
 WHEN stage='contact_started' THEN 'connection' WHEN stage='interested' THEN 'conditions'
 WHEN stage IN ('confirmed','paid','awaiting_payment') THEN 'waiting'
 WHEN stage IN ('registered','reschedule') THEN 'scheduling' ELSE 'entry' END,
 operational_status=CASE WHEN stage='lost' THEN 'lost' ELSE operational_status END,
 pipeline_entered_at=updated_at WHERE pipeline_stage IS NULL;
UPDATE appointments SET care_status=CASE WHEN status='paid' THEN 'confirmed' WHEN status='awaiting_payment' THEN 'requested' ELSE status::text END,
 completed_at=CASE WHEN status='attended' THEN coalesce(scheduled_for,updated_at) ELSE completed_at END WHERE care_status IS NULL;
UPDATE lead_events e SET patient_id=l.patient_id FROM leads l WHERE l.id=e.lead_id AND e.patient_id IS NULL;
UPDATE patient_profiles p SET relationship_status='active' WHERE relationship_status='lead' AND EXISTS(SELECT 1 FROM appointments a WHERE a.patient_id=p.id AND a.care_status='attended');

CREATE OR REPLACE FUNCTION crm_ensure_action(target uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE l leads; p patient_profiles; task crm_tasks;
BEGIN
 SELECT * INTO l FROM leads WHERE id=target FOR UPDATE; IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO p FROM patient_profiles WHERE id=l.patient_id;
 IF l.operational_status<>'active' OR p.communication_blocked OR p.relationship_status IN ('deceased','cold','lost') THEN
  UPDATE leads SET next_action=NULL,next_follow_up_at=NULL WHERE id=target AND (next_action IS NOT NULL OR next_follow_up_at IS NOT NULL); RETURN;
 END IF;
 SELECT * INTO task FROM crm_tasks WHERE lead_id=target AND status='pending' ORDER BY due_at,created_at,id LIMIT 1;
 IF NOT FOUND THEN
  INSERT INTO crm_tasks(patient_id,lead_id,assigned_user_id,created_by,description,due_at)
   VALUES(l.patient_id,l.id,coalesce(l.assigned_user_id,p.assigned_user_id,crm_default_owner()),crm_actor(),
    coalesce(nullif(l.next_action,''),'Definir e realizar o próximo contato'),coalesce(l.next_follow_up_at,now())) RETURNING * INTO task;
 END IF;
 UPDATE leads SET next_action=task.description,next_follow_up_at=task.due_at WHERE id=target
  AND (next_action IS DISTINCT FROM task.description OR next_follow_up_at IS DISTINCT FROM task.due_at);
END $$;

CREATE OR REPLACE FUNCTION crm_lead_prepare() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.patient_id IS NULL THEN
  INSERT INTO patient_profiles(full_name,email,phone_whatsapp,contact_source,assigned_user_id)
   VALUES(NEW.full_name,NEW.email,NEW.phone_whatsapp,NEW.source,coalesce(NEW.assigned_user_id,crm_actor(),crm_default_owner())) RETURNING id INTO NEW.patient_id;
 END IF;
 NEW.assigned_user_id=coalesce(NEW.assigned_user_id,crm_actor(),crm_default_owner());
 IF NEW.pipeline_stage IS NULL THEN NEW.pipeline_stage=CASE WHEN NEW.stage='contact_started' THEN 'connection'
  WHEN NEW.stage='interested' THEN 'conditions' WHEN NEW.stage IN ('confirmed','paid','awaiting_payment') THEN 'waiting'
  WHEN NEW.stage IN ('registered','reschedule') THEN 'scheduling' ELSE 'entry' END; END IF;
 IF NEW.stage='lost' THEN NEW.operational_status='lost'; END IF;
 IF EXISTS(SELECT 1 FROM patient_profiles WHERE id=NEW.patient_id AND relationship_status='deceased') THEN NEW.operational_status='deceased'; END IF;
 IF TG_OP='UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN NEW.pipeline_entered_at=now(); END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_lead_prepare ON leads;
CREATE TRIGGER crm_lead_prepare BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION crm_lead_prepare();
CREATE OR REPLACE FUNCTION crm_lead_action() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM crm_ensure_action(NEW.id); RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_lead_action ON leads;
CREATE TRIGGER crm_lead_action AFTER INSERT ON leads FOR EACH ROW EXECUTE FUNCTION crm_lead_action();

CREATE OR REPLACE FUNCTION crm_task_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.status='pending' AND EXISTS(SELECT 1 FROM patient_profiles WHERE id=NEW.patient_id AND (relationship_status='deceased' OR communication_blocked)) THEN
  RAISE EXCEPTION 'Comunicação bloqueada para este contato.' USING ERRCODE='23514'; END IF;
 IF NEW.lead_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM leads WHERE id=NEW.lead_id AND patient_id=NEW.patient_id) THEN
  RAISE EXCEPTION 'Tarefa e oportunidade pertencem a pessoas diferentes.' USING ERRCODE='23514'; END IF;
 NEW.assigned_user_id=coalesce(NEW.assigned_user_id,(SELECT assigned_user_id FROM patient_profiles WHERE id=NEW.patient_id),crm_default_owner());
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_task_guard ON crm_tasks;
CREATE TRIGGER crm_task_guard BEFORE INSERT OR UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION crm_task_guard();
CREATE OR REPLACE FUNCTION crm_task_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR NEW.due_at IS DISTINCT FROM OLD.due_at THEN
  INSERT INTO lead_events(lead_id,patient_id,user_id,event_type,note,metadata) VALUES(NEW.lead_id,NEW.patient_id,crm_actor(),
   CASE WHEN TG_OP='INSERT' THEN 'task.created' WHEN NEW.status='done' THEN 'task.completed' WHEN NEW.status='cancelled' THEN 'task.cancelled' ELSE 'task.rescheduled' END,
   CASE WHEN NEW.status='done' THEN NEW.result ELSE NEW.description END,
   jsonb_build_object('task_id',NEW.id,'kind',NEW.kind,'due_at',NEW.due_at,'status',NEW.status,'outcome',NEW.outcome));
  INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,after_data)
   VALUES(crm_actor(),'crm.task.'||CASE WHEN TG_OP='INSERT' THEN 'create' ELSE 'update' END,'crm_tasks',NEW.id,
    jsonb_build_object('status',NEW.status,'due_at',NEW.due_at,'kind',NEW.kind));
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_task_history ON crm_tasks;
CREATE TRIGGER crm_task_history AFTER INSERT OR UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION crm_task_history();
CREATE OR REPLACE FUNCTION crm_action_deferred() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP<>'DELETE' THEN PERFORM crm_ensure_action(NEW.lead_id); END IF;
 IF TG_OP<>'INSERT' AND (TG_OP='DELETE' OR OLD.lead_id IS DISTINCT FROM NEW.lead_id) THEN PERFORM crm_ensure_action(OLD.lead_id); END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS crm_action_deferred ON crm_tasks;
CREATE CONSTRAINT TRIGGER crm_action_deferred AFTER INSERT OR UPDATE OR DELETE ON crm_tasks
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION crm_action_deferred();

CREATE OR REPLACE FUNCTION crm_person_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.relationship_status='deceased' THEN NEW.communication_blocked=true; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_person_lifecycle ON patient_profiles;
CREATE TRIGGER crm_person_lifecycle BEFORE INSERT OR UPDATE ON patient_profiles FOR EACH ROW EXECUTE FUNCTION crm_person_lifecycle();
CREATE OR REPLACE FUNCTION crm_person_suppress() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.relationship_status IN ('deceased','cold','lost') OR NEW.communication_blocked THEN
  UPDATE leads SET operational_status=CASE WHEN NEW.relationship_status='deceased' THEN 'deceased' WHEN NEW.relationship_status='lost' THEN 'lost' ELSE 'cold' END,
   next_action=NULL,next_follow_up_at=NULL WHERE patient_id=NEW.id;
  UPDATE crm_tasks SET status='cancelled',cancellation_reason=CASE WHEN NEW.relationship_status='deceased' THEN 'deceased' ELSE 'inactive' END,updated_at=now()
   WHERE patient_id=NEW.id AND status='pending';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_person_suppress ON patient_profiles;
CREATE TRIGGER crm_person_suppress AFTER UPDATE OF relationship_status,communication_blocked ON patient_profiles FOR EACH ROW EXECUTE FUNCTION crm_person_suppress();

CREATE OR REPLACE FUNCTION crm_appointment_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.care_status IS NULL OR (TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.care_status IS NOT DISTINCT FROM OLD.care_status) THEN
  NEW.care_status=CASE WHEN NEW.status='paid' THEN 'confirmed' WHEN NEW.status='awaiting_payment' THEN 'requested' ELSE NEW.status::text END;
 END IF;
 IF NEW.care_status='attended' THEN NEW.completed_at=coalesce(NEW.completed_at,now()); END IF;
 IF TG_OP='INSERT' OR NEW.scheduled_for IS DISTINCT FROM OLD.scheduled_for OR NEW.care_status IS DISTINCT FROM OLD.care_status THEN
  IF NEW.care_status NOT IN ('cancelled','no_show') AND EXISTS(SELECT 1 FROM patient_profiles WHERE id=NEW.patient_id AND relationship_status='deceased') THEN
   RAISE EXCEPTION 'Contato falecido: agendamento bloqueado.' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.doctor_id IS NOT NULL AND NEW.scheduled_for IS NOT NULL AND NEW.care_status NOT IN ('cancelled','no_show') THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-doctor:'||NEW.doctor_id::text,0));
  IF EXISTS(SELECT 1 FROM appointments a WHERE a.id<>NEW.id AND a.doctor_id=NEW.doctor_id AND a.care_status NOT IN ('cancelled','no_show')
   AND a.scheduled_for<NEW.scheduled_for+make_interval(mins=>NEW.duration_minutes) AND a.scheduled_for+make_interval(mins=>a.duration_minutes)>NEW.scheduled_for)
   OR EXISTS(SELECT 1 FROM internal_calendar_events e WHERE e.blocks_time AND e.doctor_id=NEW.doctor_id
    AND e.starts_at<NEW.scheduled_for+make_interval(mins=>NEW.duration_minutes) AND coalesce(e.ends_at,e.starts_at+interval '1 hour')>NEW.scheduled_for) THEN
   RAISE EXCEPTION 'Este horário já está ocupado para o profissional.' USING ERRCODE='23P01'; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_appointment_guard ON appointments;
CREATE TRIGGER crm_appointment_guard BEFORE INSERT OR UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION crm_appointment_guard();

CREATE OR REPLACE FUNCTION crm_appointment_pop() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE l uuid; owner_id uuid; item record; BEGIN
 l=NEW.lead_id;
 IF l IS NULL THEN
  SELECT id INTO l FROM leads WHERE patient_id=NEW.patient_id AND operational_status='active' ORDER BY created_at DESC LIMIT 1;
  IF l IS NULL THEN INSERT INTO leads(full_name,email,phone_whatsapp,patient_id,source,pipeline_stage)
   SELECT full_name,email,phone_whatsapp,id,contact_source,'waiting' FROM patient_profiles WHERE id=NEW.patient_id RETURNING id INTO l; END IF;
  UPDATE appointments SET lead_id=l WHERE id=NEW.id;
 END IF;
 SELECT assigned_user_id INTO owner_id FROM leads WHERE id=l;
 IF NEW.care_status='attended' AND (TG_OP='INSERT' OR OLD.care_status IS DISTINCT FROM 'attended') THEN
  UPDATE patient_profiles SET relationship_status='follow_up',recovery_status=CASE WHEN recovery_status='running' THEN 'converted' ELSE recovery_status END WHERE id=NEW.patient_id AND relationship_status<>'deceased';
  UPDATE leads SET pipeline_stage='completed',operational_status='active' WHERE id=l AND operational_status<>'deceased';
  UPDATE crm_tasks SET status='cancelled',cancellation_reason='consultation_completed' WHERE lead_id=l AND status='pending' AND kind IN ('follow_up','confirmation','recovery_1','recovery_2','recovery_3');
  IF NOT EXISTS(SELECT 1 FROM patient_profiles WHERE id=NEW.patient_id AND (communication_blocked OR relationship_status='deceased')) THEN
   FOR item IN SELECT * FROM (VALUES ('pop_d3',3,'POP 1 · Saber como está, satisfação, sugestões e indicação quando apropriado'),
     ('pop_d6',6,'POP 1 · Verificar agendamento dos exames e ajudar nas dificuldades'),
     ('pop_d180',180,'Continuidade · Verificar como está e oferecer revisão conforme orientação médica')) x(kind,days,description) LOOP
    INSERT INTO crm_tasks(patient_id,lead_id,appointment_id,assigned_user_id,kind,description,due_at,automation_key)
     VALUES(NEW.patient_id,l,NEW.id,owner_id,item.kind,item.description,
      ((NEW.completed_at AT TIME ZONE 'America/Sao_Paulo')+make_interval(days=>item.days)) AT TIME ZONE 'America/Sao_Paulo',NEW.id::text||':'||item.kind)
     ON CONFLICT(automation_key) DO UPDATE SET status='pending',cancellation_reason=NULL,due_at=excluded.due_at
      WHERE crm_tasks.status='cancelled' AND crm_tasks.cancellation_reason='consultation_reopened';
   END LOOP;
  END IF;
 ELSIF TG_OP='UPDATE' AND OLD.care_status='attended' AND NEW.care_status<>'attended' THEN
  UPDATE crm_tasks SET status='cancelled',cancellation_reason='consultation_reopened' WHERE appointment_id=NEW.id AND status='pending' AND kind LIKE 'pop_%';
  UPDATE leads SET pipeline_stage=CASE WHEN NEW.care_status IN ('cancelled','no_show') THEN 'scheduling' ELSE 'waiting' END WHERE id=l;
 ELSIF NEW.care_status IN ('confirmed','rescheduled','requested') THEN
  UPDATE leads SET pipeline_stage='waiting' WHERE id=l AND operational_status='active';
  UPDATE patient_profiles SET relationship_status='active',recovery_status=CASE WHEN recovery_status='running' THEN 'converted' ELSE recovery_status END WHERE id=NEW.patient_id AND relationship_status<>'deceased';
  UPDATE crm_tasks SET status='cancelled',cancellation_reason='scheduled' WHERE patient_id=NEW.patient_id AND status='pending' AND kind LIKE 'recovery_%';
 END IF;
 INSERT INTO lead_events(lead_id,patient_id,user_id,event_type,metadata) VALUES(l,NEW.patient_id,crm_actor(),
  CASE WHEN NEW.care_status='attended' THEN 'appointment.attended' WHEN NEW.care_status='cancelled' THEN 'appointment.cancelled'
   WHEN TG_OP='INSERT' THEN 'appointment.created' ELSE 'appointment.updated' END,
  jsonb_build_object('appointment_id',NEW.id,'scheduled_for',NEW.scheduled_for,'status',NEW.care_status));
 PERFORM crm_ensure_action(l); RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_appointment_pop ON appointments;
CREATE TRIGGER crm_appointment_pop AFTER INSERT OR UPDATE OF care_status,status,scheduled_for ON appointments FOR EACH ROW EXECUTE FUNCTION crm_appointment_pop();

CREATE OR REPLACE FUNCTION crm_start_recovery(person uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE p patient_profiles; l uuid; cycle integer; BEGIN
 SELECT * INTO p FROM patient_profiles WHERE id=person FOR UPDATE;
 IF NOT FOUND OR p.communication_blocked OR p.relationship_status='deceased' THEN RAISE EXCEPTION 'Contato indisponível para recuperação.' USING ERRCODE='23514'; END IF;
 SELECT id INTO l FROM leads WHERE patient_id=person ORDER BY (operational_status='active') DESC,created_at DESC LIMIT 1;
 IF p.recovery_status IN ('running','completed') THEN RETURN l; END IF;
 IF NOT EXISTS(SELECT 1 FROM appointments WHERE patient_id=person AND care_status='attended') OR
  greatest(p.last_relevant_contact_at,(SELECT max(completed_at) FROM appointments WHERE patient_id=person AND care_status='attended')) NOT BETWEEN now()-interval '3 years' AND now()-interval '6 months' THEN
  RAISE EXCEPTION 'Recuperação exige consulta anterior e de 6 meses a 3 anos sem contato relevante.' USING ERRCODE='23514'; END IF;
 cycle=p.recovery_cycle+1;
 UPDATE patient_profiles SET relationship_status='follow_up',recovery_cycle=cycle,recovery_status='running' WHERE id=person;
 IF l IS NULL THEN INSERT INTO leads(full_name,email,phone_whatsapp,patient_id,source,pipeline_stage)
  VALUES(p.full_name,p.email,p.phone_whatsapp,person,p.contact_source,'follow_up') RETURNING id INTO l;
 ELSE UPDATE leads SET operational_status='active',pipeline_stage='follow_up' WHERE id=l; END IF;
 UPDATE crm_tasks SET status='cancelled',cancellation_reason='recovery_started' WHERE patient_id=person AND status='pending' AND kind IN ('follow_up','pop_d180');
 INSERT INTO crm_tasks(patient_id,lead_id,assigned_user_id,kind,description,due_at,automation_key)
  VALUES(person,l,p.assigned_user_id,'recovery_1','Recuperação 1 · Saber como está e oferecer horários',now(),person::text||':recovery:'||cycle||':1') ON CONFLICT DO NOTHING;
 INSERT INTO lead_events(patient_id,lead_id,user_id,event_type) VALUES(person,l,crm_actor(),'recovery.started');
 RETURN l;
END $$;
CREATE OR REPLACE FUNCTION crm_run_automation() RETURNS integer LANGUAGE plpgsql AS $$
DECLARE p record; total integer=0; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('nogueira-crm-automation',0));
 FOR p IN SELECT p.id FROM patient_profiles p WHERE NOT p.communication_blocked AND p.relationship_status NOT IN ('deceased','lost')
  AND p.recovery_status IN ('none','converted')
  AND greatest(p.last_relevant_contact_at,(SELECT max(a.completed_at) FROM appointments a WHERE a.patient_id=p.id AND a.care_status='attended'))
   BETWEEN now()-interval '3 years' AND now()-interval '6 months'
  AND EXISTS(SELECT 1 FROM appointments a WHERE a.patient_id=p.id AND a.care_status='attended')
  AND NOT EXISTS(SELECT 1 FROM appointments a WHERE a.patient_id=p.id AND a.scheduled_for>now() AND a.care_status IN ('requested','confirmed','rescheduled')) LOOP
   PERFORM crm_start_recovery(p.id); total=total+1;
 END LOOP;
 RETURN total;
END $$;

INSERT INTO permissions(id,module,description) VALUES
 ('crm.tasks.manage','CRM','Organizar e concluir tarefas operacionais'),
 ('crm.metrics.read','CRM','Ver indicadores gerenciais e produtividade') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) VALUES('CRM_OPERATOR','crm.tasks.manage') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions SELECT 'MASTER',id FROM permissions ON CONFLICT DO NOTHING;
UPDATE roles SET name='Atendimento / Secretaria' WHERE id='CRM_OPERATOR';
DO $$ DECLARE l record; BEGIN FOR l IN SELECT id FROM leads WHERE operational_status='active' LOOP PERFORM crm_ensure_action(l.id); END LOOP; END $$;
INSERT INTO audit_logs(action,entity_type,metadata) SELECT 'crm.migration','schema', '{"migration":"014_operational_crm.sql"}'::jsonb
 WHERE NOT EXISTS(SELECT 1 FROM audit_logs WHERE action='crm.migration' AND metadata->>'migration'='014_operational_crm.sql');
