import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/access-policy';
import { getEducationalAccess, educationalAccessLabel, limitEducationalViewing } from '@/lib/educativo-access';
import { watermarkEducationalImage } from '@/lib/educativo-render';
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
    const row=(await query(`select a.*,p.status,p.attachment_ids,p.requires_registration,p.content_type,p.cover_image_url from educativo_post_attachments a join educativo_posts p on p.id=a.post_id where a.id=$1`,[id])).rows[0];
    if(!row)throw new EditorialError('Material indisponível.',404);
    const user=await getSessionUser();
    const editor=user?.audience==='internal'&&!user.mustChangePassword&&hasPermission(user,'panel.access')&&hasPermission(user,'content.manage');
    let access:Awaited<ReturnType<typeof getEducationalAccess>>=null;
    const publicImage=row.type==='IMAGE'&&(row.cover_image_url===`/api/educativo/materials/${id}`||(!row.requires_registration&&row.content_type==='ARTICLE'&&row.purpose!=='MATERIAL'));
    if(!editor) {
      if(row.status!=='published'||!row.attachment_ids.includes(id))throw new EditorialError('Material indisponível.',404);
      if(!publicImage) {
        if(request.headers.get('sec-fetch-site')==='cross-site')throw new EditorialError('Acesso inválido.',403);
        access=await getEducationalAccess();
        if(!access)throw new EditorialError('Informe nome, e-mail e telefone para acessar a aula.',401);
        if(!(await limitEducationalViewing(access.id)))throw new EditorialError('Muitas páginas solicitadas. Aguarde um minuto.',429);
      }
    }
    const headers=new Headers({'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',
      'Content-Security-Policy':"sandbox; default-src 'none'; frame-ancestors 'self'",'Cross-Origin-Resource-Policy':'same-origin','Vary':'Cookie'});
    const params=new URL(request.url).searchParams;
    const imageResponse=async(bytes:Buffer,mime:string)=>{
      const marked=access?await watermarkEducationalImage(bytes,educationalAccessLabel(access)):bytes;
      headers.set('Content-Type',access?'image/jpeg':mime);headers.set('Content-Length',String(marked.length));
      headers.set('Content-Disposition','inline');
      return new Response(request.method==='HEAD'?null:new Uint8Array(marked),{headers});
    };
    // HEAD, Range and alternative query parameters must never expose an original to a subscriber.
    if(!editor&&params.has('download'))throw new EditorialError('Esta aula permite somente visualização no site.',403);
    if(params.has('page')) {
      const page=params.get('page')||'';
      if(!/^[1-9]\d{0,2}$/.test(page)||Number(page)>row.page_count)throw new EditorialError('Página indisponível.',404);
      const rendered=(await query<{image_bytes:Buffer}>('select image_bytes from educativo_material_pages where attachment_id=$1 and page_number=$2',[id,Number(page)])).rows[0];
      if(!rendered)throw new EditorialError('Página indisponível.',404);
      return await imageResponse(rendered.image_bytes,'image/jpeg');
    }
    if(params.get('thumbnail')==='1'&&row.preview_bytes) {
      return await imageResponse(row.preview_bytes,'image/png');
    }
    if(!editor&&row.type!=='IMAGE')throw new EditorialError('O arquivo original é privado. Use o visualizador da aula.',403);
    file=await open(drivePath(row.stored_name),constants.O_RDONLY|constants.O_NOFOLLOW);
    const info=await file.stat();if(!info.isFile()||info.size!==Number(row.size))throw new EditorialError('Material temporariamente indisponível.',503);
    if(access) {
      const bytes=await file.readFile();await file.close();file=undefined;
      return await imageResponse(bytes,row.mime_type);
    }
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
