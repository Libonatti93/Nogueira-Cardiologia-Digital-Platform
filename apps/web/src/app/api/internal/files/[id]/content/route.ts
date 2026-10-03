import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { authorize } from '@/lib/api-access';
import { query } from '@/lib/db';
import { audit } from '@/lib/audit';
import { driveErrorResponse } from '@/lib/drive';
import { canPreviewDrive, driveId, driveRange, DriveError } from '@/lib/drive-policy';
import { drivePath } from '@/lib/drive-storage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function content(request:Request,context:{params:Promise<{id:string}>}) {
  const access=await authorize(request,'files.access');if(access.response)return access.response;
  let file:Awaited<ReturnType<typeof open>>|undefined;
  try {
    const id=driveId((await context.params).id);
    const row=(await query('select id,stored_name,original_name,mime_type,size from drive_files where id=$1 and owner_id=$2 and deleted_at is null',[id,access.user!.id])).rows[0];
    if(!row)throw new DriveError('Arquivo indisponível.',404);
    file=await open(drivePath(row.stored_name),constants.O_RDONLY|constants.O_NOFOLLOW);
    const info=await file.stat();
    if(!info.isFile()||info.size!==Number(row.size))throw new DriveError('Arquivo temporariamente indisponível.',503);
    const inline=new URL(request.url).searchParams.get('preview')==='1'&&canPreviewDrive(row.mime_type);
    const headers=new Headers({'Content-Type':inline?`${row.mime_type}${row.mime_type==='text/plain'?'; charset=utf-8':''}`:'application/octet-stream',
      'Content-Disposition':`${inline?'inline':'attachment'}; filename="download"; filename*=UTF-8''${encodeURIComponent(row.original_name).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16)}`)}`,
      'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',
      'Content-Security-Policy':"sandbox; default-src 'none'; frame-ancestors 'self'",'Cross-Origin-Resource-Policy':'same-origin','Accept-Ranges':'bytes'});
    let range;
    try{range=driveRange(request.headers.get('range'),info.size);}catch(error){if(error instanceof DriveError&&error.status===416){headers.set('Content-Range',`bytes */${info.size}`);await file.close();file=undefined;return new Response(null,{status:416,headers});}throw error;}
    headers.set('Content-Length',String(range?range.end-range.start+1:info.size));
    if(range)headers.set('Content-Range',`bytes ${range.start}-${range.end}/${info.size}`);
    await audit({actor:access.user!.id,action:inline?'files.preview':'files.download',entity:'drive_files',id:row.id},request);
    if(request.method==='HEAD'||!info.size){await file.close();file=undefined;return new Response(null,{status:range?206:200,headers});}
    const stream=file.createReadStream({...range,autoClose:true});file=undefined;
    return new Response(Readable.toWeb(stream) as ReadableStream,{status:range?206:200,headers});
  }catch(error){await file?.close();if((error as {code?:string})?.code==='ENOENT')return driveErrorResponse(new DriveError('Arquivo temporariamente indisponível.',503));return driveErrorResponse(error);}
}
export const GET=content;
export const HEAD=content;
