import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test')) throw Error('Isolated database required');
if (!process.env.PLAYWRIGHT_MODULE) throw Error('PLAYWRIGHT_MODULE required');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const base = 'http://127.0.0.1:3004', directory = '/tmp/nogueira-crm-operational';
const marker = `workspace-${Date.now()}`, password = 'isolated-workspace-fixture-password';
const operator = randomUUID(), master = randomUUID(), name = `Contato ${marker}`;
let app, browser, log = '', page;
const errors = [];
const pass = message => console.log(`PASS: ${message}`);
try {
  await mkdir(directory, { recursive: true });
  await db.query(`insert into app_users(id,email,full_name,role,password_hash,email_verified_at) values
    ($1,$2,'Atendente fictícia','secretary',crypt($3,gen_salt('bf',4)),now()),
    ($4,$5,'Master fictício','doctor',crypt($3,gen_salt('bf',4)),now())`,
  [operator,`${marker}@example.invalid`,password,master,`${marker}-master@example.invalid`]);
  await db.query("insert into user_roles(user_id,role_id) values($1,'CRM_OPERATOR'),($2,'MASTER')", [operator,master]);
  const doctor = (await db.query('select id from doctors where is_active order by id limit 1')).rows[0].id;
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3004'], {
    env: { ...process.env, AUTH_ALLOWED_ORIGINS: base }, stdio: ['ignore','pipe','pipe'],
  });
  app.stdout.on('data', chunk => log += chunk); app.stderr.on('data', chunk => log += chunk);
  for (let i=0; i<60; i++) { try { if ((await fetch(base+'/api/health')).ok) break; } catch {} await delay(250); }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width:1440, height:1000 } });
  page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  const login = async (target, email) => {
    await target.goto(base+'/acesso');
    await target.getByLabel('E-mail de acesso').fill(email);
    await target.getByLabel('Senha',{exact:true}).fill(password);
    await target.getByRole('button',{name:'Entrar no painel',exact:true}).click();
    await target.waitForURL('**/crm');
  };
  await login(page,`${marker}@example.invalid`);
  const nav = page.getByRole('navigation',{name:'Navegação do painel'});
  assert.deepEqual(await nav.getByRole('link').allTextContents(), ['▤Agenda','♧Contatos / Pacientes','◫CRM']);
  const board = page.getByRole('region',{name:'Kanban comercial de consultas',exact:true});
  assert.equal(await board.getByRole('heading',{level:2}).count(),9);
  assert.equal(await page.getByRole('button',{name:'Indicadores da operação',exact:true}).count(),0);
  await page.getByRole('button',{name:'+ Novo contato',exact:true}).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome completo *',{exact:true}).fill(name);
  await dialog.getByLabel('Telefone / WhatsApp *',{exact:true}).fill('11998761234');
  await dialog.getByLabel('Data de nascimento',{exact:true}).fill('1980-03-15');
  await dialog.locator('select[name="sex"]').selectOption('female');
  await dialog.getByText('Endereço e medicamentos informados',{exact:true}).click();
  await dialog.getByLabel('CEP',{exact:true}).fill('01001-000');
  await dialog.getByLabel('Medicamentos em uso',{exact:false}).fill('Informação fictícia para teste');
  await dialog.getByRole('button',{name:'Salvar contato',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  await page.getByLabel('Busca global').fill(marker);
  const card = page.getByRole('article',{name:`Oportunidade de ${name}`,exact:true});
  await card.waitFor();
  const person = (await db.query('select id from patient_profiles where full_name=$1',[name])).rows[0];
  const lead = (await db.query('select id from leads where patient_id=$1',[person.id])).rows[0];
  await card.dragTo(page.getByRole('region',{name:'02. Conexão',exact:true}), {sourcePosition:{x:25,y:15},targetPosition:{x:100,y:70}});
  await page.getByRole('region',{name:'02. Conexão',exact:true}).getByRole('article',{name:`Oportunidade de ${name}`,exact:true}).waitFor();
  await page.reload();
  await page.getByRole('region',{name:'02. Conexão',exact:true}).getByRole('article',{name:`Oportunidade de ${name}`,exact:true}).waitFor();
  assert.equal((await db.query("select count(*)::int n from lead_events where lead_id=$1 and event_type='stage.changed'",[lead.id])).rows[0].n,1);
  await page.screenshot({path:directory+'/kanban-desktop.png',fullPage:true});
  pass('three operator menu items, nine columns, quick registration and drag/drop survives reload with history');

  await card.getByRole('button').first().click(); dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Agenda',exact:true}).click();
  await dialog.getByRole('button',{name:'+ Nova consulta',exact:true}).click();
  await dialog.locator('select[name="doctorId"]').selectOption(doctor);
  await dialog.getByLabel('Data e horário (Brasília)',{exact:true}).fill('2039-05-17T10:00');
  await dialog.locator('select[name="modality"]').selectOption('telemedicine');
  await dialog.getByRole('button',{name:'Salvar consulta',exact:true}).click();
  await dialog.getByRole('button',{name:'Editar / reagendar',exact:true}).waitFor();
  await dialog.getByRole('button',{name:'Editar / reagendar',exact:true}).click();
  await dialog.locator('select[name="status"]').selectOption('attended');
  await dialog.getByRole('button',{name:'Salvar consulta',exact:true}).click();
  await dialog.getByText(/Consulta realizada/).first().waitFor();
  await dialog.getByRole('button',{name:'Tarefas',exact:true}).click();
  await dialog.getByText('POP · D+3 · Pendente',{exact:true}).waitFor();
  await dialog.getByText('POP · D+6 · Pendente',{exact:true}).waitFor();
  await dialog.getByText('Continuidade · D+180 · Pendente',{exact:true}).waitFor();
  assert.equal((await db.query("select count(*)::int n from crm_tasks where patient_id=$1 and kind like 'pop_%' and status='pending'",[person.id])).rows[0].n,3);
  await page.screenshot({path:directory+'/pop-tarefas.png',fullPage:true});
  await dialog.getByRole('button',{name:'Concluir',exact:true}).first().click();
  await dialog.getByLabel('Resultado',{exact:true}).fill('Paciente fictício satisfeito');
  await dialog.getByRole('button',{name:'Concluir tarefa',exact:true}).click();
  await dialog.getByText('POP · D+3 · Concluída',{exact:true}).waitFor();
  assert.equal((await db.query('select pipeline_stage from leads where id=$1',[lead.id])).rows[0].pipeline_stage,'post_sale');
  await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
  pass('schedule/edit consultation in same person, attended starts POP and completed D+3 advances to post-sale');

  const masterContext=await browser.newContext({viewport:{width:1440,height:1000}});
  const masterPage=await masterContext.newPage();masterPage.on('pageerror',error=>errors.push(error.message));
  await login(masterPage,`${marker}-master@example.invalid`);
  await masterPage.getByLabel('Busca global').fill(marker);
  await masterPage.getByRole('article',{name:`Oportunidade de ${name}`,exact:true}).waitFor();
  await masterPage.getByRole('button',{name:'Indicadores da operação',exact:true}).click();
  await masterPage.getByRole('region',{name:'Indicadores gerenciais'}).waitFor();
  const metrics=await masterPage.evaluate(async query=>{const r=await fetch(`/api/internal/crm?view=metrics&q=${query}`);return {status:r.status,body:await r.json()};},marker);
  assert.equal(metrics.status,200);assert.equal(metrics.body.summary.attended,1);
  assert.equal(await page.evaluate(async()=> (await fetch('/api/internal/crm?view=metrics')).status),403);
  await masterPage.screenshot({path:directory+'/master-indicadores.png',fullPage:true});
  pass('MASTER sees the same card and consultation with indicators; operator metrics request is denied');

  await page.getByRole('link',{name:'Agenda',exact:true}).click();
  await page.getByRole('heading',{name:'Agenda',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mês',exact:true}).click();
  await page.getByLabel('Data da agenda').fill('2039-05-17');
  await page.getByRole('button',{name:'Próximo período',exact:true}).click();
  assert.equal(await page.getByLabel('Data da agenda').inputValue(),'2039-06-01');
  await page.getByRole('button',{name:'Período anterior',exact:true}).click();
  assert.equal(await page.getByLabel('Data da agenda').inputValue(),'2039-05-01');
  await page.getByRole('button',{name:new RegExp(name)}).first().waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:directory+'/agenda-mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile agenda must not overflow page');
  await page.getByRole('button',{name:'Abrir navegação',exact:true}).click();
  await page.getByRole('link',{name:'Contatos / Pacientes',exact:true}).click();
  await page.getByRole('button',{name:name,exact:true}).click();dialog=page.getByRole('dialog');
  await dialog.getByText('Relacionamento, perda ou falecimento',{exact:true}).click();
  await dialog.locator('select[name="status"]').selectOption('deceased');
  await dialog.getByLabel('Origem da informação de falecimento',{exact:true}).fill('Fixture familiar');
  await dialog.getByRole('button',{name:'Salvar status do relacionamento',exact:true}).click();
  await dialog.getByText('Comunicações e réguas bloqueadas. Histórico preservado.',{exact:true}).waitFor();
  assert.equal((await db.query("select count(*)::int n from crm_tasks where patient_id=$1 and status='pending'",[person.id])).rows[0].n,0);
  await dialog.getByRole('button',{name:'Timeline',exact:true}).click();
  await dialog.getByText('Falecimento informado',{exact:true}).waitFor();
  await page.screenshot({path:directory+'/historico-mobile.png',fullPage:true});
  await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
  await page.goto(base+'/governanca');await page.waitForURL('**/sem-acesso');
  assert.deepEqual(errors,[]);
  pass('month navigation, mobile agenda/contacts, deceased suppresses tasks and preserves timeline, forbidden route and no browser errors');
} catch(error) {
  await page?.screenshot({path:directory+'/failure.png',fullPage:true}).catch(()=>{});
  throw error;
} finally {
  await browser?.close(); app?.kill('SIGTERM');
  await writeFile(directory+'/server.log',log);
  const people=(await db.query('select id from patient_profiles where full_name=$1',[name])).rows.map(row=>row.id);
  await db.query("update leads set operational_status='lost' where patient_id=any($1::uuid[])",[people]);
  for(const table of ['crm_exam_followups','crm_tasks','payments','appointments','lead_events','leads','patient_profiles']) {
    await db.query(`delete from ${table} where ${table==='patient_profiles'?'id':'patient_id'}=any($1::uuid[])`,[people]);
  }
  await db.query('delete from audit_logs where actor_user_id=any($1::uuid[])',[[operator,master]]);
  await db.query('delete from app_users where id=any($1::uuid[])',[[operator,master]]);
  await db.end();
}
