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
  await changeAccess(master,{operation:'role',id:'AUDITOR',name:'Auditor',permissions:['governance.read']},request);
  assert.equal((await loadSessionUser(editor.id))!.sessionVersion,updated.sessionVersion!+1);
  await changeAccess(master,{operation:'user',id:editor.id,fullName:editor.fullName,isActive:false,roles:[]},request);
  assert.equal(await loadSessionUser(editor.id),null);
  const logs=(await query('select before_data,after_data,metadata from audit_logs where actor_user_id=$1',[master.id])).rows;
  assert.ok(logs.length>=4);
  assert.ok(!JSON.stringify(logs).includes('test-password-do-not-use'));
  const count=(await query('select count(*) from app_users')).rows[0].count;
  await assert.rejects(changeAccess(master,{operation:'create',email:'bad@example.invalid',fullName:'Bad',password:'test-password-do-not-use',isActive:true,roles:['UNKNOWN']},request),/desconhecido/);
  assert.equal((await query('select count(*) from app_users')).rows[0].count,count);
  console.log('PASS: RBAC, privilege denial, MASTER protection, session revocation, disabled user, audit redaction, transactional validation');
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
