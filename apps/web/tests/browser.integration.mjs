import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';

if(!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test'))throw new Error('Requires isolated test database');
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to installed playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base='http://127.0.0.1:3003',directory='/tmp/nogueira-panel-browser';
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const password='fixture-password-never-production';
await db.connect();
// Existing isolated fixture only. Never insert or reset a real production identity.
await db.query("update app_users set is_active=true where id='00000000-0000-4000-8000-000000000050'");
await db.query('delete from auth_rate_limits');
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3003'],{
  env:{...process.env,AUTH_ALLOWED_ORIGINS:base},stdio:['ignore','pipe','pipe']});
let log='';app.stdout.on('data',chunk=>log+=chunk);app.stderr.on('data',chunk=>log+=chunk);
let browser;
try {
  for(let n=0;n<40;n++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await delay(250);}
  await mkdir(directory,{recursive:true});
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/acesso');
  await page.getByRole('heading',{name:'Bem-vindo ao seu workspace'}).waitFor();
  for(const chrome of await page.locator('.public-chrome').all())assert.equal(await chrome.isVisible(),false);
  await page.screenshot({path:directory+'/login-desktop.png',fullPage:true});
  await page.getByLabel('E-mail de acesso').fill('drpaulo@nogueiracardiologia.com.br');
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('link',{name:'Governança & IAM',exact:true}).click();
  await page.getByRole('heading',{name:'Governança & IAM',exact:true}).waitFor();
  await page.getByRole('row').filter({hasText:'CRM Operator'}).waitFor();
  await page.screenshot({path:directory+'/iam-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Permissões efetivas',exact:true}).click();
  await page.getByRole('heading',{name:'Usuário → Perfil → Módulo → Permissão'}).waitFor();
  await page.getByRole('button',{name:'Perfis',exact:true}).click();
  await page.getByRole('heading',{name:'Operador CRM',exact:false}).waitFor();
  await page.getByRole('button',{name:'Recolher menu',exact:true}).click();
  await page.getByRole('button',{name:'Expandir menu',exact:true}).click();
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  await page.waitForURL('**/acesso?logout=1');
  await page.getByLabel('E-mail de acesso').fill('operator@example.invalid');
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await page.waitForURL('**/crm');
  await page.getByText('Leads cadastrados',{exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Governança & IAM',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'Financeiro',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'LIOS',exact:true}).count(),0);
  await page.screenshot({path:directory+'/crm-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Pacientes',exact:true}).click();
  await page.getByText('CRM fixture patient',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Consultas',exact:true}).click();
  await page.getByRole('heading',{name:'Novo agendamento',exact:true}).waitFor();
  await page.getByRole('button',{name:'Leads',exact:true}).click();
  await page.getByLabel('Nome',{exact:true}).fill('Browser fixture');
  await page.getByRole('button',{name:'Salvar lead',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Alteração salva'}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Abrir navegação',exact:true}).click();
  await page.getByRole('link',{name:'Agenda',exact:true}).click();
  await page.getByRole('heading',{name:'Compromissos da equipe',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('aside')?.getBoundingClientRect().right<=1);
  await page.screenshot({path:directory+'/crm-mobile.png',fullPage:true,animations:'disabled'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile page must not overflow horizontally');
  await page.goto(base+'/governanca');await page.waitForURL('**/sem-acesso');
  assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('PASS: Chromium desktop/mobile local login, MASTER IAM, role matrix, sidebar collapse, logout, CRM navigation/mutation, forbidden routes, responsive layout');
} finally {
  await browser?.close();app.kill('SIGTERM');await db.end();
  await writeFile(directory+'/server.log',log);
}
