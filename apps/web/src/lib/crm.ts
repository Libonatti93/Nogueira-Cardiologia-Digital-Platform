import { query, transaction } from '@/lib/db';
import { audit } from '@/lib/audit';
import { hasPermission } from '@/lib/access-policy';
import type { SessionUser } from '@/lib/auth';

export class CrmError extends Error { constructor(message:string,public status=400){super(message);} }
export const crmReadPermissions:Record<string,string>={summary:'crm.access',leads:'crm.leads.read',history:'crm.leads.read',patients:'crm.patients.read',appointments:'crm.appointments.read',agenda:'crm.appointments.read'};
export const crmWritePermissions:Record<string,string>={lead:'crm.leads.manage',appointment:'crm.appointments.manage',event:'crm.appointments.manage'};
export const leadStages=['new','contact_started','interested','registered','confirmed','reschedule','lost'];
export const appointmentStatuses=['requested','confirmed','cancelled','rescheduled','attended','no_show'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function text(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function date(value:unknown){if(!value)return null;if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw new CrmError('Data inválida.');return new Date(value).toISOString();}
function requireAccess(user:SessionUser,permission:string){if(user.mustChangePassword||!hasPermission(user,'panel.access')||!hasPermission(user,'crm.access')||!hasPermission(user,permission))throw new CrmError('Acesso não autorizado.',403);}

export async function crmOverview(user:SessionUser,view:string,search='',offset=0) {
  const permission=crmReadPermissions[view];if(!permission)throw new CrmError('Área inválida.');requireAccess(user,permission);
  const q=`%${search.slice(0,100)}%`;
  if(view==='summary') {
    const counts:Record<string,number>={};
    if(hasPermission(user,'crm.leads.read')) {const r=(await query("select count(*)::int total,count(*) filter(where stage='new')::int fresh from leads")).rows[0];counts.leads=r.total;counts.new_leads=r.fresh;}
    if(hasPermission(user,'crm.patients.read'))counts.patients=(await query('select count(*)::int total from patient_profiles')).rows[0].total;
    if(hasPermission(user,'crm.appointments.read')){const r=(await query("select count(*) filter(where scheduled_for>=current_date and scheduled_for<current_date+interval '1 day' and status<>'cancelled')::int today,count(*) filter(where status='requested')::int pending from appointments")).rows[0];counts.today=r.today;counts.pending=r.pending;}
    return {counts};
  }
  if(view==='leads')return {items:(await query(`select id,full_name,email,phone_whatsapp,source,stage,created_at,last_contact_at,next_follow_up_at from leads
    where full_name ilike $1 or email::text ilike $1 or phone_whatsapp ilike $1 order by created_at desc,id limit 100 offset $2`,[q,offset])).rows};
  if(view==='patients')return {items:(await query(`select id,full_name,email,phone_whatsapp,created_at from patient_profiles
    where full_name ilike $1 or email::text ilike $1 or phone_whatsapp ilike $1 order by full_name,id limit 100 offset $2`,[q,offset])).rows};
  if(view==='history')return {items:(await query(`select e.id,e.created_at,e.event_type,e.old_stage,e.new_stage,l.full_name,u.full_name actor
    from lead_events e join leads l on l.id=e.lead_id left join app_users u on u.id=e.user_id
    where l.full_name ilike $1 order by e.created_at desc,e.id limit 100 offset $2`,[q,offset])).rows};
  // Operational projections deliberately omit payments, health intakes, clinical notes and exam files.
  const items=(await query(`select a.id,a.patient_id,a.doctor_id,p.full_name patient_name,p.phone_whatsapp,
    d.full_name doctor_name,a.scheduled_for,a.status,a.modality from appointments a
    join patient_profiles p on p.id=a.patient_id left join doctors d on d.id=a.doctor_id
    where (p.full_name ilike $1 or d.full_name ilike $1) order by (a.scheduled_for>=current_date) desc nulls last,case when a.scheduled_for>=current_date then a.scheduled_for end asc,a.scheduled_for desc nulls last,a.id limit 100 offset $2`,[q,offset])).rows;
  if(view==='agenda')return {items,events:(await query(`select id,title,starts_at,ends_at,location from internal_calendar_events
    where crm_visible and starts_at>=current_date-interval '7 days' order by starts_at limit 100`)).rows};
  return {items,doctors:(await query('select id,full_name from doctors where is_active order by full_name')).rows};
}

export async function changeCrm(user:SessionUser,body:Record<string,unknown>,request:Request) {
  const operation=String(body.operation);const permission=crmWritePermissions[operation];if(!permission)throw new CrmError('Operação inválida.');requireAccess(user,permission);
  return transaction(async client=>{
    await client.query("select pg_advisory_xact_lock(hashtextextended('nogueira-governance',0))");
    const active=await client.query(`select 1 from app_users u join user_roles ur on ur.user_id=u.id join role_permissions rp on rp.role_id=ur.role_id
      where u.id=$1 and u.is_active and not u.must_change_password and u.session_version=$2 and rp.permission_id=$3`,[user.id,user.sessionVersion,permission]);
    if(!active.rowCount)throw new CrmError('Acesso revogado.',403);
    const id=text(body.id,36);if(id&&!uuid.test(id))throw new CrmError('Identificador inválido.');
    if(operation==='lead') {
      const name=text(body.fullName,160),email=text(body.email,254).toLowerCase(),phone=text(body.phone,40),stage=text(body.stage,30)||'new';
      if(name.length<2||![...leadStages,'paid','awaiting_payment'].includes(stage)||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new CrmError('Nome, e-mail ou etapa inválidos.');
      const followUp=date(body.nextFollowUp);
      const before=id?(await client.query('select id,stage,next_follow_up_at from leads where id=$1 for update',[id])).rows[0]:null;
      if(id&&!before)throw new CrmError('Lead não encontrado.',404);
      if(!leadStages.includes(stage)&&stage!==before?.stage)throw new CrmError('O CRM não altera o estado financeiro do lead.',403);
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
      if(!uuid.test(patientId)||(doctorId&&!uuid.test(doctorId))||![...appointmentStatuses,'paid','awaiting_payment'].includes(status))throw new CrmError('Paciente, médico ou status inválido.');
      const patient=await client.query('select 1 from patient_profiles where id=$1',[patientId]);if(!patient.rowCount)throw new CrmError('Paciente não encontrado.',404);
      if(doctorId&&!(await client.query('select 1 from doctors where id=$1 and is_active',[doctorId])).rowCount)throw new CrmError('Médico inválido.');
      if(['confirmed','rescheduled'].includes(status)&&!scheduled)throw new CrmError('Informe a data do atendimento.');
      if(doctorId&&scheduled&&status!=='cancelled') {
        await client.query("select pg_advisory_xact_lock(hashtextextended($1,0))",[`crm-doctor:${doctorId}`]);
        if((await client.query("select 1 from appointments where doctor_id=$1 and scheduled_for=$2 and status not in ('cancelled','no_show') and ($3::uuid is null or id<>$3)",[doctorId,scheduled,id||null])).rowCount)throw new CrmError('Este horário já está ocupado para o médico.',409);
      }
      const before=id?(await client.query('select id,status,scheduled_for,patient_id from appointments where id=$1 for update',[id])).rows[0]:null;
      if(id&&!before)throw new CrmError('Consulta não encontrada.',404);
      if(!appointmentStatuses.includes(status)&&status!==before?.status)throw new CrmError('O CRM não altera o estado financeiro da consulta.',403);
      if(before&&before.patient_id!==patientId)throw new CrmError('Não é permitido transferir a consulta para outro paciente.');
      const result=id?await client.query(`update appointments set doctor_id=$2,scheduled_for=$3,status=$4::appointment_status,
        confirmed_at=case when $4::appointment_status='confirmed' then now() else confirmed_at end,cancelled_at=case when $4::appointment_status='cancelled' then now() else null end,updated_at=now() where id=$1 returning id`,[id,doctorId,scheduled,status]):
        await client.query('insert into appointments(patient_id,doctor_id,scheduled_for,status) values($1,$2,$3,$4) returning id',[patientId,doctorId,scheduled,status]);
      const key=result.rows[0].id;
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
