import { query, transaction } from './db';
import type { PoolClient } from 'pg';
import type { SessionUser } from './auth';
import { audit } from './audit';
import { CrmError } from './crm';
import { workflowStages, objections } from './crm-workflow';
import { brazilStates, patientSexOptions } from './crm-patient';

export const workspaceReads:Record<string,string>={workspace:'crm.leads.read',people:'crm.patients.read',person:'crm.patients.read',work:'crm.leads.read',calendar:'crm.appointments.read',metrics:'crm.metrics.read'};
export const workspaceWrites:Record<string,string>={contact:'crm.patients.manage',stage:'crm.leads.manage',task:'crm.tasks.manage',complete_task:'crm.tasks.manage',interaction:'crm.leads.manage',lifecycle:'crm.patients.manage',recovery:'crm.tasks.manage',exam_followup:'crm.patients.manage',booking:'crm.appointments.manage',calendar_block:'crm.appointments.manage'};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function str(v:unknown,max=500){return typeof v==='string'?v.trim().slice(0,max):'';}
function id(v:unknown,optional=false){const s=str(v,36);if(!s&&optional)return null;if(!uuid.test(s))throw new CrmError('Identificador inválido.');return s;}
function dt(v:unknown,optional=false){if(!v&&optional)return null;const s=str(v,40);if(!s||!Number.isFinite(Date.parse(s)))throw new CrmError('Informe uma data e horário válidos.');return new Date(s).toISOString();}
function day(v:unknown){const s=str(v,10);if(!s)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw new CrmError('Data inválida.');return s;}
async function event(c:PoolClient,user:SessionUser,personId:string,leadId:string|null,type:string,note:string|null=null,metadata:object={}){
 await c.query('insert into lead_events(patient_id,lead_id,user_id,event_type,note,metadata) values($1,$2,$3,$4,$5,$6)',[personId,leadId,user.id,type,note,JSON.stringify(metadata)]);
}
async function nextTask(c:PoolClient,body:Record<string,unknown>,personId:string,leadId:string,user:SessionUser){
 const description=str(body.nextAction,500),due=dt(body.nextAt);if(!description)throw new CrmError('Toda oportunidade ativa precisa de uma próxima ação.');
 await c.query("update crm_tasks set status='cancelled',cancellation_reason='next_action_updated' where lead_id=$1 and kind='follow_up' and status='pending'",[leadId]);
 await c.query(`insert into crm_tasks(patient_id,lead_id,assigned_user_id,created_by,description,due_at)
 values($1,$2,coalesce($3,(select assigned_user_id from leads where id=$2)),$4,$5,$6)`,[personId,leadId,id(body.assignedUserId,true),user.id,description,due]);
}
async function leadFor(c:PoolClient,personId:string){return (await c.query("select * from leads where patient_id=$1 order by (operational_status='active') desc,created_at desc limit 1 for update",[personId])).rows[0];}
const peopleColumns=`p.id,p.full_name,p.phone_whatsapp,p.email,to_char(p.birth_date,'YYYY-MM-DD') birth_date,p.address_city,p.contact_source,p.referred_by,p.insurance,p.tags,p.relationship_status,p.assigned_user_id,p.last_relevant_contact_at,p.communication_blocked,p.recovery_status,p.created_at,p.updated_at,u.full_name owner_name`;
const joins=`left join app_users u on u.id=p.assigned_user_id`;

export async function readWorkspace(user:SessionUser,view:string,params:URLSearchParams){
 if(!user.permissions?.includes('crm.access')||!user.permissions.includes(workspaceReads[view]))throw new CrmError('Acesso não autorizado.',403);
 const search=`%${str(params.get('q'),100)}%`,owner=id(params.get('owner'),true),source=str(params.get('source'),80),stage=str(params.get('stage'),30),status=str(params.get('status'),30);
 const from=dt(params.get('from'),true),to=dt(params.get('to'),true);
 const offset=Math.floor(Math.max(0,Math.min(100000,Number(params.get('offset'))||0)));
 const filter=`(p.full_name ilike $1 or p.phone_whatsapp ilike $1 or p.email::text ilike $1) and ($2::uuid is null or p.assigned_user_id=$2)
 and ($3='' or p.contact_source=$3) and ($4='' or l.pipeline_stage=$4) and ($5='' or p.relationship_status=$5)
 and ($6::timestamptz is null or p.created_at>=$6) and ($7::timestamptz is null or p.created_at<$7)`;
 const values=[search,owner,source,stage,status,from,to];
 const [owners,doctors]=await Promise.all([
 query(`select u.id,u.full_name from app_users u where u.is_active and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id where ur.user_id=u.id and rp.permission_id='crm.leads.manage') order by u.full_name`),
 query('select id,full_name from doctors where is_active order by full_name')]);
 const common={owners:owners.rows,doctors:doctors.rows};
 if(view==='person'){
  const personId=id(params.get('id'));
  const person=(await query(`select ${peopleColumns},p.cpf,p.sex,p.postal_code,p.address_street,p.address_number,p.address_complement,p.address_neighborhood,p.address_state,
   p.medications,p.contact_notes,to_char(p.deceased_at,'YYYY-MM-DD') deceased_at,p.deceased_source,p.deceased_note
   from patient_profiles p ${joins} where p.id=$1`,[personId])).rows[0];
  if(!person)throw new CrmError('Contato não encontrado.',404);
  const [leads,tasks,timeline,appointments,exams]=await Promise.all([
   query('select id,pipeline_stage,operational_status,assigned_user_id,next_action,next_follow_up_at,objection,lost_reason,pipeline_entered_at from leads where patient_id=$1 order by created_at desc',[personId]),
   query('select t.*,u.full_name owner_name from crm_tasks t left join app_users u on u.id=t.assigned_user_id where patient_id=$1 order by (status=\'pending\') desc,due_at,id',[personId]),
   query(`select e.id,e.created_at,e.event_type,e.note,jsonb_build_object('task_id',e.metadata->>'task_id','kind',e.metadata->>'kind','due_at',e.metadata->>'due_at','status',e.metadata->>'status','outcome',e.metadata->>'outcome') metadata,e.pipeline_from,e.pipeline_to,u.full_name actor from lead_events e left join app_users u on u.id=e.user_id
    where e.patient_id=$1 or e.lead_id in (select id from leads where patient_id=$1) order by e.created_at desc,e.id limit 200`,[personId]),
   query('select a.id,a.patient_id,a.lead_id,a.doctor_id,a.scheduled_for,a.care_status,a.modality,a.duration_minutes,a.operational_notes,a.completed_at,d.full_name doctor_name from appointments a left join doctors d on d.id=a.doctor_id where patient_id=$1 order by scheduled_for desc nulls last',[personId]),
   query('select id,appointment_id,requested_exams,performed_exams,to_char(exam_date,\'YYYY-MM-DD\') exam_date,to_char(recommended_return,\'YYYY-MM-DD\') recommended_return,return_guidance,return_appointment_id from crm_exam_followups where patient_id=$1 order by created_at desc',[personId]),
  ]);
  return {...common,person,leads:leads.rows,tasks:tasks.rows,timeline:timeline.rows,appointments:appointments.rows,exams:exams.rows};
 }
 if(view==='calendar'){
  const start=from||new Date(Date.now()-31*86400000).toISOString(),end=to||new Date(Date.now()+62*86400000).toISOString();
  if(Date.parse(end)-Date.parse(start)>100*86400000)throw new CrmError('Selecione um período de até 100 dias.');
  const [appointments,events]=await Promise.all([
   query(`select a.id,a.patient_id,a.lead_id,a.doctor_id,p.full_name,p.phone_whatsapp,p.relationship_status,a.scheduled_for,a.care_status,a.modality,a.duration_minutes,a.operational_notes,d.full_name doctor_name
    from appointments a join patient_profiles p on p.id=a.patient_id left join doctors d on d.id=a.doctor_id
    where a.scheduled_for>=$1 and a.scheduled_for<$2 and (p.full_name ilike $3 or p.phone_whatsapp ilike $3)
    and ($4::uuid is null or a.doctor_id=$4) order by a.scheduled_for,a.id`,[start,end,search,id(params.get('doctor'),true)]),
   query(`select id,title,starts_at,ends_at,location,doctor_id,blocks_time from internal_calendar_events where crm_visible and starts_at>=$1 and starts_at<$2 order by starts_at`,[start,end])]);
  return {...common,appointments:appointments.rows,events:events.rows};
 }
 if(view==='work'){
  const tasks=await query(`select t.id,t.patient_id,t.lead_id,t.kind,t.description,t.due_at,t.priority,t.assigned_user_id,p.full_name,p.phone_whatsapp,u.full_name owner_name,
   case when t.due_at<now() then 'overdue' when (t.due_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date then 'today' else 'upcoming' end bucket
   from crm_tasks t join patient_profiles p on p.id=t.patient_id left join leads l on l.id=t.lead_id left join app_users u on u.id=t.assigned_user_id
   where t.status='pending' and not p.communication_blocked and p.relationship_status<>'deceased'
   and (p.full_name ilike $1 or p.phone_whatsapp ilike $1) and ($2::uuid is null or t.assigned_user_id=$2)
   order by t.due_at,t.id limit 300`,[search,owner]);
  return {...common,tasks:tasks.rows};
 }
 if(view==='metrics'){
  const cohort=`with cohort as (select p.id,l.id lead_id,l.pipeline_stage,l.operational_status,p.contact_source,p.relationship_status,p.recovery_status,p.assigned_user_id from patient_profiles p left join leads l on l.patient_id=p.id where ${filter})`;
  const [summary,byStage,bySource,losses,productivity]=await Promise.all([
   query(`${cohort} select count(distinct id)::int people,count(lead_id)::int leads,
    count(distinct lead_id) filter(where exists(select 1 from appointments a where a.lead_id=cohort.lead_id and a.scheduled_for is not null and a.care_status not in ('cancelled','no_show')))::int scheduled,
    count(distinct lead_id) filter(where exists(select 1 from appointments a where a.lead_id=cohort.lead_id and a.care_status='attended'))::int attended,
    count(distinct id) filter(where relationship_status='cold')::int cold,count(distinct id) filter(where recovery_status='converted')::int reactivated,
    count(distinct id) filter(where exists(select 1 from crm_tasks t where t.patient_id=cohort.id and t.kind like 'pop_%' and t.status='pending'))::int in_pop,
    (select count(*)::int from crm_tasks t where t.status='pending' and t.due_at<now() and t.patient_id in(select id from cohort)) overdue,
    (select count(*)::int from appointments a where a.care_status='attended' and a.patient_id in(select id from cohort)) consultations from cohort`,values),
   query(`${cohort} select pipeline_stage label,count(*)::int total from cohort where lead_id is not null group by pipeline_stage`,values),
   query(`${cohort} select contact_source label,count(distinct id)::int total from cohort group by contact_source`,values),
   query(`${cohort} select coalesce(nullif(l.lost_reason,''),'Não informado') label,count(*)::int total from leads l where l.id in(select lead_id from cohort) and l.operational_status='lost' group by 1`,values),
   query(`select u.full_name label,count(*)::int total from lead_events e join app_users u on u.id=e.user_id join patient_profiles p on p.id=e.patient_id left join leads l on l.id=e.lead_id
    where e.event_type in ('call','whatsapp','reply','task.completed') and ($2::uuid is null or e.user_id=$2)
    and ($3='' or p.contact_source=$3) and ($4='' or l.pipeline_stage=$4) and ($5='' or p.relationship_status=$5)
    and ($6::timestamptz is null or e.created_at>=$6) and ($7::timestamptz is null or e.created_at<$7)
    and (p.full_name ilike $1 or p.phone_whatsapp ilike $1 or p.email::text ilike $1) group by u.full_name`,values)
  ]);
  return {...common,summary:summary.rows[0],byStage:byStage.rows,bySource:bySource.rows,losses:losses.rows,productivity:productivity.rows};
 }
 const personLead=view==='people'?`left join lateral(select * from leads where patient_id=p.id order by (operational_status='active') desc,created_at desc limit 1) l on true`:`join leads l on l.patient_id=p.id`;
 const scope=view==='workspace'&&!status?" and l.operational_status='active' and not p.communication_blocked and p.relationship_status not in ('cold','lost','deceased')":'';
 const [items,totals,counts]=await Promise.all([
  query(`select ${peopleColumns},l.id lead_id,l.pipeline_stage,l.pipeline_entered_at,l.operational_status,l.next_action,l.next_follow_up_at,l.objection,
   (select max(a.completed_at) from appointments a where a.patient_id=p.id and a.care_status='attended') last_appointment,
   (select min(a.scheduled_for) from appointments a where a.patient_id=p.id and a.scheduled_for>=now() and a.care_status in ('requested','confirmed','rescheduled')) next_appointment,
   (select max(e.created_at) from lead_events e where e.patient_id=p.id and e.event_type in ('call','whatsapp','reply','note','objection')) last_interaction
   from patient_profiles p ${personLead} ${joins} where ${filter}${scope} order by p.full_name,p.id,l.id limit 100 offset $8`,[...values,offset]),
  query(`select count(*)::int total from patient_profiles p ${personLead} where ${filter}${scope}`,values),
  query(`select l.pipeline_stage,count(*)::int total from patient_profiles p ${personLead} where ${filter}${scope} group by l.pipeline_stage`,values)]);
 return {...common,items:items.rows,total:totals.rows[0].total,stageCounts:Object.fromEntries(counts.rows.map(r=>[r.pipeline_stage,r.total]))};
}

export async function changeWorkspace(user:SessionUser,body:Record<string,unknown>,request:Request){
 const operation=str(body.operation,40),permission=workspaceWrites[operation];
 if(!permission||!user.permissions?.includes(permission))throw new CrmError('Acesso não autorizado.',403);
 return transaction(async c=>{
  await c.query("select pg_advisory_xact_lock(hashtextextended('nogueira-governance',0))");
  const permissions=['panel.access','crm.access',permission];
  if(operation==='contact'&&!body.id)permissions.push('crm.leads.manage');
  const actual=await c.query(`select distinct rp.permission_id from app_users u join user_roles ur on ur.user_id=u.id join role_permissions rp on rp.role_id=ur.role_id
   where u.id=$1 and u.is_active and not u.must_change_password and u.session_version=$2 and rp.permission_id=any($3::text[])`,[user.id,user.sessionVersion,permissions]);
  if(actual.rowCount!==new Set(permissions).size)throw new CrmError('Acesso revogado.',403);
  await c.query("select set_config('app.crm_actor',$1,true)",[user.id]);
  const assigned=id(body.assignedUserId,true);
  if(assigned&&!(await c.query(`select 1 from app_users u where id=$1 and is_active and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id where ur.user_id=u.id and rp.permission_id='crm.leads.manage')`,[assigned])).rowCount)throw new CrmError('Responsável sem acesso operacional.');
  const entityId=id(body.id,true);
  if(operation==='contact'){
   const name=str(body.fullName,160),phone=str(body.phone,40).replace(/\D/g,''),source=str(body.source,80),email=str(body.email,254).toLowerCase(),cpf=str(body.cpf,14).replace(/\D/g,'');
   if(name.length<2||phone.length<10||phone.length>15||!source)throw new CrmError('Informe nome, telefone com DDD e origem.');
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new CrmError('E-mail inválido.');
   if(cpf&&cpf.length!==11)throw new CrmError('CPF deve ter 11 dígitos.');
   const birth=day(body.birthDate);if(birth&&birth>new Date().toISOString().slice(0,10))throw new CrmError('Nascimento não pode ser futuro.');
   if(entityId&&!(await c.query('select id from patient_profiles where id=$1 for update',[entityId])).rowCount)throw new CrmError('Contato não encontrado.',404);
   const duplicate=(await c.query(`select id from patient_profiles where ($1<>'' and cpf=$1 or lower(full_name)=lower($2) and regexp_replace(coalesce(phone_whatsapp,''),'[^0-9]','','g')=$3) and ($4::uuid is null or id<>$4) limit 1`,[cpf,name,phone,entityId])).rows[0];
   if(duplicate)throw new CrmError('Esta pessoa já está cadastrada. Localize e utilize o contato existente.',409);
   const tags=str(body.tags,500).split(',').map(t=>t.trim()).filter(Boolean).slice(0,20);
   const vals=[name,phone,email||null,birth,cpf||null,str(body.city,100),source,str(body.referredBy,160),str(body.insurance,160),str(body.notes,4000),assigned||user.id,tags];
   const person=(await c.query(entityId?`update patient_profiles set full_name=$1,phone_whatsapp=$2,email=$3,birth_date=$4,cpf=$5,address_city=$6,contact_source=$7,referred_by=$8,insurance=$9,contact_notes=$10,assigned_user_id=$11,tags=$12,updated_at=now() where id=$13 returning id`:
    `insert into patient_profiles(full_name,phone_whatsapp,email,birth_date,cpf,address_city,contact_source,referred_by,insurance,contact_notes,assigned_user_id,tags) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,entityId?[...vals,entityId]:vals)).rows[0];
   const extraFields=[['sex','sex',30],['postalCode','postal_code',9],['street','address_street',160],['number','address_number',20],['complement','address_complement',120],['neighborhood','address_neighborhood',100],['state','address_state',2],['medications','medications',3000]] as const;
   const extraValues:unknown[]=[person.id],assignments:string[]=[];
   for(const [input,column,max] of extraFields){
    if(!(input in body))continue;
    let value=str(body[input],max);
    if(input==='sex'&&value&&!patientSexOptions.some(([key])=>key===value))throw new CrmError('Sexo inválido.');
    if(input==='postalCode'){value=value.replace(/\D/g,'');if(value&&value.length!==8)throw new CrmError('CEP deve ter 8 dígitos.');}
    if(input==='state'){value=value.toUpperCase();if(value&&!brazilStates.includes(value))throw new CrmError('UF inválida.');}
    extraValues.push(value||null);assignments.push(`${column}=$${extraValues.length}`);
   }
   if(assignments.length)await c.query(`update patient_profiles set ${assignments.join(',')} where id=$1`,extraValues);
   let lead=await leadFor(c,person.id);
   if(!lead){lead=(await c.query(`insert into leads(full_name,email,phone_whatsapp,source,patient_id,assigned_user_id,next_action,next_follow_up_at) values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,[name,email||null,phone,source,person.id,assigned||user.id,str(body.nextAction,500)||'Dar boas-vindas e entender a necessidade',dt(body.nextAt,true)||new Date().toISOString()])).rows[0];}
   else await c.query('update leads set full_name=$2,email=$3,phone_whatsapp=$4,source=$5,assigned_user_id=$6,updated_at=now() where patient_id=$1',[person.id,name,email||null,phone,source,assigned||user.id]);
   await c.query("update crm_tasks set assigned_user_id=$2 where patient_id=$1 and status='pending'",[person.id,assigned||user.id]);
   await event(c,user,person.id,lead.id,entityId?'contact.updated':'contact.created');
   await audit({actor:user.id,action:entityId?'crm.contact.update':'crm.contact.create',entity:'patient_profiles',id:person.id,after:{fields:['contact','source','owner','insurance','tags']}},request,c);
   return {ok:true,id:person.id,leadId:lead.id};
  }
  if(operation==='calendar_block'){
   const title=str(body.title,160),starts=dt(body.startsAt),ends=dt(body.endsAt),doctor=id(body.doctorId,true),blocks=body.blocksTime===true;
   if(title.length<2||Date.parse(ends!)<=Date.parse(starts!)||blocks&&!doctor)throw new CrmError('Informe título, período válido e profissional para bloquear horário.');
   if(doctor){await c.query("select pg_advisory_xact_lock(hashtextextended('crm-doctor:'||$1,0))",[doctor]);}
   if(blocks&&(await c.query(`select id from appointments where doctor_id=$1 and care_status not in ('cancelled','no_show') and scheduled_for<$3 and scheduled_for+make_interval(mins=>duration_minutes)>$2`,[doctor,starts,ends])).rowCount)throw new CrmError('Já existe consulta neste horário.',409);
   const record=(await c.query('insert into internal_calendar_events(created_by_user_id,title,starts_at,ends_at,location,crm_visible,doctor_id,blocks_time) values($1,$2,$3,$4,$5,true,$6,$7) returning id',[user.id,title,starts,ends,str(body.location,160),doctor,blocks])).rows[0];
   await audit({actor:user.id,action:'crm.calendar.create',entity:'internal_calendar_events',id:record.id,after:{starts_at:starts,ends_at:ends,blocks_time:blocks}},request,c);return {ok:true,id:record.id};
  }
  const personId=id(body.personId)!;
  const person=(await c.query('select * from patient_profiles where id=$1 for update',[personId])).rows[0];
  if(!person)throw new CrmError('Contato não encontrado.',404);
  let lead=body.leadId?(await c.query('select * from leads where id=$1 and patient_id=$2 for update',[id(body.leadId),personId])).rows[0]:await leadFor(c,personId);
  if(body.leadId&&!lead)throw new CrmError('Oportunidade inválida para esta pessoa.');
  const cancellingBooking=operation==='booking'&&entityId&&['cancelled','no_show'].includes(str(body.status,30));
  if((person.relationship_status==='deceased'||person.communication_blocked)&&!['lifecycle','exam_followup'].includes(operation)&&!cancellingBooking)throw new CrmError('Contato falecido ou com comunicações bloqueadas. Ação impedida.',409);
  if(operation==='lifecycle'){
   const status=str(body.status,20);if(!['lead','active','follow_up','cold','lost','deceased'].includes(status))throw new CrmError('Status inválido.');
   if(person.relationship_status==='deceased'&&status!=='deceased'&&!user.roles?.includes('MASTER'))throw new CrmError('Somente MASTER pode corrigir informação de falecimento.',403);
   const death=day(body.deceasedAt),source=str(body.deceasedSource,160),note=str(body.notes,2000);
   if(status==='deceased'&&!source)throw new CrmError('Informe a origem da informação de falecimento.');
   if(death&&death>new Date().toISOString().slice(0,10))throw new CrmError('Data de falecimento não pode ser futura.');
   await c.query('update patient_profiles set relationship_status=$2,communication_blocked=$3,deceased_at=$4,deceased_source=$5,deceased_note=$6,updated_at=now() where id=$1',[personId,status,status==='deceased',death,source||null,note||null]);
   if(lead){await c.query('update leads set operational_status=$2,lost_reason=$3,updated_at=now() where patient_id=$1',[personId,['cold','lost','deceased'].includes(status)?status:'active',status==='lost'?str(body.lostReason,500)||note:null]);
    if(!['cold','lost','deceased'].includes(status)){if(!body.nextAction)throw new CrmError('Defina a próxima ação para reativar o contato.');await nextTask(c,body,personId,lead.id,user);}}
   await event(c,user,personId,lead?.id||null,status==='deceased'?'person.deceased':`person.${status}`,note,{status,source:source||undefined});
   await audit({actor:user.id,action:`crm.person.${status}`,entity:'patient_profiles',id:personId,before:{status:person.relationship_status},after:{status,communication_blocked:status==='deceased'}},request,c);
   return {ok:true,id:personId};
  }
  if(operation==='recovery'){const r=await c.query('select crm_start_recovery($1) id',[personId]);return {ok:true,id:r.rows[0].id};}
  if(operation==='booking'){
   const doctor=id(body.doctorId)!,scheduled=dt(body.scheduledFor)!,status=str(body.status,30)||'confirmed',modality=str(body.modality,20)||'in_person',duration=Number(body.durationMinutes||60);
   if(!['requested','confirmed','rescheduled','cancelled','attended','no_show'].includes(status)||!['in_person','telemedicine'].includes(modality)||!Number.isInteger(duration)||duration<5||duration>480)throw new CrmError('Status, modalidade ou duração inválidos.');
   if(!(await c.query('select id from doctors where id=$1 and is_active',[doctor])).rowCount)throw new CrmError('Profissional inválido.');
   const before=entityId?(await c.query('select * from appointments where id=$1 and patient_id=$2 for update',[entityId,personId])).rows[0]:null;
   if(entityId&&!before)throw new CrmError('Consulta não encontrada.',404);
   if(before?.lead_id){
    if(body.leadId&&body.leadId!==before.lead_id)throw new CrmError('Esta consulta pertence a outra oportunidade.');
    lead=(await c.query('select * from leads where id=$1 and patient_id=$2 for update',[before.lead_id,personId])).rows[0];
   }
   if(!lead){lead=(await c.query('insert into leads(full_name,email,phone_whatsapp,source,patient_id,assigned_user_id) values($1,$2,$3,$4,$5,$6) returning *',[person.full_name,person.email,person.phone_whatsapp,person.contact_source,personId,assigned||user.id])).rows[0];}
   const completed=dt(body.completedAt,true);if(completed&&Date.parse(completed)>Date.now())throw new CrmError('Realização não pode ser futura.');
   const vals=[personId,doctor,lead.id,scheduled,status,modality,duration,str(body.notes,2000),completed];
   const record=(await c.query(entityId?`update appointments set doctor_id=$2,scheduled_for=$4,care_status=$5::text,
    status=case when status in ('paid','awaiting_payment') then status else $5::text::appointment_status end,
    modality=$6,duration_minutes=$7,operational_notes=$8,completed_at=coalesce($9,completed_at),updated_at=now(),cancelled_at=case when $5='cancelled' then now() else null end where patient_id=$1 and id=$10 and ($3::uuid is not null) returning id`:
    `insert into appointments(patient_id,doctor_id,lead_id,scheduled_for,care_status,status,modality,duration_minutes,operational_notes,completed_at) values($1,$2,$3,$4,$5::text,$5::text::appointment_status,$6,$7,$8,$9) returning id`,entityId?[...vals,entityId]:vals)).rows[0];
   if(status==='cancelled'||status==='no_show'){await c.query("update leads set pipeline_stage='scheduling' where id=$1",[lead.id]);await c.query("update crm_tasks set status='cancelled',cancellation_reason='appointment_cancelled' where appointment_id=$1 and status='pending'",[record.id]);}
   if(['requested','confirmed','rescheduled'].includes(status)){
    await c.query(`insert into crm_tasks(patient_id,lead_id,appointment_id,assigned_user_id,kind,description,due_at,automation_key)
     values($1,$2,$3::uuid,$4,'confirmation','Confirmar horário e modalidade da consulta',$5,$3::uuid::text||':confirmation')
     on conflict(automation_key) do update set due_at=excluded.due_at,status='pending',cancellation_reason=null`,[personId,lead.id,record.id,person.assigned_user_id,new Date(Math.max(Date.now(),Date.parse(scheduled)-86400000)).toISOString()]);}
   await audit({actor:user.id,action:entityId?'crm.appointment.update':'crm.appointment.create',entity:'appointments',id:record.id,before:before?{status:before.care_status,scheduled_for:before.scheduled_for}:undefined,after:{status,scheduled_for:scheduled}},request,c);
   return {ok:true,id:record.id};
  }
  if(!lead)throw new CrmError('Adicione esta pessoa ao CRM antes de continuar.');
  if(operation==='stage'){
   const stage=str(body.stage,30);if(!workflowStages.some(([key])=>key===stage))throw new CrmError('Etapa inválida.');
   if(body.expectedStage!==lead.pipeline_stage)throw new CrmError('Este cartão mudou. Atualize o quadro.',409);
   if(['waiting','completed','post_sale'].includes(stage)){
    const check=await c.query(`select 1 from appointments where lead_id=$1 and ${stage==='waiting'?"scheduled_for is not null and care_status in ('requested','confirmed','rescheduled')":"care_status='attended'"}`,[lead.id]);
    if(!check.rowCount)throw new CrmError(stage==='waiting'?'Agende a consulta antes de mover para Aguardando consulta.':'Marque a consulta como realizada na Agenda para iniciar o POP.');
   }
   await c.query('update leads set pipeline_stage=$2,updated_at=now() where id=$1',[lead.id,stage]);
   await c.query('insert into lead_events(patient_id,lead_id,user_id,event_type,pipeline_from,pipeline_to) values($1,$2,$3,\'stage.changed\',$4,$5)',[personId,lead.id,user.id,lead.pipeline_stage,stage]);
   await audit({actor:user.id,action:'crm.lead.stage',entity:'leads',id:lead.id,before:{pipeline_stage:lead.pipeline_stage},after:{pipeline_stage:stage}},request,c);
   await c.query('select crm_ensure_action($1)',[lead.id]);return {ok:true,id:lead.id};
  }
  if(operation==='interaction'){
   const type=str(body.type,30),note=str(body.notes,4000);if(!['call','whatsapp','reply','note','objection'].includes(type)||!note)throw new CrmError('Informe tipo e resultado da interação.');
   if(type==='objection'&&!objections.includes(str(body.objection,80)))throw new CrmError('Selecione a objeção.');
   await nextTask(c,body,personId,lead.id,user);
   if(type==='reply'||body.relevant===true)await c.query('update patient_profiles set last_relevant_contact_at=now() where id=$1',[personId]);
   await c.query('update leads set last_contact_at=now(),objection=case when $2=\'objection\' then $3 else objection end,updated_at=now() where id=$1',[lead.id,type,str(body.objection,80)]);
   await event(c,user,personId,lead.id,type,note,type==='objection'?{objection:body.objection}:{});
   await audit({actor:user.id,action:`crm.interaction.${type}`,entity:'leads',id:lead.id,after:{type}},request,c);return {ok:true,id:lead.id};
  }
  if(operation==='task'){
   const description=str(body.description,500),due=dt(body.dueAt),priority=str(body.priority,10)||'normal';if(!description||!['low','normal','high'].includes(priority))throw new CrmError('Informe tarefa e prioridade.');
   if(entityId){const r=await c.query("update crm_tasks set description=$3,due_at=$4,assigned_user_id=coalesce($5,assigned_user_id),priority=$6,updated_at=now() where id=$1 and patient_id=$2 and status='pending' returning id",[entityId,personId,description,due,assigned,priority]);if(!r.rowCount)throw new CrmError('Tarefa pendente não encontrada.',404);return {ok:true,id:entityId};}
   const r=await c.query('insert into crm_tasks(patient_id,lead_id,assigned_user_id,created_by,description,due_at,priority) values($1,$2,$3,$4,$5,$6,$7) returning id',[personId,lead.id,assigned||person.assigned_user_id,user.id,description,due,priority]);return {ok:true,id:r.rows[0].id};
  }
  if(operation==='complete_task'){
   const task=(await c.query('select * from crm_tasks where id=$1 and patient_id=$2 for update',[entityId,personId])).rows[0];if(!task)throw new CrmError('Tarefa não encontrada.',404);
   if(task.status==='done')return {ok:true,id:task.id};if(task.status!=='pending')throw new CrmError('Tarefa cancelada.',409);
   const result=str(body.result,4000),outcome=str(body.outcome,30);if(!result||!['answered','no_response','not_converted','scheduled','done'].includes(outcome))throw new CrmError('Registre resultado e desfecho.');
   await c.query("update crm_tasks set status='done',completed_at=now(),completed_by=$2,result=$3,outcome=$4,updated_at=now() where id=$1",[task.id,user.id,result,outcome]);
   if(outcome==='answered'||outcome==='scheduled')await c.query('update patient_profiles set last_relevant_contact_at=now() where id=$1',[personId]);
   if(task.kind.startsWith('pop_'))await c.query("update leads set pipeline_stage='post_sale' where id=$1 and pipeline_stage='completed'",[lead.id]);
   if(task.kind.startsWith('recovery_')){
    const n=Number(task.kind.slice(-1));
    if(outcome==='scheduled'){
     if(!(await c.query("select 1 from appointments where patient_id=$1 and scheduled_for>now() and care_status in ('confirmed','rescheduled')",[personId])).rowCount)throw new CrmError('Registre o agendamento na Agenda antes de concluir como agendado.');
     await c.query("update patient_profiles set recovery_status='converted',relationship_status='active' where id=$1",[personId]);
    }else if(n<3){await c.query(`insert into crm_tasks(patient_id,lead_id,assigned_user_id,kind,description,due_at,automation_key)
     values($1,$2,$3,$4,$5,((now() at time zone 'America/Sao_Paulo')+interval '20 days') at time zone 'America/Sao_Paulo',$6) on conflict do nothing`,
     [personId,lead.id,task.assigned_user_id,`recovery_${n+1}`,n===1?'Recuperação 2 · Contato leve, equipe à disposição':'Recuperação 3 · Encerramento elegante e Instagram',`${personId}:recovery:${person.recovery_cycle}:${n+1}`]);
    }else{await c.query("update patient_profiles set recovery_status='completed',relationship_status='cold' where id=$1",[personId]);await event(c,user,personId,lead.id,'recovery.closed','Régua encerrada após o terceiro contato.');}
   }else if(body.nextAction){await nextTask(c,body,personId,lead.id,user);}
   else if(!(await c.query("select 1 from crm_tasks where lead_id=$1 and status='pending'",[lead.id])).rowCount)throw new CrmError('Defina a próxima ação antes de concluir a última tarefa ativa.');
   return {ok:true,id:task.id};
  }
  if(operation==='exam_followup'){
   const requested=str(body.requestedExams,3000);if(!requested)throw new CrmError('Registre os exames solicitados conforme orientação médica.');
   const appointment=id(body.appointmentId,true),returnAppointment=id(body.returnAppointmentId,true);
   for(const a of [appointment,returnAppointment])if(a&&!(await c.query('select 1 from appointments where id=$1 and patient_id=$2',[a,personId])).rowCount)throw new CrmError('Consulta não pertence a esta pessoa.');
   const vals=[personId,appointment,requested,str(body.performedExams,3000),day(body.examDate),day(body.recommendedReturn),str(body.returnGuidance,2000),returnAppointment,user.id];
   const r=await c.query(entityId?'update crm_exam_followups set appointment_id=$2,requested_exams=$3,performed_exams=$4,exam_date=$5,recommended_return=$6,return_guidance=$7,return_appointment_id=$8,updated_by=$9,updated_at=now() where patient_id=$1 and id=$10 returning id':'insert into crm_exam_followups(patient_id,appointment_id,requested_exams,performed_exams,exam_date,recommended_return,return_guidance,return_appointment_id,updated_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',entityId?[...vals,entityId]:vals);
   if(!r.rowCount)throw new CrmError('Acompanhamento não encontrado.',404);
   await event(c,user,personId,lead.id,'exams.followup',null,{followup_id:r.rows[0].id});await audit({actor:user.id,action:'crm.exams.followup',entity:'crm_exam_followups',id:r.rows[0].id},request,c);return {ok:true,id:r.rows[0].id};
  }
  throw new CrmError('Operação inválida.');
 });
}
