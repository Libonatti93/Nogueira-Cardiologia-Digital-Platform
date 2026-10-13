import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/access-policy';
import { getEducationalAccess } from '@/lib/educativo-access';
import { editorialId } from '@/lib/educativo-editorial';
import { drivePath } from '@/lib/drive-storage';
import { driveRange } from '@/lib/drive-policy';
import { EditorialError, editorialErrorResponse } from '@/lib/educativo-policy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function content(request:Request,context:{params:Promise<{id:string}>}) {
  let file:Awaited<ReturnType<typeof open>>|undefined;
  try {
    const id=editorialId((await context.params).id);
    const row=(await query(`select a.*,p.status,p.attachment_ids,p.requires_registration,p.cover_image_url from educativo_post_attachments a join educativo_posts p on p.id=a.post_id where a.id=$1`,[id])).rows[0];
    if(!row)throw new EditorialError('Material indisponível.',404);
    const user=await getSessionUser();
    const editor=user?.audience==='internal'&&!user.mustChangePassword&&hasPermission(user,'panel.access')&&hasPermission(user,'content.manage');
    if(!editor) {
      if(row.status!=='published'||!row.attachment_ids.includes(id))throw new EditorialError('Material indisponível.',404);
      const publicImage=row.type==='IMAGE'&&(row.cover_image_url===`/api/educativo/materials/${id}`||!row.requires_registration);
      if(!publicImage&&!(await getEducationalAccess()))throw new EditorialError('Cadastre-se para acessar este material.',401);
    }
    const headers=new Headers({'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',
      'Content-Security-Policy':"sandbox; default-src 'none'; frame-ancestors 'self'",'Cross-Origin-Resource-Policy':'same-origin','Vary':'Cookie'});
    const params=new URL(request.url).searchParams;
    if(params.get('thumbnail')==='1'&&row.preview_bytes) {
      headers.set('Content-Type','image/png');headers.set('Content-Length',String(row.preview_bytes.length));
      return new Response(request.method==='HEAD'?null:new Uint8Array(row.preview_bytes),{headers});
    }
    file=await open(drivePath(row.stored_name),constants.O_RDONLY|constants.O_NOFOLLOW);
    const info=await file.stat();if(!info.isFile()||info.size!==Number(row.size))throw new EditorialError('Material temporariamente indisponível.',503);
    const inline=params.get('download')!=='1'&&(row.type==='IMAGE'||row.type==='PDF');
    headers.set('Content-Type',inline?row.mime_type:'application/octet-stream');
    headers.set('Content-Disposition',`${inline?'inline':'attachment'}; filename="material"; filename*=UTF-8''${encodeURIComponent(row.original_filename).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16)}`)}`);
    headers.set('Accept-Ranges','bytes');
    let range;
    try{range=driveRange(request.headers.get('range'),info.size);}catch{await file.close();file=undefined;headers.set('Content-Range',`bytes */${info.size}`);return new Response(null,{status:416,headers});}
    headers.set('Content-Length',String(range?range.end-range.start+1:info.size));
    if(range)headers.set('Content-Range',`bytes ${range.start}-${range.end}/${info.size}`);
    if(request.method==='HEAD'){await file.close();file=undefined;return new Response(null,{status:range?206:200,headers});}
    const stream=file.createReadStream(range?{start:range.start,end:range.end}:{});file=undefined;
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>,{status:range?206:200,headers});
  } catch(error){await file?.close();return editorialErrorResponse(error);}
}
export const GET=content;
export const HEAD=content;
