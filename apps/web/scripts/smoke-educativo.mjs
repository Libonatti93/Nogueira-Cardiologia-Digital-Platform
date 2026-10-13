import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import pg from 'pg';
import sharp from 'sharp';

nextEnv.loadEnvConfig(process.cwd());
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const base='https://painel.nogueiracardiologia.com.br',publicBase='https://www.nogueiracardiologia.com.br';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const token=user=>{const payload=Buffer.from(JSON.stringify({id:user.id,role:user.role,sessionVersion:user.session_version,audience:'internal',expiresAt:Date.now()+180000})).toString('base64url');return `nogueira_session=${payload}.${createHmac('sha256',process.env.AUTH_SECRET).update(payload).digest('base64url')}`;};
let id;const checks=[];
try {
  await db.connect();assert.equal((await db.query('select current_database() name')).rows[0].name,'nogueira_app');
  const before=(await db.query('select id,slug,status,published_at from educativo_posts order by id')).rows;
  assert.ok((await db.query("select 1 from schema_migrations where name='017_educativo_publishing.sql'")).rowCount);
  const user=(await db.query("select id,role,session_version from app_users where id='4d6a92f6-2a80-428e-84be-d2369de3c22f' and is_active")).rows[0];assert.ok(user);const cookie=token(user);
  const call=(route,method='GET',body,headers={})=>fetch(base+route,{method,redirect:'manual',headers:{cookie,...(method==='GET'?{}:{origin:base,'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  assert.equal((await fetch(base+'/api/internal/educativo')).status,401);
  const consolePage=await call('/educativo');assert.equal(consolePage.status,200);assert.ok((await consolePage.text()).includes('Central de publicação'));
  assert.equal((await call('/api/internal/educativo')).status,200);
  const created=await call('/api/internal/educativo','POST',{});assert.equal(created.status,201);let post=await created.json();id=post.id;
  post={...post,title:'Validação técnica temporária',slug:'validacao-privada-'+randomUUID(),excerpt:'Rascunho técnico privado para validar o deploy.',content_html:'<p><strong>Verificação</strong> privada.</p><script>alert(1)</script>'};
  const bytes=await sharp({create:{width:32,height:32,channels:3,background:'#14508b'}}).png().toBuffer();
  const uploaded=await call(`/api/internal/educativo/${id}/materials?name=validacao.png&purpose=INLINE`,'PUT',bytes,{'Content-Type':'image/png'});assert.equal(uploaded.status,201);const material=await uploaded.json();
  const saved=await call('/api/internal/educativo/'+id,'PUT',{...post,attachment_ids:[material.id],action:'save'});assert.equal(saved.status,200);post=await saved.json();assert.equal(post.status,'draft');assert.ok(!post.content_html.includes('<script'));
  assert.equal((await call(`/educativo/${id}/preview`)).status,200);
  const download=await call('/api/educativo/materials/'+material.id);assert.equal(download.status,200);assert.match(download.headers.get('cache-control'),/no-store/);
  assert.equal((await fetch(publicBase+'/api/educativo/materials/'+material.id)).status,404);
  assert.equal((await fetch(publicBase+'/blog/'+post.slug)).status,404);
  checks.push('MASTER console, API, private draft/image/preview, sanitization and anonymous draft isolation through public TLS');
  const current=(await db.query('select id,slug,status,published_at from educativo_posts where id<>$1 order by id',[id])).rows;
  assert.deepEqual(current,before);checks.push('existing posts, URLs, statuses and publication dates unchanged');
  const blog=await fetch(publicBase+'/blog');assert.equal(blog.status,200);const html=await blog.text();const slug=html.match(/href="\/blog\/([a-z0-9-]+)"/)?.[1];assert.ok(slug);assert.equal((await fetch(publicBase+'/blog/'+slug)).status,200);
  const sitemap=await fetch(publicBase+'/sitemap.xml');assert.equal(sitemap.status,200);checks.push('public library, historical article and sitemap');
  const evidence={sha,checks,at:new Date().toISOString(),credentials:'Existing identity, diagnostic session only; no password changes. Technical draft never published.'};
  await writeFile(`/var/log/nogueira-educativo-${sha}.json`,JSON.stringify(evidence,null,2)+'\n',{mode:0o600});console.log('EDUCATIVO PRODUCTION VERIFIED:',JSON.stringify(evidence));
} finally {
  if(id){
    await db.query('begin');
    try {
      await db.query("select pg_advisory_xact_lock_shared(hashtextextended('nogueira-drive-backup',0))");
      const rows=(await db.query('select stored_name from educativo_post_attachments where post_id=$1',[id])).rows;
      // Queue cleanup with the existing durable cleanup table before removing only this technical draft.
      for(const row of rows)await db.query('insert into drive_file_cleanup(stored_name,owner_id) values($1,$2) on conflict do nothing',[row.stored_name,'4d6a92f6-2a80-428e-84be-d2369de3c22f']);
      await db.query('delete from educativo_post_attachments where post_id=$1',[id]);await db.query("delete from educativo_posts where id=$1 and status='draft'",[id]);await db.query('commit');
      for(const row of rows){assert.match(row.stored_name,/^[a-f0-9-]{36}$/);await unlink(path.join(process.env.DRIVE_STORAGE_ROOT||'/opt/nogueira-drive','objects',row.stored_name.slice(0,2),row.stored_name)).catch(e=>{if(e.code!=='ENOENT')throw e;});await db.query('delete from drive_file_cleanup where stored_name=$1',[row.stored_name]);}
    } catch(e){await db.query('rollback');throw e;}
  }
  await db.end();
}
