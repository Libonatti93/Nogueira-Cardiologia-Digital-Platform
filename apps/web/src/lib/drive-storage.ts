import { constants } from 'node:fs';
import { mkdir, open, unlink, statfs, rename } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DriveError, driveUuid, detectDriveMime } from './drive-policy';

// External persistent volume: never include its contents in the application artifact.
export const driveRoot = path.resolve(/* turbopackIgnore: true */ process.env.DRIVE_STORAGE_ROOT || '/opt/nogueira-drive');
export const maxDriveFileBytes = 250 * 1024 * 1024;
export const driveQuotaBytes = 10 * 1024 * 1024 * 1024;
export function drivePath(key: string) {
  if (!driveUuid.test(key)) throw new DriveError('Identificador de armazenamento inválido.');
  return path.join(driveRoot,'objects',key.slice(0,2),key);
}
export async function removeDriveObject(key: string) {
  await unlink(drivePath(key)).catch(error=>{ if(error.code!=='ENOENT') throw error; });
  await unlink(path.join(driveRoot,'incoming',key)).catch(error=>{ if(error.code!=='ENOENT') throw error; });
}
export async function commitDriveObject(key:string) {
  const target=drivePath(key);
  await mkdir(path.dirname(target),{recursive:true,mode:0o700});
  await rename(path.join(driveRoot,'incoming',key),target);
}
let uploads = 0;
export async function receiveDriveFile(request: Request, name: string) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared)>maxDriveFileBytes)) throw new DriveError('O limite é 250 MB por arquivo.',413);
  if (!request.body) throw new DriveError('Selecione um arquivo.');
  if (uploads>=3) throw new DriveError('Há outros envios em andamento. Tente novamente em instantes.',429);
  uploads++;
  const key = randomUUID(), target = path.join(driveRoot,'incoming',key);
  let file: Awaited<ReturnType<typeof open>> | undefined;
  let complete = false;
  try {
    await mkdir(path.dirname(target),{recursive:true,mode:0o700});
    const disk = await statfs(driveRoot);
    if (disk.bavail*disk.bsize < maxDriveFileBytes + 1024**3) throw new DriveError('Armazenamento temporariamente sem espaço para novos envios.',507);
    file = await open(target,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
    const hash = createHash('sha256'), reader = request.body.getReader();
    let size = 0, head = Buffer.alloc(0);
    let timedOut=false;
    const timer = setTimeout(()=>{ timedOut=true;void reader.cancel('upload timeout'); },10*60*1000);
    try {
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        if (request.signal.aborted) throw new DriveError('Envio cancelado.');
        size+=value.byteLength;
        if (size>maxDriveFileBytes) throw new DriveError('O limite é 250 MB por arquivo.',413);
        if(head.length<4096) head=Buffer.concat([head,Buffer.from(value.subarray(0,4096-head.length))]);
        hash.update(value);
        // FileHandle.write may be partial; writeFile writes the complete chunk.
        await file.writeFile(value);
      }
      if (timedOut || request.signal.aborted || (declared && size!==Number(declared))) throw new DriveError('O envio foi interrompido. Tente novamente.');
      const mime = detectDriveMime(head,name,(request.headers.get('content-type')||'').split(';')[0]);
      await file.sync();
      complete = true;
      return {key,size,mime,checksum:hash.digest('hex')};
    } finally { clearTimeout(timer); await reader.cancel().catch(()=>{}); reader.releaseLock(); }
  } finally {
    await file?.close(); uploads--;
    if(!complete) await removeDriveObject(key);
  }
}
