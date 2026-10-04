import type { PoolClient } from 'pg';
import type { SessionUser } from './auth';
import { query, transaction } from './db';
import { audit } from './audit';
import { DriveError, driveId, driveName, driveExtension } from './drive-policy';
import { driveQuotaBytes, maxDriveFileBytes, removeDriveObject, commitDriveObject, getDriveStorage } from './drive-storage';

type Db = {query:typeof query};
export type DriveItem = {id:string;kind:'folder'|'file';name:string;parent_id:string|null;size:number;mime_type:string;extension:string;favorite:boolean;updated_at:string;created_at:string;deleted_at:string|null};
const projection = `select id,'folder' kind,name,parent_id,0::bigint size,'' mime_type,'' extension,favorite,updated_at,created_at,deleted_at,trash_batch_id,owner_id from drive_folders
 union all select id,'file' kind,original_name name,folder_id parent_id,size,mime_type,extension,favorite,updated_at,created_at,deleted_at,trash_batch_id,owner_id from drive_files`;
const subtree = `with recursive tree as (select id from drive_folders where id=$1 and owner_id=$2
 union all select f.id from drive_folders f join tree t on f.parent_id=t.id where f.owner_id=$2) select id from tree`;

async function ownerQuota(db:Db,owner:string) {
  const result=await db.query('select coalesce(drive_quota_bytes,$2::bigint) quota from app_users where id=$1',[owner,driveQuotaBytes]);
  if(!result.rowCount) throw new DriveError('Conta indisponível.',403);
  return Number(result.rows[0].quota);
}

async function folder(db:Db,owner:string,id:string|null) {
  if(!id) return;
  const found=await db.query('select id from drive_folders where id=$1 and owner_id=$2 and deleted_at is null',[id,owner]);
  if(!found.rowCount) throw new DriveError('Pasta indisponível.',404);
}
async function lineage(db:Db,owner:string,id:string|null) {
  if(!id) return [];
  await folder(db,owner,id);
  return (await db.query(`with recursive parents as (
    select id,name,parent_id,1 depth from drive_folders where id=$1 and owner_id=$2 and deleted_at is null
    union all select f.id,f.name,f.parent_id,p.depth+1 from drive_folders f join parents p on f.id=p.parent_id where f.owner_id=$2 and p.depth<65)
    select id,name,depth from parents order by depth desc`,[id,owner])).rows;
}
export async function readDrive(owner:string,params:URLSearchParams) {
  const parent=driveId(params.get('folder'),true), view=params.get('view')||'files';
  if(!['files','recent','favorites','trash'].includes(view)) throw new DriveError('Área inválida.');
  const crumbs=await lineage({query},owner,parent), search=(params.get('q')||'').trim().slice(0,180);
  const offset=Math.min(1000000,Math.max(0,Number(params.get('offset'))||0))|0;
  const orders:Record<string,string>={name:'lower(name)',date:'updated_at',size:'size'};
  const order=orders[params.get('sort')||''] || (view==='recent'?'updated_at':'lower(name)');
  const direction=params.get('direction')==='desc'?'desc':'asc';
  const clauses=['owner_id=$1']; const values:unknown[]=[owner];
  if(view==='trash') clauses.push('deleted_at is not null and id=trash_batch_id');
  else clauses.push('deleted_at is null');
  if(view==='favorites') clauses.push('favorite');
  if(params.get('foldersOnly')==='1') clauses.push("kind='folder'");
  if(search) { values.push(search); clauses.push(`strpos(lower(name),lower($${values.length}))>0`); }
  else if(view==='files') {values.push(parent);clauses.push(`parent_id is not distinct from $${values.length}::uuid`);}
  const where=clauses.join(' and ');
  const items=await query(`select id,kind,name,parent_id,size::float8,mime_type,extension,favorite,updated_at,created_at,deleted_at,count(*) over()::int total
    from (${projection}) items where ${where} order by ${view==='recent'?'':"(kind='folder') desc,"} ${order} ${direction},id limit 100 offset ${offset}`,values);
  const usage=(await query(`select coalesce(sum(size),0)::float8 bytes,count(*)::int files,count(*) filter(where deleted_at is not null)::int trash from drive_files where owner_id=$1`,[owner])).rows[0];
  const quota = await ownerQuota({query},owner);
  const storage = await getDriveStorage(usage.bytes,quota);
  return {items:items.rows,total:items.rows[0]?.total||0,breadcrumbs:crumbs,usage,quota,maxFileSize:maxDriveFileBytes,storage};
}
export async function driveTransaction<T>(user:SessionUser,callback:(client:PoolClient)=>Promise<T>) {
  return transaction(async client=>{
    // Backup takes the exclusive variant. Owner lock serializes hierarchy/quota changes.
    await client.query("select pg_advisory_xact_lock_shared(hashtextextended('nogueira-drive-backup',0))");
    await client.query("select pg_advisory_xact_lock(hashtextextended('drive-owner:'||$1,0))",[user.id]);
    const active=await client.query(`select u.id from app_users u where u.id=$1 and u.is_active and not u.must_change_password and u.session_version=$2
      and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id where ur.user_id=u.id and rp.permission_id='files.access')
      and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id where ur.user_id=u.id and rp.permission_id='panel.access') for share`,[user.id,user.sessionVersion]);
    if(user.audience!=='internal'||!active.rowCount) throw new DriveError('Acesso revogado.',403);
    return callback(client);
  });
}
export async function finishDriveUpload(user:SessionUser,parent:string|null,name:string,upload:{key:string;size:number;mime:string;checksum:string},request:Request) {
  try {
    return await driveTransaction(user,async client=>{
      await folder(client,user.id,parent);
      const used=Number((await client.query('select coalesce(sum(size),0) bytes from drive_files where owner_id=$1',[user.id])).rows[0].bytes);
      const quota=await ownerQuota(client,user.id);
      if(used+upload.size>quota) throw new DriveError('O limite de armazenamento foi atingido. Esvazie itens da lixeira para liberar espaço.',413);
      const row=(await client.query(`insert into drive_files(owner_id,folder_id,original_name,stored_name,mime_type,extension,size,checksum)
        values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,[user.id,parent,name,upload.key,upload.mime,driveExtension(name),upload.size,upload.checksum])).rows[0];
      await audit({actor:user.id,action:'files.upload',entity:'drive_files',id:row.id},request,client);
      await commitDriveObject(upload.key);
      return row;
    });
  } catch(error) {
    // A lost COMMIT response is ambiguous. Never delete an object whose commit may have succeeded.
    const persisted=await query('select 1 from drive_files where stored_name=$1',[upload.key]).catch(()=>null);
    if(persisted?.rowCount===0) await removeDriveObject(upload.key);
    throw error;
  }
}
export async function checkDriveUpload(user:SessionUser,parent:string|null) {
  await folder({query},user.id,parent);
  const used=Number((await query('select coalesce(sum(size),0) bytes from drive_files where owner_id=$1',[user.id])).rows[0].bytes);
  if(used>=await ownerQuota({query},user.id)) throw new DriveError('O limite de armazenamento foi atingido.',413);
}
export async function cleanDriveFiles(owner:string) {
  // Preserve a consistent dump/archive pair while removing queued objects.
  await transaction(async client=>{
    await client.query("select pg_advisory_xact_lock_shared(hashtextextended('nogueira-drive-backup',0))");
    const rows=await client.query('select stored_name from drive_file_cleanup where owner_id=$1 for update skip locked',[owner]);
    for(const row of rows.rows) {
      try {await removeDriveObject(row.stored_name);await client.query('delete from drive_file_cleanup where stored_name=$1',[row.stored_name]);}
      catch {console.error('drive_cleanup_pending');}
    }
  });
}
export async function changeDrive(user:SessionUser,body:Record<string,unknown>,request:Request) {
  const action=String(body.action), destination=driveId(body.parentId,true);
  if(!['folder','rename','move','trash','restore','purge','favorite'].includes(action)) throw new DriveError('Operação inválida.');
  const result=await driveTransaction(user,async client=>{
    if(action==='folder') {
      if((await lineage(client,user.id,destination)).length>=64) throw new DriveError('O limite é de 64 níveis de pastas.');
      const row=(await client.query('insert into drive_folders(owner_id,parent_id,name) values($1,$2,$3) returning id',[user.id,destination,driveName(body.name)])).rows[0];
      await audit({actor:user.id,action:'files.folder.create',entity:'drive_folders',id:row.id},request,client);return row;
    }
    if(!Array.isArray(body.items)||!body.items.length||body.items.length>100) throw new DriveError('Selecione de 1 a 100 itens.');
    if(action==='rename'&&body.items.length!==1) throw new DriveError('Selecione apenas um item para renomear.');
    const selected=new Map<string,{id:string;kind:'file'|'folder'}>();
    for(const item of body.items) {
      if(!item||!['file','folder'].includes(item.kind)) throw new DriveError('Item inválido.');
      const id=driveId(item.id)!;selected.set(id,{id,kind:item.kind});
    }
    const entries=[];
    for(const item of selected.values()) {
      const row=(await client.query(`select * from (${projection}) items where id=$1 and owner_id=$2 and kind=$3`,[item.id,user.id,item.kind])).rows[0];
      if(!row) throw new DriveError('Item indisponível.',404);
      if(['restore','purge'].includes(action)!==Boolean(row.deleted_at)) throw new DriveError('O item mudou de local. Atualize a lista.',409);
      if(['restore','purge'].includes(action)&&row.id!==row.trash_batch_id) throw new DriveError('Restaure ou exclua a pasta que contém este item.',409);
      entries.push(row);
    }
    const destLine=action==='move'?await lineage(client,user.id,destination):[];
    // If parent and child are selected together, act on the selected subtree once.
    const roots=[];
    for(const row of entries) {
      let covered=false;
      if(row.parent_id) {
        const ancestors=(await client.query(`with recursive p as (select id,parent_id from drive_folders where id=$1 and owner_id=$2
          union all select f.id,f.parent_id from drive_folders f join p on f.id=p.parent_id where f.owner_id=$2) select id from p`,[row.parent_id,user.id])).rows;
        covered=ancestors.some(p=>selected.get(p.id)?.kind==='folder');
      }
      if(!covered) roots.push(row);
    }
    for(const row of (['rename','favorite'].includes(action)?entries:roots)) {
      const table=row.kind==='folder'?'drive_folders':'drive_files', parentColumn=row.kind==='folder'?'parent_id':'folder_id';
      if(action==='rename') {
        // Keep the original extension for previews; MIME describes stored bytes.
        await client.query(`update ${table} set ${row.kind==='folder'?'name':'original_name'}=$3,updated_at=now() where id=$1 and owner_id=$2`,[row.id,user.id,driveName(body.name)]);
        if(row.kind==='file')await client.query('update drive_files set extension=$3 where id=$1 and owner_id=$2',[row.id,user.id,driveExtension(driveName(body.name))]);
      } else if(action==='favorite') {
        if(typeof body.favorite!=='boolean') throw new DriveError('Favorito inválido.');
        await client.query(`update ${table} set favorite=$3 where id=$1 and owner_id=$2`,[row.id,user.id,body.favorite]);
      } else if(action==='move') {
        if(row.kind==='folder') {
          if(destination===row.id||destLine.some(p=>p.id===row.id)) throw new DriveError('Uma pasta não pode ser movida para dentro dela mesma.');
          const depth=Number((await client.query(`with recursive t as (select id,1 depth from drive_folders where id=$1 and owner_id=$2
            union all select f.id,t.depth+1 from drive_folders f join t on f.parent_id=t.id where f.owner_id=$2) select max(depth) depth from t`,[row.id,user.id])).rows[0].depth);
          if(destLine.length+depth>64) throw new DriveError('O limite é de 64 níveis de pastas.');
        }
        await client.query(`update ${table} set ${parentColumn}=$3,updated_at=now() where id=$1 and owner_id=$2`,[row.id,user.id,destination]);
      } else if(action==='trash') {
        const ids=row.kind==='folder'?(await client.query(subtree,[row.id,user.id])).rows.map(r=>r.id):[];
        if(ids.length) await client.query('update drive_folders set deleted_at=now(),trash_batch_id=$3,updated_at=now() where id=any($1::uuid[]) and owner_id=$2 and deleted_at is null',[ids,user.id,row.id]);
        await client.query('update drive_files set deleted_at=now(),trash_batch_id=$3,updated_at=now() where owner_id=$2 and deleted_at is null and (id=$3 or folder_id=any($1::uuid[]))',[ids,user.id,row.id]);
      } else if(action==='restore') {
        const parentActive=row.parent_id?(await client.query('select 1 from drive_folders where id=$1 and owner_id=$2 and deleted_at is null',[row.parent_id,user.id])).rowCount:true;
        if(!parentActive) await client.query(`update ${table} set ${parentColumn}=null where id=$1 and owner_id=$2`,[row.id,user.id]);
        await client.query('update drive_folders set deleted_at=null,trash_batch_id=null,updated_at=now() where trash_batch_id=$1 and owner_id=$2',[row.id,user.id]);
        await client.query('update drive_files set deleted_at=null,trash_batch_id=null,updated_at=now() where trash_batch_id=$1 and owner_id=$2',[row.id,user.id]);
      } else if(action==='purge') {
        const ids=row.kind==='folder'?(await client.query(subtree,[row.id,user.id])).rows.map(r=>r.id):[];
        await client.query('insert into drive_file_cleanup(stored_name,owner_id) select stored_name,owner_id from drive_files where owner_id=$2 and (id=$3 or folder_id=any($1::uuid[])) on conflict do nothing',[ids,user.id,row.id]);
        await client.query('delete from drive_files where owner_id=$2 and (id=$3 or folder_id=any($1::uuid[]))',[ids,user.id,row.id]);
        if(ids.length) await client.query('delete from drive_folders where id=any($1::uuid[]) and owner_id=$2',[ids,user.id]);
      }
      await audit({actor:user.id,action:`files.${action}`,entity:table,id:row.id},request,client);
    }
    return {ok:true};
  });
  await cleanDriveFiles(user.id).catch(()=>console.error('drive_cleanup_pending'));
  return result;
}
export function driveErrorResponse(error:unknown) {
  if(error instanceof DriveError) return Response.json({message:error.message},{status:error.status});
  if(error instanceof SyntaxError) return Response.json({message:'Dados inválidos.'},{status:400});
  if((error as {code?:string})?.code==='23505') return Response.json({message:'Já existe uma pasta com esse nome no destino. Renomeie a pasta existente e tente novamente.'},{status:409});
  console.error('drive_operation_failed',error instanceof Error?error.name:'unknown');
  return Response.json({message:'Não foi possível concluir. Tente novamente.'},{status:500});
}
