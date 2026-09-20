import assert from 'node:assert/strict';
import { query } from '../src/lib/db';
import { loadSessionUser } from '../src/lib/auth';
import { changeAccess, GovernanceError } from '../src/lib/governance';

async function main() {
  if (!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test')) throw new Error('Requires isolated integration database');
  const masterId='00000000-0000-4000-8000-000000000010';
  await query(`insert into app_users(id,email,full_name,role) values($1,'master@example.invalid','Integration Master','admin') on conflict(id) do nothing`,[masterId]);
  await query("insert into user_roles values($1,'MASTER') on conflict do nothing",[masterId]);
  const master=(await loadSessionUser(masterId))!;
  const request=new Request('https://clinic.example/api/internal/governance',{method:'POST',headers:{origin:'https://clinic.example','x-forwarded-for':'127.0.0.1'}});
  const created=await changeAccess(master,{operation:'create',email:`editor-${Date.now()}@example.invalid`,fullName:'Integration Editor',password:'test-password-do-not-use',isActive:true,roles:['LIOS_EDITOR']},request);
  assert.ok('id' in created);
  const editor=(await loadSessionUser(created.id!))!;
  assert.ok(editor.permissions?.includes('lios.manage'));
  assert.ok(!editor.permissions?.includes('governance.manage'));
  await assert.rejects(changeAccess(editor,{operation:'role',id:'ESCALATED',name:'Denied',permissions:['governance.manage']},request),(error:unknown)=>error instanceof GovernanceError&&error.status===403);
  await assert.rejects(changeAccess(master,{operation:'user',id:master.id,fullName:master.fullName,isActive:false,roles:[]},request),/MASTER/);
  await changeAccess(master,{operation:'user',id:editor.id,fullName:editor.fullName,isActive:true,roles:['AUDITOR']},request);
  const updated=(await loadSessionUser(editor.id))!;
  assert.equal(updated.sessionVersion,editor.sessionVersion!+1);
  assert.ok(!updated.permissions?.includes('lios.manage'));
  await changeAccess(master,{operation:'role',id:'AUDITOR',name:'Auditor',permissions:['panel.access','governance.read']},request);
  assert.equal((await loadSessionUser(editor.id))!.sessionVersion,updated.sessionVersion!+1);
  await changeAccess(master,{operation:'user',id:editor.id,fullName:editor.fullName,isActive:false,roles:[]},request);
  assert.equal(await loadSessionUser(editor.id),null);
  const logs=(await query('select before_data,after_data,metadata from audit_logs where actor_user_id=$1',[master.id])).rows;
  assert.ok(logs.length>=4);
  assert.ok(!JSON.stringify(logs).includes('test-password-do-not-use'));
  const count=(await query('select count(*) from app_users')).rows[0].count;
  await assert.rejects(changeAccess(master,{operation:'create',email:'bad@example.invalid',fullName:'Bad',password:'test-password-do-not-use',isActive:true,roles:['UNKNOWN']},request),/desconhecido/);
  assert.equal((await query('select count(*) from app_users')).rows[0].count,count);
  await assert.rejects(changeAccess(master,{operation:'role',id:'CRM_OPERATOR',name:'CRM',permissions:['panel.access','governance.read']},request),/operacional/);
  await assert.rejects(changeAccess(master,{operation:'role',id:'MASTER',name:'Unsafe',permissions:[]},request),/protegido/);
  // Exercise last-MASTER protection with a delegated manager, so self-protection cannot mask a regression.
  await changeAccess(master,{operation:'role',id:'TEST_MANAGER',name:'Test manager',permissions:['panel.access','governance.read','governance.manage']},request);
  const delegate=(await query(`insert into app_users(email,full_name,role) values($1,'Delegated manager','secretary') returning id`,[`manager-${Date.now()}@example.invalid`])).rows[0];
  await query("insert into user_roles values($1,'TEST_MANAGER')",[delegate.id]);
  const manager=(await loadSessionUser(delegate.id))!;
  const masters=(await query("select user_id from user_roles where role_id='MASTER' and user_id<>$1",[master.id])).rows;
  try {
    await query("delete from user_roles where role_id='MASTER' and user_id<>$1",[master.id]);
    await assert.rejects(changeAccess(manager,{operation:'user',id:master.id,fullName:master.fullName,isActive:false,roles:[]},request),/MASTER ativo/);
    await assert.rejects(changeAccess(manager,{operation:'user',id:manager.id,fullName:manager.fullName,isActive:true,roles:['CRM_OPERATOR']},request),/próprio acesso/);
    await assert.rejects(changeAccess(manager,{operation:'role',id:'TEST_MANAGER',name:'Unsafe',permissions:['panel.access']},request),/próprio acesso/);
  } finally {
    for(const row of masters)await query("insert into user_roles values($1,'MASTER') on conflict do nothing",[row.user_id]);
    await query('delete from user_roles where user_id=$1',[manager.id]);
    await query('update app_users set is_active=false where id=$1',[manager.id]);
  }
  console.log('PASS: RBAC, privilege denial, MASTER protection, session revocation, disabled user, audit redaction, transactional validation');
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
