import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnvConfig } from '@next/env';
import { query } from '../src/lib/db';

loadEnvConfig(process.cwd());
const password = 'fixture-password-never-production';
const paulo = '4d6a92f6-2a80-428e-84be-d2369de3c22f';
const matheus = '0c2a873f-828e-46f9-b9e1-6e4997a83d12';
const doctor = '9dfce534-033f-4f74-91ef-61478581ef48';
const patient = '00000000-0000-4000-8000-000000000020';
const subjects: Record<string,string> = { 'libonattimatheus@gmail.com':'00000000-0000-4000-8000-000000000030','patient@example.invalid':'00000000-0000-4000-8000-000000000031' };
const origin = process.env.NEXT_PUBLIC_SITE_URL!;
const base = 'http://127.0.0.1:3003';
const results: string[] = [];
const pass=(name:string)=>{results.push(name);console.log(`PASS: ${name}`);};

async function main() {
  if (!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test')) throw new Error('Requires isolated test database');
  for(const [id,email,name,role,local] of [[paulo,'drpaulo@nogueiracardiologia.com.br','Dr. Paulo','doctor',true],
    [matheus,'libonattimatheus@gmail.com','Matheus','patient',false],
    [doctor,'dracris@nogueiracardiologia.com.br','Dra. Cris','doctor',true],
    [patient,'patient@example.invalid','Patient','patient',false]]) {
    await query(`insert into app_users(id,email,full_name,role,password_hash,email_verified_at,supabase_user_id)
      values($1,$2,$3,$4,case when $5 then crypt($6,gen_salt('bf',4)) else null end,now(),$7)
      on conflict(id) do update set is_active=true`,[id,email,name,role,local,password,subjects[String(email)]??null]);
  }
  await query(await readFile('database/007_governance.sql','utf8'));
  const fakeAuth = createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=JSON.parse(Buffer.concat(chunks).toString()||'{}');
    const id=subjects[body.email];
    res.setHeader('Content-Type','application/json');
    if(body.email==='unconfirmed@example.invalid'){res.writeHead(400);res.end(JSON.stringify({error:'email_not_confirmed',error_description:'Email not confirmed'}));return;}
    if(!id||body.password!==password){res.writeHead(400);res.end(JSON.stringify({error:'invalid_grant',error_description:'Invalid login credentials'}));return;}
    res.end(JSON.stringify({access_token:'fixture-access',refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,
      user:{id,email:body.email,aud:'authenticated',role:'authenticated',email_confirmed_at:new Date().toISOString(),user_metadata:{}}}));
  });
  await new Promise<void>(resolve=>fakeAuth.listen(8090,'127.0.0.1',resolve));
  const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3003'],{env:process.env,stdio:['ignore','pipe','pipe']});
  let log='';app.stdout.on('data',chunk=>log+=chunk);app.stderr.on('data',chunk=>log+=chunk);
  const call=async(path:string,cookie='',body?:unknown,requestOrigin=origin)=>{
    const response=await fetch(base+path,{method:body===undefined?'GET':'POST',redirect:'manual',headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{origin:requestOrigin,'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
    return response;
  };
  const login=async(email:string,portal='admin')=>{
    const response=await call('/api/auth/login','',{email,password,portal});
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    return {cookie:response.headers.get('set-cookie')!.split(';')[0],body};
  };
  try {
    for(let n=0;n<60;n++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await delay(500);}
    assert.equal((await call('/')).status,200);assert.equal((await call('/api/health')).status,200);pass('frontend/backend/database start');
    assert.equal((await call('/api/internal/governance')).status,401);
    assert.equal((await call('/api/internal/lios/health')).status,401);
    assert.equal((await call('/acesso/governanca')).status,307);pass('anonymous API/page access blocked');
    const p=await login('drpaulo@nogueiracardiologia.com.br');const m=await login('libonattimatheus@gmail.com');
    for(const u of [p,m]){assert.ok(u.body.user.roles.includes('MASTER'));assert.equal((await call('/api/internal/governance',u.cookie)).status,200);assert.equal((await call('/acesso/governanca',u.cookie)).status,200);assert.equal((await call('/acesso/lios',u.cookie)).status,200);}
    pass('MASTER identities: local login and mocked Supabase login, governance and LIOS pages');
    const d=await login('dracris@nogueiracardiologia.com.br');const patientLogin=await login('patient@example.invalid','patient');
    for(const u of [d,patientLogin]){assert.equal((await call('/api/internal/governance',u.cookie)).status,403);assert.equal((await call('/api/internal/lios/health',u.cookie)).status,403);}
    assert.equal((await call('/api/internal/governance',p.cookie,{operation:'role'},'https://attacker.example')).status,403);pass('doctor/patient isolation and CSRF denial');
    const denied=await call('/api/auth/login','',{email:'libonattimatheus@gmail.com',password:'invalid-password',portal:'admin'});assert.equal(denied.status,401);
    await query('update app_users set supabase_user_id=$2 where id=$1',[matheus,'00000000-0000-4000-8000-000000000099']);
    assert.equal((await call('/api/auth/login','',{email:'libonattimatheus@gmail.com',password,portal:'admin'})).status,401);
    await query('update app_users set supabase_user_id=$2 where id=$1',[matheus,subjects['libonattimatheus@gmail.com']]);pass('invalid credentials and mismatched Supabase identity blocked');
    const unconfirmed=await call('/api/auth/login','',{email:'unconfirmed@example.invalid',password,portal:'patient'});
    assert.equal(unconfirmed.status,403);assert.equal((await unconfirmed.json()).code,'email_not_verified');pass('unconfirmed patient retains email verification guidance');
    const health=await call('/api/internal/lios/health',p.cookie);assert.equal(health.status,200);assert.equal((await health.json()).ai_mode,'demo');
    const appResponse=await call('/api/internal/lios/applications',p.cookie,{name:'HTTP Integration',slug:`http-${Date.now()}`});assert.equal(appResponse.status,201);const application=await appResponse.json();
    for(const kind of ['avatar','offer','signals']){const response=await call(`/api/internal/lios/applications/${application.id}/documents`,p.cookie,{rag_type:kind,title:'Public fixture',content:'General editorial context for a synthetic test. Never patient data.',source_url:'https://example.com/source',source_name:'Fixture'});assert.equal(response.status,201);}
    const start=await call(`/api/internal/lios/applications/${application.id}/runs`,p.cookie,{topic_hint:'Fixture editorial'});assert.equal(start.status,202);let run=await start.json();
    for(let n=0;n<40&&['running','queued'].includes(run.status);n++){await delay(500);run=await(await call(`/api/internal/lios/runs/${run.id}`,p.cookie)).json();}
    assert.equal(run.status,'review_required');assert.equal(run.article.audit.approved,false);assert.ok(run.events.length>5);
    assert.equal((await call('/api/internal/lios/submit',p.cookie,{id:run.article.id})).status,409);pass('LIOS PostgreSQL RAG, queued execution, audit and synthetic publication block');
    // Explicit fixture only in isolated DB: verify idempotent draft adapter for an approved real article.
    await query('update lios.articles set audit_json=$2,sources_json=$3 where id=$1',[run.article.id,JSON.stringify({approved:true,score:9,blockers:[]}),JSON.stringify([{source:'Test journal',url:'https://example.com/source'}])]);
    const first=await(await call('/api/internal/lios/submit',p.cookie,{id:run.article.id})).json();
    const second=await(await call('/api/internal/lios/submit',p.cookie,{id:run.article.id})).json();assert.equal(first.id,second.id);assert.ok(first.id);
    assert.equal((await query('select status from educativo_posts where id=$1',[first.id])).rows[0].status,'draft');pass('approved article creates exactly one draft, never publishes automatically');
    const logout=await call('/api/auth/logout',m.cookie,{});assert.equal(logout.status,303);
    assert.equal((await call('/api/internal/governance',m.cookie)).status,401);pass('logout revokes reused session');
    const history=(await query("select action,result,before_data,after_data,metadata from audit_logs where action like 'auth.%' or action like 'lios.%'")).rows;
    assert.ok(history.some(x=>x.action==='auth.login'&&x.result==='success'));assert.ok(history.some(x=>x.action==='auth.login'&&x.result==='denied'));assert.ok(history.some(x=>x.action==='lios.submit'));
    assert.ok(!JSON.stringify(history).includes(password));assert.ok(!JSON.stringify(history).includes('fixture-access'));pass('audit covers authentication and LIOS without credentials');
    await writeFile('/tmp/nogueira-http-test-results.json',JSON.stringify({tests:results,status:'passed'},null,2));
  } finally {
    app.kill('SIGTERM');fakeAuth.close();
    await writeFile('/tmp/nogueira-http-test-server.log',log);
  }
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
