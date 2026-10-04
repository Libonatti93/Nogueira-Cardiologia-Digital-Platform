import { parseArgs } from 'node:util';
import { statfs } from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import pg from 'pg';

// Explicit UUID, preview by default, and the same owner lock as uploads.
const { values } = parseArgs({ options: {
  owner: { type: 'string' }, gib: { type: 'string' }, apply: { type: 'boolean', default: false },
} });
if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(values.owner || '')
    || !/^[1-9]\d*$/.test(values.gib || '')) {
  throw new Error('Uso: node scripts/set-drive-quota.mjs --owner UUID --gib 70 [--apply]');
}
const quota = Number(values.gib) * 1024 ** 3;
if (!Number.isSafeInteger(quota)) throw new Error('Cota inválida.');
nextEnv.loadEnvConfig(process.cwd());
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query('begin');
  await db.query("select pg_advisory_xact_lock_shared(hashtextextended('nogueira-drive-backup',0))");
  await db.query("select pg_advisory_xact_lock(hashtextextended('drive-owner:'||$1,0))", [values.owner]);
  const owner = (await db.query(`select u.id,u.full_name,u.email,u.drive_quota_bytes,
    (select coalesce(sum(size),0)::text from drive_files where owner_id=u.id) used_bytes
    from app_users u where u.id=$1 and u.is_active and u.drive_enabled
    and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id
      where ur.user_id=u.id and rp.permission_id='files.access')
    and exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id
      where ur.user_id=u.id and rp.permission_id='panel.access') for update of u`, [values.owner])).rows[0];
  if (!owner) throw new Error('Conta ativa com armazenamento habilitado e acesso a Arquivos não encontrada.');
  const used = Number(owner.used_bytes), previous = Number(owner.drive_quota_bytes ?? 50 * 1024 ** 3);
  if (quota < used) throw new Error('A cota solicitada é menor que o espaço já utilizado pela conta.');
  const disk = await statfs(path.resolve(process.env.DRIVE_STORAGE_ROOT || '/opt/nogueira-drive'));
  const free = disk.bavail * disk.bsize, reserve = 10 * 1024 ** 3;
  if (quota - used > Math.max(0, free - reserve)) {
    throw new Error('O disco não comporta esta cota com a reserva operacional de 10 GiB. Amplie o armazenamento primeiro.');
  }
  const changed = quota !== previous;
  if (values.apply && changed) {
    await db.query('update app_users set drive_quota_bytes=$2 where id=$1', [owner.id, quota]);
    await db.query(`insert into audit_logs(action,entity_type,entity_id,before_data,after_data,metadata)
      values('files.quota.update','app_users',$1,$2,$3,$4)`, [owner.id,
      JSON.stringify({ quota_bytes: previous }), JSON.stringify({ quota_bytes: quota }),
      JSON.stringify({ source: 'set-drive-quota', disk_free_bytes: free, reserve_bytes: reserve })]);
  }
  await db.query(values.apply ? 'commit' : 'rollback');
  console.log(JSON.stringify({ applied: values.apply, changed: values.apply && changed,
    owner: owner.id, name: owner.full_name, email: owner.email, previousQuotaBytes: previous,
    requestedQuotaBytes: quota, usedBytes: used, diskFreeBytes: free, diskReserveBytes: reserve }));
} catch (error) {
  await db.query('rollback').catch(() => {});
  throw error;
} finally { await db.end(); }
