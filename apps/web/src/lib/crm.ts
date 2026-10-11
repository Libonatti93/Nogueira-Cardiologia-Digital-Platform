import { query, transaction } from '@/lib/db';
import { audit } from '@/lib/audit';
import { hasPermission } from '@/lib/access-policy';
import type { SessionUser } from '@/lib/auth';
import type { PoolClient } from 'pg';
import { patientRegistration, PatientValidationError } from '@/lib/crm-patient';

export class CrmError extends Error { constructor(message:string,public status=400){super(message);} }
export const crmReadPermissions:Record<string,string>={summary:'crm.access',leads:'crm.leads.read',history:'crm.leads.read',patients:'crm.patients.read',patient:'crm.patients.read',appointments:'crm.appointments.read',agenda:'crm.appointments.read'};
export const crmWritePermissions:Record<string,string>={lead:'crm.leads.manage',lead_stage:'crm.leads.manage',patient_lead:'crm.leads.manage',link_patient:'crm.leads.manage',patient:'crm.patients.manage',appointment:'crm.appointments.manage',event:'crm.appointments.manage'};
export const leadStages=['new','contact_started','interested','registered','confirmed','reschedule','lost'];
export const appointmentStatuses=['requested','confirmed','cancelled','rescheduled','attended','no_show'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function text(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function date(value:unknown){if(!value)return null;if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw new CrmError('Data inválida.');return new Date(value).toISOString();}
function requireAccess(user:SessionUser,permission:string){if(user.mustChangePassword||!hasPermission(user,'panel.access')||!hasPermission(user,'crm.access')||!hasPermission(user,permission))throw new CrmError('Acesso não autorizado.',403);}

export async function crmOverview(user:SessionUser,view:string,search='',offset=0,patientId='') {
  const permission=crmReadPermissions[view];if(!permission)throw new CrmError('Área inválida.');requireAccess(user,permission);
  const q=`%${search.slice(0,100)}%`;
  if(view==='summary') {
    const counts:Record<string,number>={};
    if(hasPermission(user,'crm.leads.read')) {const r=(await query("select count(*)::int total,count(*) filter(where stage='new')::int fresh from leads")).rows[0];counts.leads=r.total;counts.new_leads=r.fresh;}
    if(hasPermission(user,'crm.patients.read'))counts.patients=(await query('select count(*)::int total from patient_profiles')).rows[0].total;
    if(hasPermission(user,'crm.appointments.read')){const r=(await query("select count(*) filter(where scheduled_for>=current_date and scheduled_for<current_date+interval '1 day' and status<>'cancelled')::int today,count(*) filter(where status='requested')::int pending from appointments")).rows[0];counts.today=r.today;counts.pending=r.pending;}
    return {counts};
  }
  if(view==='leads') {
    const [items,totals]=await Promise.all([
      query(`select l.id,l.full_name,l.email,l.phone_whatsapp,l.source,l.stage,l.patient_id,l.created_at,l.last_contact_at,l.next_follow_up_at,
        a.id appointment_id,a.scheduled_for,a.status appointment_status,a.doctor_id,a.modality from leads l
        left join lateral (select id,scheduled_for,status,doctor_id,modality from appointments where lead_id=l.id and status<>'cancelled' order by created_at desc,id limit 1) a on true
        where l.full_name ilike $1 or l.email::text ilike $1 or l.phone_whatsapp ilike $1 order by l.created_at desc,l.id limit 100 offset $2`,[q,offset]),
      query(`select stage,count(*)::int total from leads where full_name ilike $1 or email::text ilike $1 or phone_whatsapp ilike $1 group by stage`,[q]),
    ]);
    return {items:items.rows,total:totals.rows.reduce((sum,row)=>sum+row.total,0),stageCounts:Object.fromEntries(totals.rows.map(row=>[row.stage,row.total]))};
  }
  if(view==='patient') {
    if(!uuid.test(patientId))throw new CrmError('Paciente inválido.');
    const patient=(await query(`select id,full_name,email,phone_whatsapp,to_char(birth_date,'YYYY-MM-DD') birth_date,
      sex,postal_code,address_street,address_number,address_complement,address_neighborhood,address_city,address_state,medications
      from patient_profiles where id=$1`,[patientId])).rows[0];
    if(!patient)throw new CrmError('Paciente não encontrado.',404);
    return {patient};
  }
  if(view==='patients')return {items:(await query(`select id,full_name,email,phone_whatsapp,to_char(birth_date,'YYYY-MM-DD') birth_date,sex,created_at from patient_profiles
    where full_name ilike $1 or email::text ilike $1 or phone_whatsapp ilike $1 order by full_name,id limit 100 offset $2`,[q,offset])).rows};
  if(view==='history')return {items:(await query(`select e.id,e.created_at,e.event_type,e.old_stage,e.new_stage,l.full_name,u.full_name actor
    from lead_events e join leads l on l.id=e.lead_id left join app_users u on u.id=e.user_id
    where l.full_name ilike $1 order by e.created_at desc,e.id limit 100 offset $2`,[q,offset])).rows};
  // Operational projections deliberately omit payments, health intakes, clinical notes and exam files.
  const items=(await query(`select a.id,a.patient_id,a.doctor_id,a.lead_id,p.full_name patient_name,p.phone_whatsapp,
    d.full_name doctor_name,a.scheduled_for,a.status,a.modality from appointments a
    join patient_profiles p on p.id=a.patient_id left join doctors d on d.id=a.doctor_id
    where (p.full_name ilike $1 or d.full_name ilike $1) order by (a.scheduled_for>=current_date) desc nulls last,case when a.scheduled_for>=current_date then a.scheduled_for end asc,a.scheduled_for desc nulls last,a.id limit 100 offset $2`,[q,offset])).rows;
  if(view==='agenda')return {items,events:(await query(`select id,title,starts_at,ends_at,location from internal_calendar_events
    where crm_visible and starts_at>=current_date-interval '7 days' order by starts_at limit 100`)).rows};
  return {items,doctors:(await query('select id,full_name from doctors where is_active order by full_name')).rows};
}

async function opportunityForPatient(client:PoolClient,patientId:string,user:SessionUser,request:Request) {
  const existing=(await client.query("select id from leads where patient_id=$1 and stage not in ('lost','confirmed','paid') order by created_at desc limit 1 for update",[patientId])).rows[0];
  if(existing)return existing.id as string;
  const lead=(await client.query(`insert into leads(full_name,email,phone_whatsapp,patient_id,source,stage)
    select full_name,email,phone_whatsapp,id,'crm','registered' from patient_profiles where id=$1 returning id`,[patientId])).rows[0];
  if(!lead)throw new CrmError('Paciente não encontrado.',404);
  await client.query("insert into lead_events(lead_id,user_id,event_type,new_stage) values($1,$2,'crm.patient.link','registered')",[lead.id,user.id]);
  await audit({actor:user.id,action:'crm.lead.create',entity:'leads',id:lead.id,after:{stage:'registered',patient_id:patientId}},request,client);
  return lead.id as string;
}

export async function changeCrm(user:SessionUser,body:Record<string,unknown>,request:Request) {
  const operation=String(body.operation);const permission=crmWritePermissions[operation];if(!permission)throw new CrmError('Operação inválida.');requireAccess(user,permission);
  const required=new Set(['panel.access','crm.access',permission]);
  if(['patient','patient_lead','link_patient','appointment'].includes(operation))required.add('crm.patients.read');
  if(operation==='patient'&&(body.addToCrm===true||body.leadId))required.add('crm.leads.manage');
  if(operation==='appointment'&&body.leadId)required.add('crm.leads.manage');
  for(const access of required)requireAccess(user,access);
  return transaction(async client=>{
    await client.query("select pg_advisory_xact_lock(hashtextextended('nogueira-governance',0))");
    const active=await client.query(`select distinct rp.permission_id from app_users u join user_roles ur on ur.user_id=u.id join role_permissions rp on rp.role_id=ur.role_id
      where u.id=$1 and u.is_active and not u.must_change_password and u.session_version=$2 and rp.permission_id=any($3::text[])`,[user.id,user.sessionVersion,[...required]]);
    if(active.rowCount!==required.size)throw new CrmError('Acesso revogado.',403);
    const id=text(body.id,36);if(id&&!uuid.test(id))throw new CrmError('Identificador inválido.');
    if(operation==='patient') {
      let patient;
      try {patient=patientRegistration(body);} catch(error){if(error instanceof PatientValidationError)throw new CrmError(error.message);throw error;}
      const p=patient;
      if(id&&!(await client.query('select id from patient_profiles where id=$1 for update',[id])).rowCount)throw new CrmError('Paciente não encontrado.',404);
      const duplicate=await client.query(`select id from patient_profiles where lower(full_name)=lower($1) and birth_date=$2
        and regexp_replace(phone_whatsapp,'[^0-9]','','g')=$3 and ($4::uuid is null or id<>$4)`,[p.fullName,p.birthDate,p.phone,id||null]);
      if(duplicate.rowCount)throw new CrmError('Este paciente já está cadastrado. Localize o cadastro para editar ou adicionar ao CRM.',409);
      const values=[p.fullName,p.email,p.phone,p.birthDate,p.sex,p.postalCode,p.street,p.number,p.complement||null,p.neighborhood,p.city,p.state,p.medications];
      const result=id?await client.query(`update patient_profiles set full_name=$1,email=$2,phone_whatsapp=$3,birth_date=$4,sex=$5,
        postal_code=$6,address_street=$7,address_number=$8,address_complement=$9,address_neighborhood=$10,address_city=$11,address_state=$12,medications=$13,
        updated_at=now() where id=$14 returning id`,[...values,id]):
        await client.query(`insert into patient_profiles(full_name,email,phone_whatsapp,birth_date,sex,postal_code,address_street,address_number,
          address_complement,address_neighborhood,address_city,address_state,medications) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,values);
      const patientId=result.rows[0].id;
      if(id)await client.query('update leads set full_name=$2,email=$3,phone_whatsapp=$4,updated_at=now() where patient_id=$1',[id,p.fullName,p.email,p.phone]);
      let leadId:string|undefined;
      if(body.leadId) {
        if(typeof body.leadId!=='string'||!uuid.test(body.leadId))throw new CrmError('Oportunidade inválida.');
        const lead=(await client.query('select id,patient_id,stage from leads where id=$1 for update',[body.leadId])).rows[0];
        if(!lead)throw new CrmError('Oportunidade não encontrada.',404);
        if(lead.patient_id&&lead.patient_id!==patientId)throw new CrmError('Esta oportunidade já está vinculada a outro paciente.',409);
        const stage=['paid','awaiting_payment','confirmed','lost'].includes(lead.stage)?lead.stage:'registered';
        await client.query('update leads set patient_id=$2,full_name=$3,email=$4,phone_whatsapp=$5,stage=$6,updated_at=now() where id=$1',[lead.id,patientId,p.fullName,p.email,p.phone,stage]);
        await client.query("insert into lead_events(lead_id,user_id,event_type,old_stage,new_stage) values($1,$2,'crm.patient.link',$3,$4)",[lead.id,user.id,lead.stage,stage]);
        leadId=lead.id;
      } else if(body.addToCrm===true)leadId=await opportunityForPatient(client,patientId,user,request);
      // Record only identifiers and changed field names, never address or medication contents.
      await audit({actor:user.id,action:id?'crm.patient.update':'crm.patient.create',entity:'patient_profiles',id:patientId,
        after:{fields:Object.keys(p),...(leadId?{lead_id:leadId}:{})}},request,client);
      return {ok:true,id:patientId,leadId};
    }
    if(operation==='patient_lead') {
      const patientId=text(body.patientId,36);
      if(!uuid.test(patientId))throw new CrmError('Paciente inválido.');
      return {ok:true,id:await opportunityForPatient(client,patientId,user,request)};
    }
    if(operation==='link_patient') {
      const patientId=text(body.patientId,36);
      if(!id||!uuid.test(patientId))throw new CrmError('Paciente ou oportunidade inválidos.');
      const patient=(await client.query('select id,full_name,email,phone_whatsapp from patient_profiles where id=$1',[patientId])).rows[0];
      const lead=(await client.query('select id,patient_id,stage from leads where id=$1 for update',[id])).rows[0];
      if(!patient||!lead)throw new CrmError('Paciente ou oportunidade não encontrados.',404);
      if(lead.patient_id&&lead.patient_id!==patientId)throw new CrmError('Esta oportunidade já está vinculada a outro paciente.',409);
      const stage=['paid','awaiting_payment','confirmed','lost'].includes(lead.stage)?lead.stage:'registered';
      await client.query('update leads set patient_id=$2,full_name=$3,email=$4,phone_whatsapp=$5,stage=$6,updated_at=now() where id=$1',[id,patientId,patient.full_name,patient.email,patient.phone_whatsapp,stage]);
      await client.query("insert into lead_events(lead_id,user_id,event_type,old_stage,new_stage) values($1,$2,'crm.patient.link',$3,$4)",[id,user.id,lead.stage,stage]);
      await audit({actor:user.id,action:'crm.lead.patient',entity:'leads',id,before:{patient_id:lead.patient_id,stage:lead.stage},after:{patient_id:patientId,stage}},request,client);
      return {ok:true,id};
    }
    if(operation==='lead_stage') {
      const stage=text(body.stage,30);
      if(!id||!leadStages.includes(stage))throw new CrmError('Etapa inválida.');
      const before=(await client.query('select id,stage from leads where id=$1 for update',[id])).rows[0];
      if(!before)throw new CrmError('Oportunidade não encontrada.',404);
      if(!leadStages.includes(before.stage))throw new CrmError('Esta etapa é controlada pelo financeiro.',403);
      if(body.expectedStage!==before.stage)throw new CrmError('A oportunidade mudou. Atualize o quadro e tente novamente.',409);
      if(stage==='confirmed'&&!(await client.query("select id from appointments where lead_id=$1 and scheduled_for is not null and status in ('confirmed','rescheduled','attended')",[id])).rowCount)throw new CrmError('Use Agendar consulta para definir a data e o horário.');
      if(stage===before.stage)return {ok:true,id};
      await client.query("update leads set stage=$2,last_contact_at=case when $2::lead_stage<>'new' then now() else last_contact_at end,updated_at=now() where id=$1",[id,stage]);
      await client.query("insert into lead_events(lead_id,user_id,event_type,old_stage,new_stage) values($1,$2,'crm.stage',$3,$4)",[id,user.id,before.stage,stage]);
      await audit({actor:user.id,action:'crm.lead.stage',entity:'leads',id,before:{stage:before.stage},after:{stage}},request,client);
      return {ok:true,id};
    }
    if(operation==='lead') {
      const name=text(body.fullName,160),email=text(body.email,254).toLowerCase(),phone=text(body.phone,40),stage=text(body.stage,30)||'new';
      if(name.length<2||![...leadStages,'paid','awaiting_payment'].includes(stage)||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new CrmError('Nome, e-mail ou etapa inválidos.');
      const followUp=date(body.nextFollowUp);
      const before=id?(await client.query('select id,stage,next_follow_up_at from leads where id=$1 for update',[id])).rows[0]:null;
      if(id&&!before)throw new CrmError('Lead não encontrado.',404);
      if(stage!==before?.stage&&(!leadStages.includes(stage)||(before&&!leadStages.includes(before.stage))))throw new CrmError('O CRM não altera o estado financeiro do lead.',403);
      if(stage==='confirmed'&&stage!==before?.stage&&(!id||!(await client.query("select id from appointments where lead_id=$1 and scheduled_for is not null and status in ('confirmed','rescheduled','attended')",[id])).rowCount))throw new CrmError('Use Agendar consulta para definir a data e o horário.');
      const result=id?await client.query(`update leads set full_name=$2,email=$3,phone_whatsapp=$4,stage=$5::lead_stage,next_follow_up_at=$6,
        last_contact_at=case when $5::lead_stage<>'new' then now() else last_contact_at end,updated_at=now() where id=$1 returning id`,[id,name,email||null,phone||null,stage,followUp]):
        await client.query(`insert into leads(full_name,email,phone_whatsapp,source,stage,next_follow_up_at) values($1,$2,$3,'crm',$4,$5) returning id`,[name,email||null,phone||null,stage,followUp]);
      const key=result.rows[0].id;
      await client.query(`insert into lead_events(lead_id,user_id,event_type,old_stage,new_stage) values($1,$2,$3,$4,$5)`,[key,user.id,id?'crm.update':'crm.create',before?.stage??null,stage]);
      await audit({actor:user.id,action:id?'crm.lead.update':'crm.lead.create',entity:'leads',id:key,before:before??undefined,after:{stage,next_follow_up_at:followUp}},request,client);
      return {ok:true,id:key};
    }
    if(operation==='appointment') {
      const patientId=text(body.patientId,36),doctorId=text(body.doctorId,36)||null,status=text(body.status,30)||'requested',scheduled=date(body.scheduledFor);
      const leadId=text(body.leadId,36)||null,modality=text(body.modality,20)||'in_person';
      if((leadId&&!uuid.test(leadId))||!['in_person','telemedicine'].includes(modality))throw new CrmError('Oportunidade ou modalidade inválida.');
      if(!uuid.test(patientId)||(doctorId&&!uuid.test(doctorId))||![...appointmentStatuses,'paid','awaiting_payment'].includes(status))throw new CrmError('Paciente, médico ou status inválido.');
      const patient=await client.query('select 1 from patient_profiles where id=$1',[patientId]);if(!patient.rowCount)throw new CrmError('Paciente não encontrado.',404);
      if(doctorId&&!(await client.query('select 1 from doctors where id=$1 and is_active',[doctorId])).rowCount)throw new CrmError('Médico inválido.');
      if(['confirmed','rescheduled'].includes(status)&&!scheduled)throw new CrmError('Informe a data do atendimento.');
      if(doctorId&&scheduled&&status!=='cancelled') {
        await client.query("select pg_advisory_xact_lock(hashtextextended($1,0))",[`crm-doctor:${doctorId}`]);
        if((await client.query("select 1 from appointments where doctor_id=$1 and scheduled_for=$2 and status not in ('cancelled','no_show') and ($3::uuid is null or id<>$3)",[doctorId,scheduled,id||null])).rowCount)throw new CrmError('Este horário já está ocupado para o médico.',409);
      }
      const before=id?(await client.query('select id,status,scheduled_for,patient_id,lead_id from appointments where id=$1 for update',[id])).rows[0]:null;
      if(id&&!before)throw new CrmError('Consulta não encontrada.',404);
      if(status!==before?.status&&(!appointmentStatuses.includes(status)||(before&&!appointmentStatuses.includes(before.status))))throw new CrmError('O CRM não altera o estado financeiro da consulta.',403);
      if(before&&before.patient_id!==patientId)throw new CrmError('Não é permitido transferir a consulta para outro paciente.');
      if(before&&leadId&&before.lead_id!==leadId)throw new CrmError('Não é permitido transferir a consulta para outra oportunidade.');
      const linkedLeadId=before?.lead_id||leadId;
      const linked=linkedLeadId?(await client.query('select id,patient_id,stage from leads where id=$1 for update',[linkedLeadId])).rows[0]:null;
      if(linkedLeadId&&(!linked||linked.patient_id!==patientId))throw new CrmError('A oportunidade não pertence a este paciente.');
      if(leadId&&!id&&(await client.query("select id from appointments where lead_id=$1 and status not in ('cancelled','attended','no_show')",[leadId])).rowCount)throw new CrmError('Esta oportunidade já possui uma consulta. Edite o agendamento existente.',409);
      const result=id?await client.query(`update appointments set doctor_id=$2,scheduled_for=$3,status=$4::appointment_status,
        modality=$5,confirmed_at=case when $4::appointment_status='confirmed' then now() else confirmed_at end,cancelled_at=case when $4::appointment_status='cancelled' then now() else null end,updated_at=now() where id=$1 returning id`,[id,doctorId,scheduled,status,modality]):
        await client.query('insert into appointments(patient_id,doctor_id,scheduled_for,status,lead_id,modality) values($1,$2,$3,$4,$5,$6) returning id',[patientId,doctorId,scheduled,status,leadId,modality]);
      const key=result.rows[0].id;
      if(linked&&!['paid','awaiting_payment'].includes(linked.stage)) {
        const stage=status==='confirmed'?'confirmed':['rescheduled','cancelled','no_show'].includes(status)?'reschedule':null;
        if(stage&&stage!==linked.stage) {
          await client.query('update leads set stage=$2,updated_at=now() where id=$1',[linked.id,stage]);
          await client.query("insert into lead_events(lead_id,user_id,event_type,old_stage,new_stage) values($1,$2,'crm.appointment',$3,$4)",[linked.id,user.id,linked.stage,stage]);
          await audit({actor:user.id,action:'crm.lead.stage',entity:'leads',id:linked.id,before:{stage:linked.stage},after:{stage,appointment_id:key}},request,client);
        }
      }
      await audit({actor:user.id,action:id?'crm.appointment.update':'crm.appointment.create',entity:'appointments',id:key,
        before:before?{status:before.status,scheduled_for:before.scheduled_for}:undefined,after:{status,scheduled_for:scheduled}},request,client);
      return {ok:true,id:key};
    }
    const title=text(body.title,160),startsAt=date(body.startsAt),location=text(body.location,160);
    if(title.length<2||!startsAt)throw new CrmError('Título e data são obrigatórios.');
    const event=await client.query(`insert into internal_calendar_events(created_by_user_id,title,starts_at,location,crm_visible)
      values($1,$2,$3,$4,true) returning id`,[user.id,title,startsAt,location||null]);
    await audit({actor:user.id,action:'crm.calendar.create',entity:'internal_calendar_events',id:event.rows[0].id,after:{starts_at:startsAt,crm_visible:true}},request,client);
    return {ok:true,id:event.rows[0].id};
  });
}
