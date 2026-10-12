-- Preserve applied migration checksums while fixing issues found in integration tests.
CREATE OR REPLACE FUNCTION crm_run_automation() RETURNS integer LANGUAGE plpgsql AS $$
DECLARE candidate record; total integer=0; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('nogueira-crm-automation',0));
 FOR candidate IN SELECT p.id FROM patient_profiles p WHERE NOT p.communication_blocked AND p.relationship_status NOT IN ('deceased','lost')
  AND p.recovery_status IN ('none','converted')
  AND greatest(p.last_relevant_contact_at,(SELECT max(a.completed_at) FROM appointments a WHERE a.patient_id=p.id AND a.care_status='attended'))
   BETWEEN now()-interval '3 years' AND now()-interval '6 months'
  AND EXISTS(SELECT 1 FROM appointments a WHERE a.patient_id=p.id AND a.care_status='attended')
  AND NOT EXISTS(SELECT 1 FROM appointments a WHERE a.patient_id=p.id AND a.scheduled_for>now() AND a.care_status IN ('requested','confirmed','rescheduled')) LOOP
   PERFORM crm_start_recovery(candidate.id); total=total+1;
 END LOOP;
 RETURN total;
END $$;

CREATE OR REPLACE FUNCTION crm_appointment_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.care_status IS NULL OR (TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.care_status IS NOT DISTINCT FROM OLD.care_status AND NEW.status NOT IN ('paid','awaiting_payment')) THEN
  NEW.care_status=CASE WHEN NEW.status='paid' THEN 'confirmed' WHEN NEW.status='awaiting_payment' THEN 'requested' ELSE NEW.status::text END;
 END IF;
 IF NEW.lead_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM leads WHERE id=NEW.lead_id AND patient_id=NEW.patient_id) THEN
  RAISE EXCEPTION 'Consulta e oportunidade pertencem a pessoas diferentes.' USING ERRCODE='23514'; END IF;
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

CREATE OR REPLACE FUNCTION crm_appointment_pop() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE l uuid; owner_id uuid; item record; BEGIN
 IF TG_OP='UPDATE' AND NEW.care_status IS NOT DISTINCT FROM OLD.care_status AND NEW.scheduled_for IS NOT DISTINCT FROM OLD.scheduled_for THEN RETURN NEW; END IF;
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
  UPDATE patient_profiles SET relationship_status='active',recovery_status=CASE WHEN recovery_status='running' THEN 'converted' ELSE recovery_status END WHERE id=NEW.patient_id AND relationship_status<>'deceased';
  UPDATE leads SET pipeline_stage='waiting',operational_status='active' WHERE id=l AND operational_status<>'deceased';
  UPDATE crm_tasks SET status='cancelled',cancellation_reason='scheduled' WHERE patient_id=NEW.patient_id AND status='pending' AND kind LIKE 'recovery_%';
 END IF;
 INSERT INTO lead_events(lead_id,patient_id,user_id,event_type,metadata) VALUES(l,NEW.patient_id,crm_actor(),
  CASE WHEN NEW.care_status='attended' THEN 'appointment.attended' WHEN NEW.care_status='cancelled' THEN 'appointment.cancelled'
   WHEN TG_OP='INSERT' THEN 'appointment.created' ELSE 'appointment.updated' END,
  jsonb_build_object('appointment_id',NEW.id,'scheduled_for',NEW.scheduled_for,'status',NEW.care_status));
 PERFORM crm_ensure_action(l); RETURN NEW;
END $$;

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
 UPDATE crm_tasks SET status='cancelled',cancellation_reason='recovery_started' WHERE patient_id=person AND status='pending' AND (kind='follow_up' OR kind LIKE 'pop_%');
 INSERT INTO crm_tasks(patient_id,lead_id,assigned_user_id,kind,description,due_at,automation_key)
  VALUES(person,l,p.assigned_user_id,'recovery_1','Recuperação 1 · Saber como está e oferecer horários',now(),person::text||':recovery:'||cycle||':1') ON CONFLICT DO NOTHING;
 INSERT INTO lead_events(patient_id,lead_id,user_id,event_type) VALUES(person,l,crm_actor(),'recovery.started');
 RETURN l;
END $$;

CREATE OR REPLACE FUNCTION crm_task_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR NEW.due_at IS DISTINCT FROM OLD.due_at OR NEW.description IS DISTINCT FROM OLD.description OR NEW.assigned_user_id IS DISTINCT FROM OLD.assigned_user_id OR NEW.priority IS DISTINCT FROM OLD.priority THEN
  INSERT INTO lead_events(lead_id,patient_id,user_id,event_type,note,metadata) VALUES(NEW.lead_id,NEW.patient_id,crm_actor(),
   CASE WHEN TG_OP='INSERT' THEN 'task.created' WHEN NEW.status='done' THEN 'task.completed' WHEN NEW.status='cancelled' THEN 'task.cancelled' WHEN NEW.due_at IS DISTINCT FROM OLD.due_at THEN 'task.rescheduled' ELSE 'task.updated' END,
   CASE WHEN NEW.status='done' THEN NEW.result ELSE NEW.description END,
   jsonb_build_object('task_id',NEW.id,'kind',NEW.kind,'due_at',NEW.due_at,'status',NEW.status,'outcome',NEW.outcome));
  INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,after_data)
   VALUES(crm_actor(),'crm.task.'||CASE WHEN TG_OP='INSERT' THEN 'create' ELSE 'update' END,'crm_tasks',NEW.id,
    jsonb_build_object('status',NEW.status,'due_at',NEW.due_at,'kind',NEW.kind));
 END IF; RETURN NEW;
END $$;
