import assert from 'node:assert/strict';
import https from 'node:https';
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());
const base = 'https://www.nogueiracardiologia.com.br';
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const checks = [];
const panelHost='painel.nogueiracardiologia.com.br';
// Pre-DNS: connect only to the local Traefik. Default certificate is expected until DNS propagates.
function panelRequest(route,cookie='') {
  return new Promise((resolve,reject)=>{
    const req=https.get({hostname:'127.0.0.1',port:443,servername:panelHost,rejectUnauthorized:false,
      path:route,headers:{host:panelHost,...(cookie?{cookie}:{})},timeout:15000},response=>{
      let body='';response.setEncoding('utf8');response.on('data',chunk=>body+=chunk);
      response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,body}));
    });req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('Local panel proxy timeout')));
  });
}
const startedAt = new Date();
function pass(name) { checks.push(name); console.log(`PASS: ${name}`); }
async function request(route, cookie = '', options = {}) {
  return fetch(base + route, { redirect: 'manual', signal: AbortSignal.timeout(30000), ...options,
    headers: { ...(cookie ? { cookie } : {}), ...options.headers } });
}
// Host-side validation only: no passwords changed, no tokens printed or persisted.
// This exercises real sessions/RBAC; password login is covered in the isolated HTTP suite.
function session(user,audience='internal') {
  const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email,
    fullName: user.full_name, role: user.role, sessionVersion: user.session_version, audience,
    expiresAt: Date.now() + 180000 })).toString('base64url');
  const signature = createHmac('sha256', process.env.AUTH_SECRET ?? process.env.DATABASE_URL)
    .update(payload).digest('base64url');
  return `nogueira_session=${payload}.${signature}`;
}

try {
  await client.connect();
  assert.equal((await client.query('select current_database() db')).rows[0].db, 'nogueira_app');
  for (const url of [base + '/api/health', 'http://127.0.0.1:3002/api/health', 'http://127.0.0.1:8081/healthz']) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `health: ${url}`);
    const health = await response.json();
    assert.equal(health.status, 'ok'); assert.equal(health.sha, sha, `artifact SHA: ${url}`);
  }
  pass('public/local web, LIOS and PostgreSQL healthy at HEAD');
  const panelHealth=await panelRequest('/api/health');assert.equal(panelHealth.status,200);assert.equal(JSON.parse(panelHealth.body).sha,sha);
  const panelLogin=await panelRequest('/');assert.equal(panelLogin.status,200);assert.ok(panelLogin.body.includes('workspace'));
  assert.equal(panelLogin.headers['x-robots-tag'],'noindex, nofollow');
  assert.equal((await panelRequest('/portal')).headers.location,base+'/portal');
  pass('pre-DNS panel hostname through real local Traefik, root login and public portal separation');
  for (const route of ['/', '/blog', '/exames', '/portal', '/acesso']) {
    assert.equal((await request(route)).status, 200, route);
  }
  for (const route of ['/api/internal/governance', '/api/internal/audit', '/api/internal/lios/health', '/api/internal/export', '/api/internal/monthly-report', '/api/internal/crm']) {
    assert.equal((await request(route)).status, 401, route);
  }
  for (const route of ['/acesso/governanca', '/acesso/lios', '/acesso/dashboard']) {
    assert.equal((await request(route)).status, 307, route);
  }
  assert.equal((await fetch('http://127.0.0.1:8081/api/v1/applications')).status, 401);
  pass('existing public routes and unauthenticated administrative isolation');
  const identities = [
    ['Dr. Paulo', '4d6a92f6-2a80-428e-84be-d2369de3c22f'],
    ['Matheus', '0c2a873f-828e-46f9-b9e1-6e4997a83d12'],
    ['Dra. Cris', '9dfce534-033f-4f74-91ef-61478581ef48'],
  ];
  const permissions = (await client.query('select id from permissions')).rows.map(row => row.id);
  for (const [name, id] of identities) {
    const user = (await client.query(`select u.id,u.email,u.full_name,u.role,u.session_version,
      array_agg(distinct ur.role_id) roles,array_agg(distinct rp.permission_id) permissions
      from app_users u join user_roles ur on ur.user_id=u.id join role_permissions rp on rp.role_id=ur.role_id
      where u.id=$1 and u.is_active group by u.id`, [id])).rows[0];
    assert.ok(user?.roles.includes('MASTER'), `${name}: active MASTER`);
    assert.ok(permissions.every(permission => user.permissions.includes(permission)), `${name}: all permissions`);
    const cookie = session(user);
    for (const route of ['/acesso/dashboard', '/acesso/governanca', '/acesso/lios', '/api/internal/governance', '/api/internal/audit', '/api/internal/lios/health', '/api/internal/lios/applications','/dashboard','/governanca','/crm','/auditoria','/configuracoes','/api/internal/crm']) {
      assert.equal((await request(route, cookie)).status, 200, `${name}: ${route}`);
    }
    assert.equal((await panelRequest('/',cookie)).headers.location,'/dashboard');
    assert.equal((await panelRequest('/governanca',cookie)).status,200);
    // A patient-audience token for the same identity cannot unlock IAM.
    assert.equal((await request('/api/internal/governance',session(user,'patient'))).status,403);
    const denied = await request('/api/internal/governance', cookie, { method: 'POST',
      headers: { origin: 'https://invalid.example', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(denied.status, 403, 'cross-origin administrative write');
    pass(`${name}: existing identity, complete MASTER, real pages/APIs and CSRF protection`);
  }
  const ordinary = (await client.query(`select u.id,u.email,u.full_name,u.role,u.session_version
    from app_users u where u.is_active and not exists
    (select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id
      where ur.user_id=u.id and rp.permission_id in ('governance.read','lios.read'))
    order by (u.role::text='patient') desc limit 1`)).rows[0];
  if(ordinary) {
    const cookie = session(ordinary);
    for(const route of ['/api/internal/governance','/api/internal/audit','/api/internal/lios/health'])assert.equal((await request(route,cookie)).status,403,route);
    pass('existing ordinary identity denied by real administrative APIs');
  } else {
    // Do not create production test accounts: inactive existing identities must also lose access.
    const inactive=(await client.query('select id,email,full_name,role,session_version from app_users where not is_active limit 1')).rows[0];
    if(inactive)assert.equal((await request('/api/internal/governance',session(inactive))).status,401);
    pass('no active ordinary production identity; patient audience isolation verified, CRM operator tested in isolated HTTP suite');
  }
  const crmPermissions=(await client.query("select permission_id from role_permissions where role_id='CRM_OPERATOR'")).rows.map(row=>row.permission_id);
  const operational=['panel.access','crm.access','crm.leads.read','crm.leads.manage','crm.patients.read','crm.appointments.read','crm.appointments.manage'];
  assert.ok(crmPermissions.every(p=>operational.includes(p)));
  pass('production CRM_OPERATOR contains only operational permissions');
  const events = (await client.query(`select action,result,metadata,before_data,after_data from audit_logs
    where created_at >= $1 and action in ('access.denied','access.origin_denied')`, [startedAt])).rows;
  assert.ok(events.some(event => event.action === 'access.denied' && event.result === 'denied'));
  assert.ok(events.some(event => event.action === 'access.origin_denied'));
  assert.ok(!/password|cookie|authorization|secret|token/i.test(JSON.stringify(events)), 'no credentials in audit events');
  pass('production audit events persisted without credentials');
  const migrations = (await client.query('select name from schema_migrations order by name')).rows.map(row => row.name);
  assert.ok(migrations.includes('007_governance.sql') && migrations.includes('008_lios.sql') && migrations.includes('009_panel_iam_crm.sql'));
  const privileges = (await client.query(`select has_table_privilege('nogueira_lios','app_users','select') clinical,
    has_table_privilege('nogueira_lios','patient_profiles','select') patients,
    has_table_privilege('nogueira_lios','lios.applications','select') editorial`)).rows[0];
  assert.deepEqual(privileges, { clinical: false, patients: false, editorial: true });
  pass('applied migrations and LIOS database privilege isolation');
  const supabase = { status: 'unavailable', code: 'not_configured' };
  const providerUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (providerUrl) {
    try {
      const response = await fetch(new URL('/auth/v1/settings', providerUrl), {
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
          || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        signal: AbortSignal.timeout(10000) });
      supabase.status = response.ok ? 'reachable' : 'unavailable';
      supabase.code = `HTTP_${response.status}`;
    } catch (error) { supabase.code = error.cause?.code || error.name; }
  }
  if (supabase.status !== 'reachable') console.log(`EXTERNAL: patient Supabase authentication (${supabase.code}); internal authentication is local; session/RBAC checks passed independently.`);
  const result = { sha, at: new Date().toISOString(), status: supabase.status === 'reachable' ? 'passed' : 'passed_with_external_blocker',
    checks, migrations, externalDependencies: { supabaseAuth: supabase },
    passwordLogin: 'local internal activation/change/login tested in isolated database; patient Supabase simulated; personal passwords unchanged',
    panel: {host:panelHost,preDns:'passed',dns:'owner managed; A record to 2.24.215.163'},
    credentialActivation: 'Matheus existing identity has no local password initially; authorized MASTER must define a temporary password in IAM. No real password created by agent.' };
  await writeFile(`/var/log/nogueira-deploy-${sha}.json`, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
} catch (error) {
  console.error(`Production smoke failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
