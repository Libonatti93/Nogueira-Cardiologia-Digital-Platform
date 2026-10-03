import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, mkdir, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import pg from 'pg';

if(!process.env.DATABASE_URL?.split('?')[0].endsWith('/nogueira_integration_test'))throw new Error('Requires isolated database');
const directory='/tmp/nogueira-drive-backups';
const latest=(await readdir(directory)).filter(n=>/^\d{4}-/.test(n)).sort().at(-1);assert.ok(latest);
const backup=path.join(directory,latest),manifest=JSON.parse(await readFile(path.join(backup,'manifest.json'),'utf8'));
assert.equal(manifest.database,'nogueira_integration_test');
const name='nogueira_drive_restore_'+randomUUID().replaceAll('-','').slice(0,12),destination='/tmp/'+name;
let created=false,client;
try{
  await mkdir(destination,{mode:0o700});
  execFileSync('tar',['-xzf',path.join(backup,'objects.tar.gz'),'-C',destination]);
  for(const item of manifest.files){
    assert.match(item.stored_name,/^[a-f0-9-]{36}$/);
    const bytes=await readFile(path.join(destination,'objects',item.stored_name.slice(0,2),item.stored_name));
    assert.equal(bytes.length,Number(item.size));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.checksum);
  }
  execFileSync('docker',['exec','nogueira-postgres','createdb','-U','nogueira_admin','-O','nogueira_app_user',name]);created=true;
  const child=spawn('docker',['exec','-i','nogueira-postgres','psql','-U','nogueira_app_user','-d',name,'-v','ON_ERROR_STOP=1'],{stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',c=>error+=c);
  const completed=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Restore failed: '+error.slice(0,200))));});
  await Promise.all([pipeline(createReadStream(path.join(backup,'database.sql.gz')),createGunzip(),child.stdin),completed]);
  const url=new URL(process.env.DATABASE_URL);url.pathname='/'+name;client=new pg.Client({connectionString:url.toString()});await client.connect();
  const rows=(await client.query('select stored_name,size,checksum from drive_files order by stored_name')).rows;
  assert.deepEqual(rows,manifest.files);assert.ok((await client.query("select 1 from schema_migrations where name='010_private_files.sql'")).rowCount);
  console.log(`PASS: full PostgreSQL restore in disposable database and ${rows.length} restored objects match SHA-256 and size`);
}finally{
  await client?.end();
  if(created)execFileSync('docker',['exec','nogueira-postgres','dropdb','-U','nogueira_admin',name]);
  await rm(destination,{recursive:true,force:true});
}
