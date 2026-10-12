import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { changeWorkspace, readWorkspace } from '../src/lib/crm-workspace';
import { loadSessionUser } from '../src/lib/auth';
import { getAppointmentPaymentAmountCents } from '../src/lib/asaas';
async function main(){
if(!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test'))throw new Error('Isolated database required');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
const marker=`op-${Date.now()}`,operator=randomUUID(),master=randomUUID();const request=new Request('https://painel.nogueiracardiologia.com.br/api/internal/crm',{method:'POST',headers:{origin:'https://painel.nogueiracardiologia.com.br'}});
const people:string[]=[];const pass=(s:string)=>console.log(`PASS: ${s}`);
try{
 await db.query("insert into app_users(id,email,full_name,role,email_verified_at) values($1,$2,'Operator fixture','secretary',now()),($3,$4,'Master fixture','doctor',now())",[operator,`${marker}@example.invalid`,master,`${marker}-master@example.invalid`]);
 await db.query("insert into user_roles(user_id,role_id) values($1,'CRM_OPERATOR'),($2,'MASTER')",[operator,master]);
 const user=(await loadSessionUser(operator))!,admin=(await loadSessionUser(master))!;
 const change=(body:Record<string,unknown>)=>changeWorkspace(user,body,request);
 const create=async(name:string)=>{const r=await change({operation:'contact',fullName:`${marker} ${name}`,phone:'11912345678',source:'WhatsApp',nextAction:'Ligar para conhecer a necessidade',nextAt:new Date(Date.now()+3600000).toISOString()});people.push(r.id);return {personId:r.id,leadId:r.leadId!};};
 const one=await create('one');
 assert.ok(one.leadId);assert.equal((await db.query('select count(*)::int n from crm_tasks where lead_id=$1 and status=\'pending\'',[one.leadId])).rows[0].n,1);
 await assert.rejects(()=>change({operation:'contact',fullName:`${marker} one`,phone:'11912345678',source:'WhatsApp'}),/já está cadastrad/);
 await assert.rejects(()=>change({operation:'contact',fullName:'No phone',source:'site'}),/nome, telefone/);
 assert.equal((await db.query('select user_id from patient_profiles where id=$1',[one.personId])).rows[0].user_id,null);
 await change({operation:'contact',id:one.personId,fullName:`${marker} one`,phone:'11912345678',source:'WhatsApp',sex:'female',postalCode:'01001-000',street:'Rua de teste',number:'1',city:'São Paulo',state:'SP',medications:'MEDICATION_FIXTURE'});
 const profile=await readWorkspace(user,'person',new URLSearchParams({id:one.personId}));
 assert.ok('person' in profile&&profile.person.postal_code==='01001000'&&profile.person.medications==='MEDICATION_FIXTURE');
 const safeList=await readWorkspace(user,'people',new URLSearchParams({q:marker}));assert.ok(!JSON.stringify(safeList).includes('MEDICATION_FIXTURE'));
 pass('quick contact, complete optional registration, duplicate guard, canonical person, first task, no portal identity');
 await change({operation:'stage',...one,stage:'connection',expectedStage:'entry'});
 await assert.rejects(()=>change({operation:'stage',...one,stage:'negotiation',expectedStage:'entry'}),/cartão mudou/);
 const board=await readWorkspace(user,'workspace',new URLSearchParams({q:marker}));assert.ok('items' in board&&board.items.some(p=>p.pipeline_stage==='connection'));
 assert.equal((await db.query("select count(*)::int n from lead_events where lead_id=$1 and event_type='stage.changed'",[one.leadId])).rows[0].n,1);
 await assert.rejects(()=>change({operation:'stage',...one,stage:'completed',expectedStage:'connection'}),/Marque a consulta/);
 pass('stage persistence, optimistic concurrency and history');
 await change({operation:'interaction',...one,type:'objection',objection:'tenho convênio',notes:'Informada consulta particular',nextAction:'Retornar sexta',nextAt:new Date(Date.now()+3*86400000).toISOString()});
 const next=(await db.query('select next_action from leads where id=$1',[one.leadId])).rows[0];assert.equal(next.next_action,'Retornar sexta');
 await assert.rejects(()=>change({operation:'interaction',...one,type:'call',notes:'Sem próxima ação'}),/data|próxima/);
 const lastTask=(await db.query("select id from crm_tasks where lead_id=$1 and status='pending'",[one.leadId])).rows[0];
 await assert.rejects(()=>change({operation:'complete_task',...one,id:lastTask.id,result:'Realizado',outcome:'done'}),/próxima ação/);
 assert.equal((await db.query('select status from crm_tasks where id=$1',[lastTask.id])).rows[0].status,'pending');
 pass('objections require next action; completing last task rolls back without next action');
 const two=await create('two'),doctor=(await db.query('select id from doctors where is_active limit 1')).rows[0].id;
 const date='2038-03-10T12:00:00-03:00';
 const booking=await change({operation:'booking',...one,doctorId:doctor,scheduledFor:date,status:'confirmed',modality:'telemedicine'});
 await assert.rejects(()=>change({operation:'booking',...two,doctorId:doctor,scheduledFor:'2038-03-10T12:30:00-03:00',status:'confirmed'}),/ocupado/);
 await assert.rejects(()=>change({operation:'calendar_block',doctorId:doctor,title:'Bloqueio',startsAt:date,endsAt:'2038-03-10T14:00:00-03:00',blocksTime:true}),/consulta/);
 await change({operation:'booking',...one,id:booking.id,doctorId:doctor,scheduledFor:date,status:'cancelled'});
 const free=await change({operation:'booking',...two,doctorId:doctor,scheduledFor:date,status:'confirmed'});
 await change({operation:'booking',...two,id:free.id,doctorId:doctor,scheduledFor:date,status:'cancelled'});
 const completed=new Date(Date.now()-86400000).toISOString();
 await change({operation:'booking',...one,id:booking.id,doctorId:doctor,scheduledFor:date,status:'attended',completedAt:completed});
 const pops=(await db.query("select kind,due_at from crm_tasks where appointment_id=$1 and kind like 'pop_%' order by kind",[booking.id])).rows;
 assert.equal(pops.length,3);for(const row of pops){const days=Number(row.kind.slice(5));assert.equal((new Date(row.due_at).getTime()-Date.parse(completed))/86400000,days);}
 await change({operation:'booking',...one,id:booking.id,doctorId:doctor,scheduledFor:date,status:'attended'});
 assert.equal((await db.query("select count(*)::int n from crm_tasks where appointment_id=$1 and kind like 'pop_%'",[booking.id])).rows[0].n,3);
 pass('overlap conflict, cancellation releases slot, same calendar source and idempotent D+3 D+6 D+180');
 const exam=await change({operation:'exam_followup',...one,appointmentId:booking.id,requestedExams:'Exame informado pelo médico',performedExams:'',returnGuidance:'Aguardar orientação médica'});
 assert.equal((await db.query('select recommended_return from crm_exam_followups where id=$1',[exam.id])).rows[0].recommended_return,null);
 await change({operation:'exam_followup',...one,id:exam.id,appointmentId:booking.id,requestedExams:'Exame informado pelo médico',performedExams:'Realizado',examDate:'2026-10-01',recommendedReturn:'2026-11-01'});
 pass('exam follow-up, no invented return interval');
 await assert.rejects(()=>readWorkspace(user,'metrics',new URLSearchParams()),/autorizado/);
 const management=await readWorkspace(admin,'metrics',new URLSearchParams({q:marker}));assert.ok('summary' in management&&management.summary.attended>=1);
 pass('operator denied metrics; master reads same people and completed consultation');
 const payment=(await db.query("insert into payments(patient_id,appointment_id,amount_cents,status) values($1,$2,45000,'paid') returning id",[one.personId,booking.id])).rows[0];
 await db.query("update appointments set status='paid' where id=$1",[booking.id]);
 assert.equal((await db.query('select care_status from appointments where id=$1',[booking.id])).rows[0].care_status,'attended');
 assert.equal((await db.query("select count(*)::int n from crm_tasks where appointment_id=$1 and kind like 'pop_%' and status='pending'",[booking.id])).rows[0].n,3);
 await change({operation:'booking',...one,id:booking.id,doctorId:doctor,scheduledFor:date,status:'attended'});
 assert.equal((await db.query('select amount_cents from payments where id=$1',[payment.id])).rows[0].amount_cents,45000);
 assert.equal(getAppointmentPaymentAmountCents(),70000);
 pass('historical payment amount preserved; new consultation default is 70000');
 const cold=await create('cold'),oldDate=new Date(Date.now()-220*86400000).toISOString();
 const coldBooking=await change({operation:'booking',...cold,doctorId:doctor,scheduledFor:oldDate,status:'attended',completedAt:oldDate});
 await change({operation:'recovery',...cold});
 await change({operation:'recovery',...cold});
 assert.equal((await db.query("select count(*)::int n from crm_tasks where patient_id=$1 and kind='recovery_1'",[cold.personId])).rows[0].n,1);
 for(let n=1;n<=3;n++){
  const task=(await db.query("select id from crm_tasks where patient_id=$1 and kind=$2 and status='pending'",[cold.personId,`recovery_${n}`])).rows[0];assert.ok(task);
  await change({operation:'complete_task',...cold,id:task.id,result:'Tentativa sem resposta',outcome:'no_response'});
  if(n<3){const due=(await db.query('select due_at from crm_tasks where patient_id=$1 and kind=$2',[cold.personId,`recovery_${n+1}`])).rows[0].due_at;assert.ok(Math.abs(new Date(due).getTime()-Date.now()-20*86400000)<10000);}
 }
 assert.equal((await db.query('select relationship_status from patient_profiles where id=$1',[cold.personId])).rows[0].relationship_status,'cold');
 await db.query('select crm_run_automation()');
 assert.equal((await db.query("select count(*)::int n from crm_tasks where patient_id=$1 and status='pending'",[cold.personId])).rows[0].n,0);
 assert.ok(coldBooking.id);pass('recovery eligibility, 20 days + 20 days, no endless re-enrollment');
 await change({operation:'lifecycle',...one,status:'deceased',deceasedSource:'Familiar',notes:'Fixture'});
 assert.equal((await db.query("select count(*)::int n from crm_tasks where patient_id=$1 and status='pending'",[one.personId])).rows[0].n,0);
 assert.ok((await db.query('select communication_blocked from patient_profiles where id=$1',[one.personId])).rows[0].communication_blocked);
 await assert.rejects(()=>change({operation:'task',...one,description:'Mensagem',dueAt:new Date().toISOString()}),/bloquead/);
 await assert.rejects(()=>change({operation:'booking',...one,doctorId:doctor,scheduledFor:'2038-03-12T12:00:00-03:00',status:'confirmed'}),/bloquead/);
 await assert.rejects(()=>change({operation:'lifecycle',...one,status:'active',nextAction:'Contato',nextAt:new Date().toISOString()}),/MASTER/);
 const beforeEvents=(await db.query('select count(*)::int n from lead_events where patient_id=$1',[one.personId])).rows[0].n;assert.ok(beforeEvents>5);
 const legacy=(await db.query("insert into leads(full_name,phone_whatsapp,source) values($1,'11912345678','site') returning patient_id,operational_status",[`${marker} one`])).rows[0];assert.equal(legacy.patient_id,one.personId);assert.equal(legacy.operational_status,'deceased');
 pass('deceased suppresses all tasks, bookings, recovery and legacy recapture; history remains');
 const missing=(await db.query(`select count(*)::int n from leads l join patient_profiles p on p.id=l.patient_id where p.id=any($1::uuid[]) and l.operational_status='active' and not p.communication_blocked and p.relationship_status not in ('cold','lost','deceased') and not exists(select 1 from crm_tasks t where t.lead_id=l.id and t.status='pending')`,[people])).rows[0].n;assert.equal(missing,0);
 pass('every active card retains a persisted next action');
 const race=await Promise.allSettled([change({operation:'booking',...two,doctorId:doctor,scheduledFor:'2038-04-01T12:00:00-03:00',status:'confirmed'}),change({operation:'booking',...cold,doctorId:doctor,scheduledFor:'2038-04-01T12:15:00-03:00',status:'confirmed'})]);
 assert.equal(race.filter(r=>r.status==='fulfilled').length,1);assert.equal(race.filter(r=>r.status==='rejected').length,1);
 pass('concurrent overlapping bookings allow only one reservation');
}finally{
 await db.query('delete from crm_exam_followups where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from crm_tasks where patient_id=any($1::uuid[])',[people]);
 // Closing leads prevents the deferred invariant from recreating tasks during fixture cleanup.
 await db.query("update leads set operational_status='lost' where patient_id=any($1::uuid[])",[people]);
 await db.query('delete from crm_tasks where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from payments where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from appointments where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from lead_events where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from leads where patient_id=any($1::uuid[])',[people]);
 await db.query('delete from patient_profiles where id=any($1::uuid[])',[people]);
 await db.query('delete from audit_logs where actor_user_id=any($1::uuid[])',[[operator,master]]);
 await db.query('delete from app_users where id=any($1::uuid[])',[[operator,master]]);
 await db.end();
}
process.exit(0);

}
main().catch(error=>{console.error(error);process.exit(1);});
