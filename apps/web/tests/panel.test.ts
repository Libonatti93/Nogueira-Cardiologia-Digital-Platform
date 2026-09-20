import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelLanding,panelNavigation,validInternalPassword } from '../src/lib/panel-policy';
import { createSessionToken,verifySessionToken } from '../src/lib/auth';
import { isSameOrigin } from '../src/lib/access-policy';

test('panel routing uses permissions, including multiple roles and forced password changes',()=>{
  assert.equal(panelLanding({permissions:['panel.access','internal.access','crm.access']}),'/dashboard');
  assert.equal(panelLanding({permissions:['panel.access','crm.access']}),'/crm');
  assert.equal(panelLanding({permissions:['panel.access','lios.read']}),'/lios');
  assert.equal(panelLanding({permissions:['panel.access','crm.access'],mustChangePassword:true}),'/alterar-senha');
  assert.equal(panelLanding({permissions:[]}),'/acesso?denied=1');
  const operatorPermissions=['panel.access','crm.access','crm.leads.read','crm.leads.manage','crm.patients.read','crm.appointments.read','crm.appointments.manage'];
  const visible=panelNavigation.filter(item=>operatorPermissions.includes(item.permission));
  assert.ok(!visible.some(item=>['Governança & IAM','LIOS','Financeiro','Auditoria','Configurações'].includes(item.label)));
});
test('session audience is signed and cannot be upgraded from patient by changing payload',()=>{
  process.env.AUTH_SECRET='test-only-panel-signing-secret';
  const token=createSessionToken({id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.invalid',fullName:'Fixture',role:'patient',audience:'patient'});
  assert.equal(verifySessionToken(token)?.audience,'patient');
  const [payload,signature]=token.split('.');
  const changed=JSON.parse(Buffer.from(payload,'base64url').toString());changed.audience='internal';
  assert.equal(verifySessionToken(`${Buffer.from(JSON.stringify(changed)).toString('base64url')}.${signature}`),null);
});
test('internal credential policy limits bcrypt byte length; canonical panel origin is explicit',()=>{
  assert.equal(validInternalPassword('too-short'),false);
  assert.equal(validInternalPassword('fixture-long-password'),true);
  assert.equal(validInternalPassword('á'.repeat(37)),false);
  assert.equal(isSameOrigin(new Request('https://painel.nogueiracardiologia.com.br/api/internal/governance',{method:'POST',headers:{origin:'https://painel.nogueiracardiologia.com.br'}})),true);
  assert.equal(isSameOrigin(new Request('https://painel.nogueiracardiologia.com.br/api/internal/governance',{method:'POST',headers:{origin:'https://attacker.example'}})),false);
});
