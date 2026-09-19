import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHmac } from 'node:crypto';
import { hasPermission, isSameOrigin, accessSnapshot } from '../src/lib/access-policy';
import { createSessionToken, verifySessionToken } from '../src/lib/auth';
import { canSubmitArticle, liosPermission } from '../src/lib/lios-policy';

process.env.AUTH_SECRET = 'isolated-test-secret-never-used-for-production';
const user = { id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',fullName:'Test',role:'doctor',sessionVersion:4 };

test('signed sessions reject tampering, expiration and malformed UUIDs',()=>{
  const token=createSessionToken(user);
  assert.equal(verifySessionToken(token)?.sessionVersion,4);
  assert.equal(verifySessionToken(token+'x'),null);
  assert.equal(verifySessionToken(token+'.extra'),null);
  assert.equal(verifySessionToken(createSessionToken({...user,id:'------------------------------------'})),null);
  const payload=Buffer.from(JSON.stringify({...user,expiresAt:Date.now()-1})).toString('base64url');
  const signature=createHmac('sha256',process.env.AUTH_SECRET!).update(payload).digest('base64url');
  assert.equal(verifySessionToken(`${payload}.${signature}`),null);
});
test('permissions must come from explicit backend grants',()=>{
  assert.equal(hasPermission(null,'governance.manage'),false);
  assert.equal(hasPermission({},'governance.manage'),false);
  assert.equal(hasPermission({permissions:['lios.read']},'governance.manage'),false);
  assert.equal(hasPermission({permissions:['governance.manage']},'governance.manage'),true);
});
test('mutations require the configured origin and reject cross-site requests',()=>{
  process.env.NEXT_PUBLIC_SITE_URL='https://clinic.example';
  const request=(origin?:string,site?:string)=>new Request('http://localhost/api/internal/governance',{method:'POST',headers:{...(origin?{origin}:{}),...(site?{'sec-fetch-site':site}:{})}});
  assert.equal(isSameOrigin(request('https://clinic.example','same-origin')),true);
  assert.equal(isSameOrigin(request()),false);
  assert.equal(isSameOrigin(request('https://attacker.example')),false);
  assert.equal(isSameOrigin(request('https://clinic.example','cross-site')),false);
  process.env.AUTH_ALLOWED_ORIGINS='https://www.clinic.example';
  assert.equal(isSameOrigin(request('https://www.clinic.example','same-origin')),true);
  delete process.env.AUTH_ALLOWED_ORIGINS;
});
test('audit snapshots never include credentials or clinical payloads',()=>{
  assert.deepEqual(accessSnapshot({id:user.id,is_active:false,password:'secret',password_hash:'hash',token:'secret',email:'private',notes:'clinical'}),{id:user.id,is_active:false});
});
test('LIOS proxy is restricted to supported paths and methods',()=>{
  assert.equal(liosPermission('applications','GET'),'lios.read');
  assert.equal(liosPermission('applications/app_0123456789abcdef/runs','POST'),'lios.manage');
  for(const path of ['../healthz','applications/../../secret','https://attacker.example','runs/run_0123456789abcdef/events','applications/app_bad']) assert.equal(liosPermission(path,'GET'),null);
  assert.equal(liosPermission('applications','DELETE'),null);
});
test('publishing requires approval, score, real provenance and source URLs',()=>{
  const approved={audit:{approved:true,score:8,blockers:[]},sources:[{url:'https://source.example/article',source:'Journal'}]};
  assert.equal(canSubmitArticle(approved),true);
  assert.equal(canSubmitArticle({...approved,sources:[{...approved.sources[0],synthetic:true}]}),false);
  assert.equal(canSubmitArticle({...approved,sources:[{source:'LIOS Demo'}]}),false);
  assert.equal(canSubmitArticle({...approved,sources:[{source:'Unverifiable'}]}),false);
  assert.equal(canSubmitArticle({...approved,audit:{approved:true,score:7.9,blockers:[]}}),false);
  assert.equal(canSubmitArticle({...approved,audit:{approved:true,score:9,blockers:['blocked']}}),false);
});
