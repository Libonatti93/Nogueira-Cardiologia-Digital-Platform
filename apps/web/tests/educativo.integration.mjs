import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import sharp from 'sharp';
import * as CFB from 'cfb';

if(!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test'))throw Error('Isolated database required');
if(!process.env.PLAYWRIGHT_MODULE)throw Error('PLAYWRIGHT_MODULE required');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
const base='http://127.0.0.1:3005',directory='/tmp/nogueira-educativo-evidence',storage='/tmp/nogueira-drive-integration';
const marker=`educativo-${Date.now()}`,master=randomUUID(),operator=randomUUID(),patient=randomUUID(),password='isolated-educativo-password';
const results=[],errors=[];const pass=message=>{results.push(message);console.log('PASS: '+message);};
let app,browser,log='',postId,secondId,coverId,pdfId,pptxId,masterCookie='',accessCookie='',publishedDate;
const request=(url,{method='GET',cookie='',body,headers={}}={})=>fetch(base+url,{method,redirect:'manual',headers:{...(method!=='GET'?{origin:base}:{}),...(cookie?{cookie}:{}),...(body!==undefined&&!Buffer.isBuffer(body)?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});
async function json(url,options={}){const r=await request(url,options),v=await r.json();assert.ok(r.ok,`${url}: ${r.status} ${JSON.stringify(v)}`);return v;}
async function waitFor(check){for(let n=0;n<100;n++){if(await check())return;await delay(150);}throw Error('Condition timed out');}
const save=(post,action='save')=>json(`/api/internal/educativo/${post.id}`,{method:'PUT',cookie:masterCookie,body:{...post,action}});
try {
  await mkdir(directory,{recursive:true});
  for(const [id,role,label] of [[master,'doctor','Master'],[operator,'secretary','Operador'],[patient,'patient','Paciente']])await db.query(`insert into app_users(id,email,full_name,role,password_hash,email_verified_at) values($1,$2,$3,$4,crypt($5,gen_salt('bf',4)),now())`,[id,`${marker}-${label}@example.invalid`,label+' fictício',role,password]);
  await db.query("insert into user_roles(user_id,role_id) values($1,'MASTER'),($2,'CRM_OPERATOR')",[master,operator]);
  await db.query("delete from auth_rate_limits where expires_at<now()");
  const png=await sharp({create:{width:640,height:400,channels:3,background:'#14508b'}}).png().toBuffer();
  const jpeg=await sharp(png).jpeg().toBuffer();await writeFile(directory+'/capa.png',png);await writeFile(directory+'/imagem.jpg',jpeg);
  execFileSync('python3',['-c',String.raw`
import sys,zipfile
from pathlib import Path
root=Path(sys.argv[1])
objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',b'<< /Length 50 >>\nstream\nBT /F1 18 Tf 50 700 Td (Aula de teste) Tj ET\nendstream',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
objects[3]=objects[3].replace(b'\\n',b'\n');data=b'%PDF-1.4\n';offsets=[]
for i,obj in enumerate(objects):offsets.append(len(data));data+=str(i+1).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
xref=len(data);data+=b'xref\n0 6\n0000000000 65535 f \n'+b''.join(f'{n:010d} 00000 n \n'.encode() for n in offsets)+b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF\n';(root/'aula.pdf').write_bytes(data)
with zipfile.ZipFile(root/'aula.pptx','w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>')
 z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>')
 z.writestr('ppt/presentation.xml','<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>')
 z.writestr('ppt/_rels/presentation.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>')
 z.writestr('ppt/slides/slide1.xml','<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld></p:sld>')
 z.writestr('docProps/thumbnail.jpeg',(root/'imagem.jpg').read_bytes())
`,directory]);
  app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3005'],{env:{...process.env,NEXT_DIST_DIR:'.next-educativo',AUTH_ALLOWED_ORIGINS:base,DRIVE_STORAGE_ROOT:storage,TURNSTILE_SECRET_KEY:''},stdio:['ignore','pipe','pipe']});
  app.stdout.on('data',c=>log+=c);app.stderr.on('data',c=>log+=c);
  await waitFor(async()=>{try{return(await fetch(base+'/api/health')).ok;}catch{return false;}});
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/acesso');await page.getByLabel('E-mail de acesso').fill(`${marker}-Master@example.invalid`);await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();await page.waitForURL('**/crm');
  masterCookie=(await context.cookies()).map(c=>`${c.name}=${c.value}`).join('; ');
  assert.equal((await request('/api/internal/educativo')).status,401);
  const op=await request('/api/auth/login',{method:'POST',body:{email:`${marker}-Operador@example.invalid`,password,portal:'admin'}});assert.equal(op.status,200);const opCookie=op.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/internal/educativo',{cookie:opCookie})).status,403);
  assert.equal((await request('/api/internal/educativo',{method:'POST',cookie:masterCookie,headers:{origin:'https://evil.invalid'}})).status,403);
  pass('MASTER login, unauthorized and operator denial, CSRF enforcement');

  await page.goto(base+'/educativo');await page.getByRole('button',{name:'+ Novo conteúdo',exact:true}).click();await page.waitForURL(/\/educativo\/[a-f0-9-]{36}$/);postId=page.url().split('/').at(-1);
  await page.getByLabel('Título',{exact:true}).fill(`Aula de insuficiência cardíaca ${marker}`);await page.getByRole('button',{name:'Gerar pelo título'}).click();await page.getByLabel('URL / Slug').fill(marker);
  await page.getByLabel('Resumo',{exact:true}).fill('Resumo público da aula sobre insuficiência cardíaca e orientações do professor.');
  await page.getByLabel('Tipo de conteúdo').selectOption('CLASS');
  const editor=page.getByRole('textbox',{name:'Conteúdo do artigo',exact:true});await editor.fill('Introdução pública para conhecer esta aula.');await editor.press('Enter');
  await page.getByRole('button',{name:'Negrito',exact:true}).click();await page.keyboard.type('CONTEUDO_RESTRITO_FIXTURE');await page.getByRole('button',{name:'Negrito',exact:true}).click();await page.keyboard.type(' e ');
  await page.getByRole('button',{name:'Itálico',exact:true}).click();await page.keyboard.type('explicação em destaque');await page.getByRole('button',{name:'Itálico',exact:true}).click();await page.getByRole('button',{name:'Emoji 💙',exact:true}).click();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'H2',exact:true}).click();await page.keyboard.type('Insuficiência cardíaca: conceitos');await page.keyboard.press('Enter');await page.keyboard.type('Informações de apoio e referências.');
  page.once('dialog',dialog=>dialog.accept('/blog'));await page.getByRole('button',{name:'Link',exact:true}).click();await page.keyboard.type('Fonte interna');
  await page.getByLabel('Enviar ou substituir capa').setInputFiles(directory+'/capa.png');await waitFor(async()=>!await page.getByText('Enviando arquivo…',{exact:true}).count());
  await page.getByLabel('ALT da capa',{exact:true}).fill('Imagem educativa de insuficiência cardíaca');await page.getByLabel('Legenda da capa',{exact:true}).fill('Capa da aula');
  await page.getByRole('button',{name:'Imagem',exact:true}).click();await page.getByLabel('ALT da imagem',{exact:true}).fill('Imagem de apoio à aula');await page.getByLabel('Legenda da imagem',{exact:true}).fill('Legenda dentro do texto');await page.getByLabel('Arquivo da imagem no texto').setInputFiles(directory+'/imagem.jpg');await editor.locator('figure img').waitFor();
  await page.getByLabel('Adicionar material da aula',{exact:true}).setInputFiles([directory+'/aula.pdf',directory+'/aula.pptx']);await page.getByText(/aula.pptx · application/).waitFor();
  await page.getByLabel('Palavra-chave principal',{exact:true}).fill('insuficiência cardíaca');await page.getByLabel('Título SEO',{exact:true}).fill('Insuficiência cardíaca: aula do professor | Nogueira');await page.getByLabel('Meta description',{exact:true}).fill('Conheça esta aula de insuficiência cardíaca do professor, com material educativo, explicações e referências para acompanhar seus estudos.');
  await page.getByLabel('Tags',{exact:true}).fill('insuficiência cardíaca, prevenção');
  await page.getByRole('status').filter({hasText:/Salvo às/}).waitFor();
  await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();await page.getByRole('status').filter({hasText:/Salvo às/}).waitFor();
  let post=await json('/api/internal/educativo/'+postId,{cookie:masterCookie});
  assert.equal(post.status,'draft');assert.match(post.content_html,/<strong>CONTEUDO_RESTRITO_FIXTURE<\/strong>/);assert.match(post.content_html,/<em>explicação em destaque<\/em>/);assert.match(post.content_html,/💙/);assert.match(post.content_html,/<h2[^>]*>Insuficiência cardíaca/);assert.match(post.content_html,/href="\/blog"/);assert.match(post.content_html,/alt="Imagem de apoio à aula"/);assert.match(post.content_html,/<figcaption>Legenda dentro do texto/);
  pdfId=post.materials.find(m=>m.type==='PDF').id;pptxId=post.materials.find(m=>m.type==='POWERPOINT').id;coverId=post.materials.find(m=>m.purpose==='COVER').id;
  assert.equal(post.materials.find(m=>m.id===pptxId).slide_count,1);
  assert.equal((await request('/blog/'+marker)).status,404);
  for(const id of [pdfId,pptxId,coverId])assert.equal((await request('/api/educativo/materials/'+id)).status,404);
  await page.screenshot({path:directory+'/editor-desktop.png',fullPage:true});
  const [preview]=await Promise.all([page.waitForEvent('popup'),page.getByRole('button',{name:'Pré-visualizar',exact:true}).click()]);await preview.waitForURL('**/preview');await preview.getByRole('heading',{name:`Aula de insuficiência cardíaca ${marker}`}).waitFor();assert.ok((await preview.content()).includes('CONTEUDO_RESTRITO_FIXTURE'));
  await preview.getByRole('button',{name:'Visualizar aula',exact:true}).click();await preview.getByTitle('Visualização de aula.pdf').waitFor();assert.equal((await preview.locator('iframe').getAttribute('src')).split('#')[0],'/api/educativo/materials/'+pdfId);
  assert.match(await preview.locator('img').last().getAttribute('src'),/thumbnail=1/);
  await preview.screenshot({path:directory+'/preview-desktop.png',fullPage:true});await preview.close();
  assert.match(await page.getByLabel('Assistente de SEO').innerText(),/SEO: \d+\/100/);
  await page.reload();await editor.waitFor();assert.match(await editor.innerHTML(),/CONTEUDO_RESTRITO_FIXTURE/);assert.equal((await editor.innerHTML()).match(/Legenda dentro do texto/g)?.length,1);
  pass('visual creation, bold, italic, emoji, H2, link, JPEG/PNG with ALT/caption, multiple PDF/PPTX uploads, autosave, draft edit, Google/SEO and private article/PDF/PowerPoint previews');

  await page.getByRole('button',{name:'Publicar',exact:true}).click();await page.getByRole('button',{name:'Confirmar publicação',exact:true}).click();await page.getByRole('status').filter({hasText:'Publicado no blog'}).waitFor();
  post=await json('/api/internal/educativo/'+postId,{cookie:masterCookie});publishedDate=post.published_at;
  const anon=await request('/blog/'+marker);assert.equal(anon.status,200);const anonymousHtml=await anon.text();assert.ok(anonymousHtml.includes('Introdução pública'));assert.ok(anonymousHtml.includes('Quero acessar o conteúdo'));assert.ok(!anonymousHtml.includes('CONTEUDO_RESTRITO_FIXTURE'));assert.ok(!anonymousHtml.includes(pdfId));assert.match(anon.headers.get('cache-control'),/private|no-store/);
  const rsc=await request('/blog/'+marker+'?_rsc=fixture',{headers:{RSC:'1'}});assert.ok(!(await rsc.text()).includes('CONTEUDO_RESTRITO_FIXTURE'));
  for(const id of [pdfId,pptxId])for(const suffix of ['','?thumbnail=1','?download=1'])assert.equal((await request('/api/educativo/materials/'+id+suffix)).status,401);
  assert.equal((await request('/api/educativo/materials/'+pdfId,{method:'HEAD'})).status,401);assert.equal((await request('/api/educativo/materials/'+coverId)).status,200);
  assert.equal((await request('/api/leads',{method:'POST',body:{postSlug:marker,accessMode:'cached'}})).status,400);
  const publicContext=await browser.newContext({viewport:{width:390,height:844}}),visitor=await publicContext.newPage();visitor.on('pageerror',e=>errors.push(e.message));
  await visitor.goto(base+'/blog?busca='+marker);await visitor.getByRole('link',{name:'Acessar conteúdo',exact:true}).click();await visitor.getByRole('button',{name:'Quero acessar o conteúdo',exact:true}).waitFor();
  await visitor.screenshot({path:directory+'/gate-mobile.png',fullPage:true});
  assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await visitor.getByLabel('Nome completo',{exact:true}).fill('Aluno de teste');await visitor.getByLabel('E-mail',{exact:true}).fill(`${marker}-aluno@example.invalid`);await visitor.getByLabel('WhatsApp',{exact:true}).fill('11987654321');await visitor.getByRole('button',{name:'Quero acessar o conteúdo',exact:true}).click();
  await visitor.getByText('CONTEUDO_RESTRITO_FIXTURE',{exact:true}).waitFor();
  accessCookie=(await publicContext.cookies()).map(c=>`${c.name}=${c.value}`).join('; ');
  const educational=(await publicContext.cookies()).find(c=>c.name==='nogueira_educativo_session');assert.ok(educational.httpOnly);assert.equal(educational.sameSite,'Lax');
  assert.equal((await visitor.evaluate(()=>localStorage.getItem('nogueira_educativo_access'))),null);
  await visitor.reload();await visitor.getByText('CONTEUDO_RESTRITO_FIXTURE',{exact:true}).waitFor();assert.equal(await visitor.getByLabel('Nome completo',{exact:true}).count(),0);
  for(const id of [pdfId,pptxId]){const r=await request('/api/educativo/materials/'+id,{cookie:accessCookie});assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>100);const thumb=await request('/api/educativo/materials/'+id+'?thumbnail=1',{cookie:accessCookie});assert.equal(thumb.status,200);assert.equal(thumb.headers.get('content-type'),'image/png');}
  assert.equal((await request('/api/educativo/materials/'+pdfId,{cookie:accessCookie,headers:{range:'bytes=0-15'}})).status,206);
  assert.equal((await request('/api/educativo/materials/'+pdfId,{cookie:accessCookie,headers:{range:'bytes=999999999-'}})).status,416);
  assert.ok((await request('/api/educativo/materials/'+pptxId,{cookie:accessCookie})).headers.get('content-disposition').startsWith('attachment'));
  await visitor.getByRole('button',{name:'Visualizar aula',exact:true}).click();await visitor.getByTitle('Visualização de aula.pdf').waitFor();await visitor.screenshot({path:directory+'/article-mobile.png',fullPage:true});
  assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await visitor.setViewportSize({width:768,height:1024});await visitor.screenshot({path:directory+'/article-tablet.png',fullPage:true});assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal((await db.query('select count(*)::int n from educativo_leads where email=$1 and post_slug=$2',[`${marker}-aluno@example.invalid`,marker])).rows[0].n,1);
  pass('publish, /blog lesson cards, anonymous HTML/RSC protection, backend PDF/PPTX/thumbnail/HEAD denial, registration, durable HttpOnly access, authorized downloads/ranges and responsive mobile/tablet');

  const saved=await save({...post,content_html:post.content_html+'<p>UNPUBLISHED_SECRET</p>',seo_title:'Novo SEO em rascunho'});
  const publishedHtml=await(await request('/blog/'+marker,{cookie:accessCookie})).text();assert.ok(!publishedHtml.includes('UNPUBLISHED_SECRET'));assert.ok(publishedHtml.includes(post.seo_title));
  assert.equal((await request('/api/internal/educativo/'+postId,{method:'PUT',cookie:masterCookie,body:{...post,title:'Stale edit',action:'save'}})).status,409);
  assert.equal((await request('/api/internal/educativo/'+postId,{method:'PUT',cookie:masterCookie,body:{...saved,slug:marker+'-changed',action:'publish'}})).status,400);
  post=await save(saved,'publish');assert.equal(post.published_at,publishedDate);assert.ok((await(await request('/blog/'+marker,{cookie:accessCookie})).text()).includes('UNPUBLISHED_SECRET'));
  assert.ok((await(await request('/sitemap.xml')).text()).includes('/blog/'+marker));
  let second=await json('/api/internal/educativo',{method:'POST',cookie:masterCookie});secondId=second.id;second=await save({...second,title:'Segunda aula',slug:marker+'-second',excerpt:'Segundo conteúdo protegido',content_html:'<p>Introdução da segunda aula.</p><p>SEGREDO_DA_SEGUNDA_AULA</p>'},'publish');
  const r=await request('/api/leads',{method:'POST',cookie:accessCookie,body:{postSlug:second.slug}});assert.equal(r.status,200);
  assert.equal((await db.query('select count(distinct lead_id)::int n from educativo_leads where email=$1',[`${marker}-aluno@example.invalid`])).rows[0].n,1);
  const secondBody=await(await request('/blog/'+second.slug,{cookie:accessCookie})).text();assert.ok(secondBody.includes('SEGREDO_DA_SEGUNDA_AULA'));
  pass('published version isolated from drafts, revision conflict, immutable published slug/date, sitemap and existing CRM subscription reused across lessons');

  for(const [name,mime,bytes] of [['bad.exe','application/octet-stream',Buffer.from('MZ')],['bad.png','image/png',Buffer.from('MZ')],['wrong.pdf','image/png',png],['bad.pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation',Buffer.from('PKbad')],['../bad.pdf','application/pdf',await readFile(directory+'/aula.pdf')]]){
    assert.equal((await request(`/api/internal/educativo/${postId}/materials?${new URLSearchParams({name,purpose:'MATERIAL'})}`,{method:'PUT',cookie:masterCookie,body:bytes,headers:{'Content-Type':mime}})).status,400);
  }
  const large=Buffer.alloc(8*1024*1024+1);assert.equal((await request(`/api/internal/educativo/${postId}/materials?name=large.png&purpose=COVER`,{method:'PUT',cookie:masterCookie,body:large,headers:{'Content-Type':'image/png'}})).status,413);
  const cfb=CFB.utils.cfb_new();CFB.utils.cfb_add(cfb,'PowerPoint Document',Buffer.from([15,0,232,3,0,0,0,0]));
  const ppt=await json(`/api/internal/educativo/${postId}/materials?name=legacy.ppt&purpose=MATERIAL`,{method:'PUT',cookie:masterCookie,body:CFB.write(cfb,{type:'buffer'}),headers:{'Content-Type':'application/vnd.ms-powerpoint'}});assert.equal(ppt.type,'POWERPOINT');assert.equal(ppt.preview_kind,'cover');
  const replacement=await json(`/api/internal/educativo/${postId}/materials?name=replacement.pdf&purpose=MATERIAL`,{method:'PUT',cookie:masterCookie,body:await readFile(directory+'/aula.pdf'),headers:{'Content-Type':'application/pdf'}});
  post=await save({...post,attachment_ids:post.attachment_ids.filter(id=>id!==pdfId).concat(replacement.id)});
  assert.equal((await request('/api/educativo/materials/'+pdfId,{cookie:accessCookie})).status,200);assert.equal((await request('/api/educativo/materials/'+replacement.id,{cookie:accessCookie})).status,404);
  post=await save(post,'publish');assert.equal((await request('/api/educativo/materials/'+pdfId,{cookie:accessCookie})).status,404);assert.equal((await request('/api/educativo/materials/'+replacement.id,{cookie:accessCookie})).status,200);
  assert.equal((await request('/api/internal/educativo/'+secondId,{method:'PUT',cookie:masterCookie,body:{...second,attachment_ids:[replacement.id],action:'publish'}})).status,400);
  const audit=(await db.query("select action from audit_logs where entity_id=$1",[postId])).rows.map(r=>r.action);for(const action of ['content.create','content.update','content.publish','content.attachment.upload','content.attachment.remove'])assert.ok(audit.includes(action));
  post=await save(post,'archive');assert.equal((await request('/blog/'+marker)).status,404);assert.equal((await request('/api/educativo/materials/'+pptxId,{cookie:accessCookie})).status,404);
  post=await save(post,'publish');assert.equal(post.published_at,publishedDate);
  await db.query("update educativo_access_sessions set expires_at=now()-interval '1 second' where educational_lead_id in(select id from educativo_leads where email=$1)",[`${marker}-aluno@example.invalid`]);assert.equal((await request('/api/educativo/materials/'+pptxId,{cookie:accessCookie})).status,401);
  await page.goto(base+'/educativo/'+postId);await page.setViewportSize({width:390,height:844});await page.getByRole('textbox',{name:'Conteúdo do artigo'}).waitFor();await page.screenshot({path:directory+'/editor-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  pass('strict upload validation/size, PPT cover, staged replacement/removal, cross-post isolation, audit, archive/republish, expiry and mobile editor without JavaScript errors');
  execFileSync(process.execPath,['scripts/backup-drive.mjs'],{env:{...process.env,DRIVE_STORAGE_ROOT:storage,DRIVE_BACKUP_DIR:'/tmp/nogueira-drive-backups'},stdio:'inherit'});
  execFileSync(process.execPath,['tests/drive-backup.integration.mjs'],{env:process.env,stdio:'inherit'});
  pass('backup and restore include educational object bytes, metadata, sizes and checksums');
  await writeFile(directory+'/results.json',JSON.stringify({passed:results,screenshots:['editor-desktop.png','preview-desktop.png','gate-mobile.png','article-mobile.png','article-tablet.png','editor-mobile.png']},null,2));
} catch(error){await writeFile(directory+'/server.log',log);for(const c of browser?.contexts()||[])for(const p of c.pages())await p.screenshot({path:directory+'/failure-'+Date.now()+'.png',fullPage:true}).catch(()=>{});throw error;}
finally {
  await browser?.close();app?.kill('SIGTERM');
  const ids=[postId,secondId].filter(Boolean);
  if(ids.length){const objects=(await db.query('select stored_name from educativo_post_attachments where post_id=any($1::uuid[])',[ids])).rows;await db.query('delete from educativo_post_attachments where post_id=any($1::uuid[])',[ids]);await db.query('delete from educativo_posts where id=any($1::uuid[])',[ids]);for(const row of objects)await unlink(`${storage}/objects/${row.stored_name.slice(0,2)}/${row.stored_name}`).catch(()=>{});}
  await db.query('delete from educativo_leads where email=$1',[`${marker}-aluno@example.invalid`]);await db.query('delete from leads where email=$1',[`${marker}-aluno@example.invalid`]);
  await db.query('delete from app_users where id=any($1::uuid[])',[[master,operator,patient]]);await db.end();
}
