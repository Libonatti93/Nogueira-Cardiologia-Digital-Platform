import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, readdir, rm, writeFile, unlink, statfs } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import nextEnv from '@next/env';

const web=fileURLToPath(new URL('..',import.meta.url));
nextEnv.loadEnvConfig(web);
const root=path.resolve(process.env.DRIVE_STORAGE_ROOT||'/opt/nogueira-drive');
const destination=process.env.DRIVE_BACKUP_DIR||'/opt/nogueira-postgres/backups/drive';
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const timestamp=new Date().toISOString().replaceAll(':','-');
const temporary=path.join(destination,`.incomplete-${timestamp}`);
async function archive(command,args,file,gzip=false){
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});let stderr='';
  child.stderr.on('data',chunk=>{stderr+=chunk;});
  const completed=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(`Backup command failed (${code}): ${stderr.slice(0,250)}`)));});
  const output=createWriteStream(file,{mode:0o600,flags:'wx'});
  await Promise.all([gzip?pipeline(child.stdout,createGzip(),output):pipeline(child.stdout,output),completed]);
}
try{
  await db.connect();
  const database=(await db.query('select current_database() name')).rows[0].name;
  if(database!=='nogueira_app'&&!(database==='nogueira_integration_test'&&destination.startsWith('/tmp/')))throw new Error('Unexpected backup database');
  if(!(await db.query("select to_regclass('drive_files') present")).rows[0].present){console.log('Drive migration pending; existing database backup preserved.');}
  else {
    // Stops metadata/object changes, but keeps reads and in-flight incoming uploads available.
    await db.query("select pg_advisory_lock(hashtextextended('nogueira-drive-backup',0))");
    await mkdir(path.join(root,'objects'),{recursive:true,mode:0o700});
    await mkdir(destination,{recursive:true,mode:0o700});
    const completedSets=(await readdir(destination,{withFileTypes:true})).filter(e=>e.isDirectory()&&/^\d{4}-\d{2}-\d{2}T/.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name));
    for(const entry of completedSets.slice(0,-2)){
      if(Date.parse(entry.name.slice(0,10))<Date.now()-15*86400000)await rm(path.join(destination,entry.name),{recursive:true});
    }
    const estimate=(await db.query('select coalesce(sum(size),0)::float8 bytes,pg_database_size(current_database())::float8 database_bytes from drive_files')).rows[0];
    const disk=await statfs(destination);
    if(disk.bavail*disk.bsize<estimate.bytes+estimate.database_bytes+1024**3)throw new Error('Insufficient free space for a complete Drive backup while retaining 1 GB reserve. Existing backups preserved.');
    await mkdir(temporary,{recursive:true,mode:0o700});
    const pending=(await db.query('select stored_name from drive_file_cleanup')).rows;
    for(const row of pending){
      if(!/^[a-f0-9-]{36}$/.test(row.stored_name))throw new Error('Invalid storage key');
      await unlink(path.join(root,'objects',row.stored_name.slice(0,2),row.stored_name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
      await db.query('delete from drive_file_cleanup where stored_name=$1',[row.stored_name]);
    }
    await archive('docker',['exec','nogueira-postgres','pg_dump','-U','nogueira_app_user','-d',database],path.join(temporary,'database.sql.gz'),true);
    await archive('tar',['-czf','-','-C',root,'objects'],path.join(temporary,'objects.tar.gz'));
    const files=(await db.query('select stored_name,size,checksum from drive_files order by stored_name')).rows;
    await writeFile(path.join(temporary,'manifest.json'),JSON.stringify({createdAt:timestamp,database,storageRoot:root,files},null,2)+'\n',{mode:0o600});
    await rename(temporary,path.join(destination,timestamp));
    await db.query("select pg_advisory_unlock(hashtextextended('nogueira-drive-backup',0))");
    console.log(`Drive local backup complete: ${timestamp} (${files.length} objects). Off-host backup requires separate configuration.`);
  }
}finally{await db.end();}
