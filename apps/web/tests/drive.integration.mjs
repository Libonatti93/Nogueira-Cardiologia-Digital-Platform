import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readdir, readFile, stat, statfs } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { request as httpRequest } from 'node:http';
import https from 'node:https';
import pg from 'pg';

if(!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test'))throw new Error('Requires isolated test database');
const storage='/tmp/nogueira-drive-integration',base='http://127.0.0.1:3004';
const evidence='/tmp/nogueira-drive-evidence';await mkdir(evidence,{recursive:true});
// WebKit correctly requires HTTPS for Secure session cookies, including local tests.
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-keyout',evidence+'/test.key','-out',evidence+'/test.crt'],{stdio:'ignore'});
const browserBase='https://localhost:3444';
const tls=https.createServer({key:await readFile(evidence+'/test.key'),cert:await readFile(evidence+'/test.crt')},(request,response)=>{
  const upstream=httpRequest(base+request.url,{method:request.method,headers:request.headers},res=>{response.writeHead(res.statusCode,res.headers);res.pipe(response);});
  upstream.on('error',()=>{response.writeHead(502);response.end();});request.pipe(upstream);
});
await new Promise(resolve=>tls.listen(3444,'127.0.0.1',resolve));
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
const owners=['00000000-0000-4000-8000-000000000081','00000000-0000-4000-8000-000000000082','00000000-0000-4000-8000-000000000083','00000000-0000-4000-8000-000000000084'];
const password='private-drive-fixture-only';
const checks=[];const pass=name=>{checks.push(name);console.log(`PASS: ${name}`);};
let app,log='',browser;
async function start(){
  app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3004'],{env:{...process.env,NEXT_DIST_DIR:'.next-verification',AUTH_ALLOWED_ORIGINS:base+','+browserBase,DRIVE_STORAGE_ROOT:storage},stdio:['ignore','pipe','pipe']});
  app.stdout.on('data',v=>log+=v);app.stderr.on('data',v=>log+=v);
  for(let i=0;i<60;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await delay(250);}throw new Error('Test app not ready');
}
async function stop(){if(app){const ended=new Promise(r=>app.once('exit',r));app.kill('SIGTERM');await ended;app=null;}}
async function call(route,cookie='',body,origin=base){return fetch(base+route,{method:body===undefined?'GET':'POST',redirect:'manual',headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{origin,'content-type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});}
async function checked(response,status=200){assert.equal(response.status,status,await response.clone().text());return response.json();}
async function login(index){const response=await call('/api/auth/login','',{email:`drive-${index}@example.invalid`,password,portal:'admin'});await checked(response);return response.headers.get('set-cookie').split(';')[0];}
const entries=(items)=>items.map(({id,kind})=>({id,kind}));
let cookie,other,denied,restricted;
const action=(action,items=[],extra={},session=cookie)=>call('/api/internal/files',session,{action,items:entries(items),...extra});
const folder=async(name,parentId=null)=>({...await checked(await action('folder',[],{name,parentId})),kind:'folder',name});
const list=async(params='',session=cookie)=>checked(await call('/api/internal/files'+params,session));
async function upload(name,body,type='text/plain',parent='',session=cookie){return fetch(base+'/api/internal/files/upload?'+new URLSearchParams({name,folder:parent}),{method:'PUT',headers:{cookie:session,origin:base,'content-type':type},body});}
async function uploaded(name,body,type='text/plain',parent=''){return {...await checked(await upload(name,body,type,parent),201),kind:'file',name};}
const content=(id,session=cookie,options={})=>fetch(`${base}/api/internal/files/${id}/content`,{headers:{cookie:session,...options.headers},...options});
try {
  await db.query('delete from auth_rate_limits');
  for(let i=0;i<owners.length;i++){
    await db.query(`insert into app_users(id,email,full_name,role,password_hash,email_verified_at) values($1,$2,$3,'doctor',crypt($4,gen_salt('bf',4)),now())
      on conflict(id) do update set is_active=true,must_change_password=false,password_hash=excluded.password_hash`,[owners[i],`drive-${i}@example.invalid`,['Doutor · Teste Arquivos','Outro proprietário · Teste','Operador · Teste','MASTER sem armazenamento · Teste'][i],password]);
    await db.query('insert into user_roles(user_id,role_id) values($1,$2) on conflict do nothing',[owners[i],i===2?'CRM_OPERATOR':'MASTER']);
  }
  await db.query('update app_users set drive_quota_bytes=null,drive_enabled=(id=any($2::uuid[])) where id=any($1::uuid[])',[owners,[owners[0],owners[1],owners[3]]]);
  await start();cookie=await login(0);other=await login(1);denied=await login(2);restricted=await login(3);
  // Clean only deterministic fixture owners from a previous isolated run.
  for(const session of [cookie,other,restricted]) {
    for(const view of ['files','trash']){let data=await list(view==='trash'?'?view=trash':'',session);while(data.items.length){await checked(await action(view==='trash'?'purge':'trash',data.items,{},session));data=await list(view==='trash'?'?view=trash':'',session);}}
  }
  assert.equal((await call('/api/internal/files')).status,401);
  assert.equal((await call('/arquivos')).status,307);
  assert.equal((await call('/api/internal/files',denied)).status,403);
  assert.equal((await call('/api/internal/files',cookie,{action:'folder',name:'bad'},'https://evil.invalid')).status,403);
  pass('real local login, anonymous/CRM rejection and CSRF');
  const retained=await checked(await upload('preserved.txt','Preserved test file','text/plain','',restricted),201);
  await db.query('update app_users set drive_enabled=false where id=$1',[owners[3]]);
  assert.equal((await call('/api/internal/files',restricted)).status,403);
  assert.equal((await call('/api/internal/files',restricted,{action:'folder',name:'Forbidden'})).status,403);
  assert.equal((await upload('blocked.txt','x','text/plain','',restricted)).status,403);
  assert.equal((await content(retained.id,restricted)).status,403);
  assert.equal((await content(retained.id,restricted,{method:'HEAD'})).status,403);
  const restrictedPage=await call('/arquivos',restricted);
  assert.equal(restrictedPage.status,307);assert.equal(restrictedPage.headers.get('location'),'/sem-acesso');
  assert.ok(!(await (await call('/dashboard',restricted)).text()).includes('href="/arquivos"'));
  const overview=await checked(await call('/api/internal/governance?q=drive-3',cookie));
  assert.ok(!overview.users.find(u=>u.id===owners[3]).permissions.includes('files.access'));
  assert.equal((await db.query('select count(*)::int total from drive_files where id=$1',[retained.id])).rows[0].total,1);
  await db.query('update app_users set drive_enabled=true where id=$1',[owners[3]]);
  assert.equal(await (await content(retained.id,restricted)).text(),'Preserved test file','Revocation preserves existing bytes');
  await checked(await action('trash',[{id:retained.id,kind:'file'}],{},restricted));
  await checked(await action('purge',[{id:retained.id,kind:'file'}],{},restricted));
  // Revoke after admission, while the request is still streaming its body.
  const incomingBefore=new Set(await readdir(storage+'/incoming'));
  let inFlight;
  const inFlightStatus=new Promise((resolve,reject)=>{
    inFlight=httpRequest(base+'/api/internal/files/upload?name=revoked-during-upload.txt',
      {method:'PUT',headers:{cookie:restricted,origin:base,'content-type':'text/plain'}},res=>{res.resume();resolve(res.statusCode);});
    inFlight.on('error',reject);inFlight.write('a');
  });
  try {
    let admitted=false;
    for(let i=0;i<100;i++) {if((await readdir(storage+'/incoming')).some(name=>!incomingBefore.has(name))){admitted=true;break;}await delay(20);}
    assert.ok(admitted,'Upload entered the storage receiver');
    await db.query('update app_users set drive_enabled=false where id=$1',[owners[3]]);
    inFlight.end('b');assert.equal(await inFlightStatus,403);
  } finally {inFlight.destroy();}
  assert.equal((await db.query('select count(*)::int total from drive_files where owner_id=$1',[owners[3]])).rows[0].total,0);
  pass('disabled MASTER storage: hidden navigation, denied page/APIs, preserved files and in-flight revocation');
  const documents=await folder('Documentos'),year=await folder('2026',documents.id),destination=await folder('Administrativo');
  assert.equal((await action('folder',[],{name:'Documentos'})).status,409);
  const breadcrumbs=(await list('?folder='+year.id)).breadcrumbs;assert.deepEqual(breadcrumbs.map(c=>c.name),['Documentos','2026']);
  const text=await uploaded('Anotações.txt','Documento privado de teste. Olá!','text/plain',year.id);
  const duplicate=await uploaded('Anotações.txt','Outra versão, sem sobrescrever.','text/plain',year.id);assert.notEqual(text.id,duplicate.id);
  const capacity=await list(),disk=await statfs(storage);
  assert.equal(capacity.usage.bytes,Buffer.byteLength('Documento privado de teste. Olá!Outra versão, sem sobrescrever.'));
  assert.equal(capacity.storage.totalBytes,disk.blocks*disk.bsize);
  assert.ok(Math.abs(capacity.storage.freeBytes-disk.bavail*disk.bsize)<64*1024**2,'Free space reflects the actual storage filesystem');
  assert.equal(capacity.storage.availableBytes,capacity.quota-capacity.usage.bytes);
  assert.equal((await list('?q=nonexistent')).usage.bytes,capacity.usage.bytes,'Usage is account-wide, not filtered');
  assert.equal((await list('',other)).usage.bytes,0,'Usage is isolated by owner');
  pass('storage capacity reflects actual disk, account quota and owner-wide usage');
  pass('folders/subfolders, breadcrumb, duplicate conflicts and non-overwriting upload');
  assert.equal(await (await content(text.id)).text(),'Documento privado de teste. Olá!');
  const preview=await fetch(`${base}/api/internal/files/${text.id}/content?preview=1`,{headers:{cookie}});
  assert.equal(preview.status,200);assert.match(preview.headers.get('content-type'),/^text\/plain/);assert.match(preview.headers.get('content-security-policy'),/sandbox/);assert.match(preview.headers.get('cache-control'),/no-store/);
  const range=await content(text.id,cookie,{headers:{cookie,range:'bytes=0-8'}});assert.equal(range.status,206);assert.equal(await range.text(),'Documento');
  assert.equal((await content(text.id,cookie,{headers:{cookie,range:'bytes=900000-'}})).status,416);
  assert.equal((await content(text.id,cookie,{method:'HEAD'})).status,200);
  const fileRow=(await db.query('select stored_name,checksum,size from drive_files where id=$1',[text.id])).rows[0];
  assert.equal(fileRow.checksum,createHash('sha256').update('Documento privado de teste. Olá!').digest('hex'));
  const physical=`${storage}/objects/${fileRow.stored_name.slice(0,2)}/${fileRow.stored_name}`;
  assert.equal((await stat(physical)).mode&0o777,0o600);
  pass('authenticated download/TXT preview, SHA-256, file permissions, HEAD and media Range');
  for(const operation of ['rename','move','trash','favorite'])assert.equal((await action(operation,[text],{name:'Forbidden',favorite:true},other)).status,404);
  assert.equal((await content(text.id,other)).status,404);assert.equal((await content(text.id,'')).status,401);
  assert.equal((await call('/api/internal/files?folder='+documents.id,other)).status,404);
  assert.equal((await upload('forbidden.txt','x','text/plain',documents.id,other)).status,404);
  for(const name of ['../outside.txt','x\\outside.txt','a\u202eexe.txt'])assert.equal((await upload(name,'x')).status,400);
  assert.equal((await upload('spoof.pdf','<script>evil</script>','application/pdf')).status,400);
  const active=await uploaded('active.html','<script>alert(1)</script>','text/html');
  const activePreview=await fetch(`${base}/api/internal/files/${active.id}/content?preview=1`,{headers:{cookie}});assert.match(activePreview.headers.get('content-disposition'),/^attachment/);
  assert.equal((await call('/storage/'+fileRow.stored_name)).status,404);
  pass('owner isolation across MASTER accounts, traversal, malicious filenames, forged MIME and direct URLs');
  const largeStatus=await new Promise((resolve,reject)=>{const req=httpRequest(`${base}/api/internal/files/upload?name=large.zip`,{method:'PUT',headers:{cookie,origin:base,'Content-Type':'application/zip','Content-Length':251*1024**2}},res=>{res.resume();resolve(res.statusCode);req.destroy();});req.on('error',e=>{if(e.code!=='ECONNRESET')reject(e);});req.write('x');});assert.equal(largeStatus,413);
  // Simulate aggregate usage in the isolated database without allocating gigabytes.
  await db.query('update drive_files set size=$2 where id=$1',[active.id,12*1024**3]);
  const aboveOldQuota=await uploaded('above-old-quota.txt','Quota ampliada.');
  assert.ok((await list()).usage.bytes>10*1024**3,'Uploads remain available above the former 10 GB limit');
  await checked(await action('trash',[aboveOldQuota]));await checked(await action('purge',[aboveOldQuota]));
  await db.query('update drive_files set size=$2 where id=$1',[active.id,50*1024**3]);
  assert.equal((await list()).storage.availableBytes,0,'An over-quota account never shows negative availability');
  assert.equal((await upload('over-quota.txt','x')).status,413);
  const setQuota=(gib,apply=false,owner=owners[0])=>JSON.parse(execFileSync(process.execPath,
    ['scripts/set-drive-quota.mjs','--owner',owner,'--gib',String(gib),...(apply?['--apply']:[])],
    {env:{...process.env,DRIVE_STORAGE_ROOT:storage},encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  assert.equal(setQuota(70).applied,false);
  assert.equal((await list()).quota,50*1024**3,'Preview does not change the account');
  assert.equal(setQuota(70,true).changed,true);
  assert.equal(setQuota(70,true).changed,false,'Repeated application is idempotent');
  assert.equal((await list()).quota,70*1024**3);
  assert.equal((await list('',other)).quota,50*1024**3,'Other accounts keep the default quota');
  assert.equal((await list('?owner='+owners[0],other)).quota,50*1024**3,'Client cannot select another account quota');
  assert.throws(()=>setQuota(99999,true),'Cannot grant a quota larger than physical capacity');
  assert.throws(()=>setQuota(70,true,owners[2]),'A quota change does not grant access to Files');
  assert.throws(()=>setQuota(70,true,owners[3]),'A MASTER quota change cannot enable the storage service');
  const expanded=await uploaded('above-default-quota.txt','Quota exclusiva da conta.');
  await checked(await action('trash',[expanded]));await checked(await action('purge',[expanded]));
  const otherBytes=(await list()).usage.bytes-50*1024**3;
  await db.query('update drive_files set size=$2 where id=$1',[active.id,70*1024**3-otherBytes-1]);
  assert.equal((await list()).storage.availableBytes,1);
  // Admission passes with one byte left; final commit must reject a two-byte file.
  assert.equal((await upload('cross-account-quota.txt','ab')).status,413);
  assert.equal((await list()).usage.bytes,70*1024**3-1,'Rejected uploads do not consume the quota');
  await db.query('update drive_files set size=$2 where id=$1',[active.id,70*1024**3]);
  assert.equal((await list()).storage.availableBytes,0);
  assert.equal((await upload('over-account-quota.txt','x')).status,413);
  assert.equal((await db.query("select count(*)::int total from audit_logs where action='files.quota.update' and entity_id=$1 and after_data->>'quota_bytes'=$2",[owners[0],String(70*1024**3)])).rows[0].total>0,true);
  await db.query('update app_users set drive_quota_bytes=null where id=$1',[owners[0]]);
  await db.query('update drive_files set size=$2 where id=$1',[active.id,29]);
  pass('individual quota preview, application, isolation, disk guard and upload commit enforcement');
  // Restore actual fixture size to make backup checksum validation meaningful.
  await db.query('update drive_files set size=$2 where id=$1',[active.id,Buffer.byteLength('<script>alert(1)</script>')]);
  pass('upload size ceiling and owner quota enforcement');
  await checked(await action('rename',[text],{name:'Consulta.txt'}));
  await checked(await action('move',[text],{parentId:destination.id}));
  assert.equal((await list('?folder='+destination.id)).items[0].name,'Consulta.txt');
  assert.equal((await action('move',[documents],{parentId:year.id})).status,400);
  await checked(await action('favorite',[text],{favorite:true}));assert.equal((await list('?view=favorites')).items[0].id,text.id);
  assert.equal((await list('?q=consulta')).items[0].id,text.id);assert.ok((await list('?view=recent&sort=date&direction=desc')).items.length);
  await checked(await action('move',[year],{parentId:destination.id}));
  pass('rename, move file/folder, cycle prevention, global search, sorting, recent and favorites');
  const usedBeforeTrash=(await list()).usage.bytes;
  await checked(await action('trash',[duplicate]));await checked(await action('trash',[destination]));
  assert.equal((await list()).usage.bytes,usedBeforeTrash,'Trash still consumes storage');
  assert.equal((await content(text.id)).status,404);
  assert.equal((await action('restore',[destination],{},other)).status,404);
  assert.equal((await action('purge',[destination],{},other)).status,404);
  await checked(await action('restore',[destination]));
  assert.equal((await content(text.id)).status,200);assert.equal((await content(duplicate.id)).status,404);
  await checked(await action('trash',[destination]));await checked(await action('restore',[duplicate]));
  assert.ok((await list()).items.some(i=>i.id===duplicate.id));
  await checked(await action('purge',[destination]));assert.equal((await content(text.id)).status,404);
  assert.equal((await list()).usage.bytes,usedBeforeTrash-Number(fileRow.size),'Permanent deletion releases account capacity');
  await assert.rejects(stat(physical),{code:'ENOENT'});
  assert.equal((await action('purge',[documents])).status,409);
  pass('recursive trash, independent delete batches, root fallback restoration and physical permanent deletion');
  const persisted=await uploaded('Persistente.txt','Persiste entre reinícios.');await stop();await start();assert.equal(await(await content(persisted.id)).text(),'Persiste entre reinícios.');
  pass('storage and metadata survive application restart');
  // Realistic fixtures for desktop/mobile UI. No production documents are accessed.
  const pdf=Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
  await uploaded('Relatório mensal.pdf',pdf,'application/pdf');
  await uploaded('Planilha administrativa.xlsx','fixture','application/octet-stream');
  await uploaded('Contrato de serviços.docx','fixture','application/octet-stream');
  await uploaded('Foto da clínica.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1kAAAAASUVORK5CYII=','base64'),'image/png');
  await folder('Financeiro');await folder('Materiais da clínica');
  const revoked=cookie;await db.query('update app_users set session_version=session_version+1 where id=$1',[owners[0]]);assert.equal((await call('/api/internal/files',revoked)).status,401);cookie=await login(0);
  const audit=(await db.query("select action,metadata,before_data,after_data from audit_logs where actor_user_id=$1 and action like 'files.%'",[owners[0]])).rows;
  assert.ok(audit.length>15);assert.ok(!JSON.stringify(audit).includes('Documento privado'));assert.ok(!JSON.stringify(audit).includes('Consulta.txt'));
  pass('session revocation and audit without filenames or document contents');
  if(process.env.PLAYWRIGHT_MODULE){
    const pw=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
    for(const engine of (process.env.DRIVE_BROWSER_ENGINES||'chromium').split(',')) {
      browser=await pw[engine].launch({headless:true,...(engine==='webkit'&&process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE}:{})});const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,ignoreHTTPSErrors:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(browserBase+'/acesso');await page.getByLabel('E-mail de acesso').fill('drive-0@example.invalid');await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();await page.waitForURL('**/dashboard');
      await page.getByRole('link',{name:'Arquivos',exact:true}).click();await page.getByRole('heading',{name:'Meus Arquivos',exact:true}).waitFor();await page.getByRole('button',{name:'Documentos Pasta',exact:true}).waitFor();
      const meter=page.getByRole('meter',{name:'Espaço usado na conta'});await meter.waitFor();
      const usedBeforeUpload=Number(await meter.getAttribute('aria-valuenow'));
      assert.equal(Number(await meter.getAttribute('aria-valuemax')),50*1024**3);
      await page.getByText(/^VPS: .* livres de /).waitFor();
      await page.screenshot({path:`${evidence}/${engine}-desktop.png`,fullPage:true});
      await page.getByRole('button',{name:'Nova pasta',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Pasta navegador '+engine);await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
      await page.getByLabel('Selecionar arquivos para upload').setInputFiles([{name:'Browser upload.txt',mimeType:'text/plain',buffer:Buffer.from('Browser upload fixture')},{name:'Segundo upload.csv',mimeType:'text/csv',buffer:Buffer.from('nome,valor\nfixture,1')}]);
      await page.getByRole('status').filter({hasText:'2 arquivos enviados.'}).waitFor();
      await page.waitForFunction(previous=>Number(document.querySelector('[role="meter"]').getAttribute('aria-valuenow'))>previous,usedBeforeUpload);
      await page.getByRole('button',{name:/^Browser upload.txt TXT/}).click();await page.getByRole('dialog').waitFor();await page.frameLocator('iframe').locator('body').getByText('Browser upload fixture').waitFor();
      const downloaded=page.waitForEvent('download');await page.getByRole('link',{name:'Download',exact:true}).click();assert.equal((await downloaded).suggestedFilename(),'Browser upload.txt');await page.getByRole('button',{name:'Fechar janela'}).click();
      await page.getByRole('button',{name:'Visualização em lista'}).click();await page.screenshot({path:`evidence/${engine}-list.png`.replace('evidence/',evidence+'/'),fullPage:true});
      await page.getByLabel('Buscar arquivos e pastas').fill('Browser upload');await page.getByRole('button',{name:/^Browser upload.txt TXT/}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('.drive-item').length===1);assert.equal(await page.locator('.drive-item').count(),1);await page.getByLabel('Buscar arquivos e pastas').fill('');
      await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Visualização em grade'}).click();await page.getByRole('button',{name:'Documentos Pasta',exact:true}).waitFor();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile layout overflow');await page.screenshot({path:`${evidence}/${engine}-mobile.png`,fullPage:true});
      const meterBounds=await meter.boundingBox();assert.ok(meterBounds.x>=0&&meterBounds.x+meterBounds.width<=390,'Storage meter fits mobile viewport');
      await page.getByRole('button',{name:/^Browser upload.txt TXT/}).click();await page.getByRole('dialog').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${evidence}/${engine}-preview-mobile.png`,fullPage:true});await page.getByRole('button',{name:'Fechar janela'}).click();
      await page.getByLabel('Selecionar Browser upload.txt',{exact:true}).check();await page.getByRole('button',{name:'Excluir',exact:true}).click();await page.getByRole('button',{name:'Mover para lixeira',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('button',{name:'Lixeira',exact:true}).click();
      await page.getByLabel('Selecionar Browser upload.txt',{exact:true}).check();await page.getByRole('button',{name:'Restaurar',exact:true}).click();await page.getByRole('status').filter({hasText:'Itens restaurados.'}).waitFor();
      // Drag/drop through DataTransfer, including WebKit when available.
      await page.getByRole('button',{name:'Todos os arquivos',exact:true}).click();await page.getByRole('button',{name:'Nova pasta',exact:true}).waitFor();
      await page.locator('.drive').evaluate(el=>{const dt=new DataTransfer();dt.items.add(new File(['drag fixture'],'Arrastado.txt',{type:'text/plain'}));el.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));});await page.getByRole('status').filter({hasText:'1 arquivo enviado.'}).waitFor();
      assert.deepEqual(errors,[]);await browser.close();browser=null;
      const browserFiles=(await list()).items.filter(i=>['Browser upload.txt','Segundo upload.csv','Arrastado.txt'].includes(i.name));
      await checked(await action('trash',browserFiles));await checked(await action('purge',browserFiles));
      pass(`${engine}: real login, menu, create folder, multiple upload, TXT preview/download, search, grid/list, 390px mobile, trash/restore and drag/drop`);
    }
  }
  await writeFile(evidence+'/results.json',JSON.stringify({checks,storage},null,2));
  assert.equal((await readdir(storage+'/incoming')).length,0,'No incomplete uploads left');
  pass('no temporary upload residue');
} finally {
  await browser?.close();tls.closeAllConnections();await new Promise(resolve=>tls.close(resolve));await stop();await db.end();await writeFile(evidence+'/server.log',log);
}
