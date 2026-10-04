import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import https from 'node:https';
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const base='https://www.nogueiracardiologia.com.br';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const checks=[];let folder;
const cookieFor=user=>{const payload=Buffer.from(JSON.stringify({id:user.id,email:user.email,fullName:user.full_name,role:user.role,sessionVersion:user.session_version,audience:'internal',expiresAt:Date.now()+180000})).toString('base64url');return `nogueira_session=${payload}.${createHmac('sha256',process.env.AUTH_SECRET).update(payload).digest('base64url')}`;};
const call=(route,cookie='',body)=>fetch(base+route,{redirect:'manual',method:body?'POST':'GET',headers:{cookie,...body?{origin:base,'Content-Type':'application/json'}:{}},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
const change=(cookie,action,items,extra={})=>call('/api/internal/files',cookie,{action,items,...extra});
let cookie='';
try{
  await db.connect();assert.equal((await db.query('select current_database() name')).rows[0].name,'nogueira_app');
  const users=(await db.query("select id,email,full_name,role,session_version,drive_enabled,drive_quota_bytes from app_users where id=any($1::uuid[]) and is_active",[['4d6a92f6-2a80-428e-84be-d2369de3c22f','9dfce534-033f-4f74-91ef-61478581ef48','0c2a873f-828e-46f9-b9e1-6e4997a83d12']])).rows;
  const paulo=users.find(u=>u.id==='4d6a92f6-2a80-428e-84be-d2369de3c22f');assert.ok(paulo);cookie=cookieFor(paulo);
  assert.equal((await call('/api/internal/files')).status,401);assert.equal((await call('/arquivos')).status,307);
  assert.equal((await call('/arquivos',cookie)).status,200);
  assert.deepEqual((await db.query('select id from app_users where drive_enabled order by id')).rows.map(u=>u.id),[paulo.id]);
  const capacity=await (await call('/api/internal/files',cookie)).json();
  assert.equal(capacity.quota,Number(paulo.drive_quota_bytes??50*1024**3));
  for(const other of users.filter(u=>u.id!==paulo.id)) {
    const session=cookieFor(other);
    assert.equal((await call('/api/internal/files',session)).status,403);
    const page=await call('/arquivos',session);assert.equal(page.status,307);assert.equal(page.headers.get('location'),'/sem-acesso');
    assert.ok(!(await (await call('/dashboard',session)).text()).includes('href="/arquivos"'));
    assert.equal((await change(session,'folder',[],{name:'Unauthorized storage'})).status,403);
    assert.equal((await fetch(`${base}/api/internal/files/upload?name=denied.txt`,{method:'PUT',headers:{cookie:session,origin:base,'Content-Type':'text/plain'},body:'denied'})).status,403);
  }
  checks.push('storage enabled exclusively for Dr. Paulo; other MASTER accounts denied page, navigation, listing and uploads');
  const created=await change(cookie,'folder',[],{name:`Validação técnica temporária ${randomUUID()}`});assert.equal(created.status,200);folder={...await created.json(),kind:'folder'};
  const bytes=Buffer.from('Nogueira Drive: teste técnico temporário, sem dados pessoais.');
  const sent=await fetch(`${base}/api/internal/files/upload?${new URLSearchParams({name:'validacao.txt',folder:folder.id})}`,{method:'PUT',headers:{cookie,origin:base,'Content-Type':'text/plain'},body:bytes});assert.equal(sent.status,201);const file=await sent.json();
  const downloaded=await call(`/api/internal/files/${file.id}/content`,cookie);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);
  const preview=await call(`/api/internal/files/${file.id}/content?preview=1`,cookie);assert.equal(preview.status,200);assert.match(preview.headers.get('content-security-policy'),/sandbox/);
  const other=users.find(u=>u.id!==paulo.id);assert.ok(other);assert.equal((await call(`/api/internal/files/${file.id}/content`,cookieFor(other))).status,403);
  assert.equal((await change(cookie,'trash',[folder])).status,200);assert.equal((await call(`/api/internal/files/${file.id}/content`,cookie)).status,404);
  assert.equal((await change(cookie,'restore',[folder])).status,200);assert.equal((await call(`/api/internal/files/${file.id}/content`,cookie)).status,200);
  assert.equal((await change(cookie,'trash',[folder])).status,200);assert.equal((await change(cookie,'purge',[folder])).status,200);folder=null;
  checks.push('production page, folder/upload/download/preview, owner isolation, trash/restore/purge and test cleanup');
  // Verify real Traefik route without depending on public DNS. No insecure public TLS exception.
  const appHealth=await new Promise((resolve,reject)=>{const req=https.get({hostname:'127.0.0.1',port:443,servername:'app.nogueiracardiologia.com.br',rejectUnauthorized:false,path:'/api/health',headers:{host:'app.nogueiracardiologia.com.br'}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);});
  assert.equal(appHealth.status,200);assert.equal(JSON.parse(appHealth.text).sha,sha);checks.push('app hostname via local Traefik at deployed SHA');
  let appPublic='DNS/TLS pending';
  try{const response=await fetch('https://app.nogueiracardiologia.com.br/api/health',{signal:AbortSignal.timeout(10000)});if(response.ok){assert.equal((await response.json()).sha,sha);appPublic='HTTPS verified';}}catch{/* External DNS still owner-managed. */}
  const evidence={sha,checks,appPublic,at:new Date().toISOString(),credentials:'Diagnostic sessions in memory; real passwords unchanged'};
  await writeFile(`/var/log/nogueira-drive-${sha}.json`,JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
  console.log('DRIVE PRODUCTION VERIFIED:',JSON.stringify(evidence));
} finally {
  if(folder&&cookie){await change(cookie,'trash',[folder]);await change(cookie,'purge',[folder]);}
  await db.end();
}
