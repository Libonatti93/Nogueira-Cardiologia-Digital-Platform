-- Follow-up integrity rules, preserving the checksum of migration 014 already tested.
CREATE OR REPLACE FUNCTION crm_lead_prepare() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE matches integer; person uuid; BEGIN
 IF NEW.patient_id IS NULL THEN
  SELECT count(*),(array_agg(id))[1] INTO matches,person FROM patient_profiles p WHERE
   nullif(regexp_replace(coalesce(NEW.phone_whatsapp,''),'[^0-9]','','g'),'') IS NOT NULL
   AND regexp_replace(coalesce(p.phone_whatsapp,''),'[^0-9]','','g')=regexp_replace(NEW.phone_whatsapp,'[^0-9]','','g')
   AND (lower(p.full_name)=lower(NEW.full_name) OR (NEW.email IS NOT NULL AND p.email=NEW.email));
  IF matches=1 THEN NEW.patient_id=person;
  ELSE INSERT INTO patient_profiles(full_name,email,phone_whatsapp,contact_source,assigned_user_id)
   VALUES(NEW.full_name,NEW.email,NEW.phone_whatsapp,NEW.source,coalesce(NEW.assigned_user_id,crm_actor(),crm_default_owner())) RETURNING id INTO NEW.patient_id; END IF;
 END IF;
 NEW.assigned_user_id=coalesce(NEW.assigned_user_id,crm_actor(),crm_default_owner());
 IF NEW.pipeline_stage IS NULL THEN NEW.pipeline_stage=CASE WHEN NEW.stage='contact_started' THEN 'connection'
  WHEN NEW.stage='interested' THEN 'conditions' WHEN NEW.stage IN ('confirmed','paid','awaiting_payment') THEN 'waiting'
  WHEN NEW.stage IN ('registered','reschedule') THEN 'scheduling' ELSE 'entry' END; END IF;
 IF NEW.stage='lost' AND (TG_OP='INSERT' OR NEW.stage IS DISTINCT FROM OLD.stage) THEN NEW.operational_status='lost'; END IF;
 IF EXISTS(SELECT 1 FROM patient_profiles WHERE id=NEW.patient_id AND relationship_status='deceased') THEN NEW.operational_status='deceased'; END IF;
 IF TG_OP='UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN NEW.pipeline_entered_at=now(); END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION crm_event_person() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.patient_id IS NULL AND NEW.lead_id IS NOT NULL THEN SELECT patient_id INTO NEW.patient_id FROM leads WHERE id=NEW.lead_id; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_event_person ON lead_events;
CREATE TRIGGER crm_event_person BEFORE INSERT ON lead_events FOR EACH ROW EXECUTE FUNCTION crm_event_person();
CREATE OR REPLACE FUNCTION crm_lead_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.operational_status<>'active' THEN
  UPDATE crm_tasks SET status='cancelled',cancellation_reason=NEW.operational_status WHERE lead_id=NEW.id AND status='pending';
 ELSE PERFORM crm_ensure_action(NEW.id); END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_lead_lifecycle ON leads;
CREATE TRIGGER crm_lead_lifecycle AFTER UPDATE OF operational_status ON leads FOR EACH ROW EXECUTE FUNCTION crm_lead_lifecycle();
CREATE OR REPLACE FUNCTION crm_calendar_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.blocks_time AND NEW.doctor_id IS NOT NULL THEN
  IF NEW.ends_at IS NULL OR NEW.ends_at<=NEW.starts_at THEN RAISE EXCEPTION 'Bloqueio exige início e fim válidos.' USING ERRCODE='23514'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-doctor:'||NEW.doctor_id::text,0));
  IF EXISTS(SELECT 1 FROM appointments a WHERE a.doctor_id=NEW.doctor_id AND a.care_status NOT IN ('cancelled','no_show')
   AND a.scheduled_for<NEW.ends_at AND a.scheduled_for+make_interval(mins=>a.duration_minutes)>NEW.starts_at)
   OR EXISTS(SELECT 1 FROM internal_calendar_events e WHERE e.id<>NEW.id AND e.blocks_time AND e.doctor_id=NEW.doctor_id
    AND e.starts_at<NEW.ends_at AND e.ends_at>NEW.starts_at) THEN
   RAISE EXCEPTION 'Horário ocupado para o profissional.' USING ERRCODE='23P01'; END IF;
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_calendar_guard ON internal_calendar_events;
CREATE TRIGGER crm_calendar_guard BEFORE INSERT OR UPDATE ON internal_calendar_events FOR EACH ROW EXECUTE FUNCTION crm_calendar_guard();
CREATE OR REPLACE FUNCTION crm_payment_history() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE l uuid; BEGIN
 SELECT lead_id INTO l FROM appointments WHERE id=NEW.appointment_id;
 INSERT INTO lead_events(patient_id,lead_id,event_type,metadata) VALUES(NEW.patient_id,l,'payment.updated',jsonb_build_object('payment_id',NEW.id,'status',NEW.status));
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_payment_history ON payments;
CREATE TRIGGER crm_payment_history AFTER INSERT OR UPDATE OF status ON payments FOR EACH ROW EXECUTE FUNCTION crm_payment_history();
