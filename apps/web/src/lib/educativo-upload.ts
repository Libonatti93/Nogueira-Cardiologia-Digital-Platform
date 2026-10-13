import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import yauzl from 'yauzl';
import * as CFB from 'cfb';
import { driveRoot, receiveDriveFile, commitDriveObject, removeDriveObject } from './drive-storage';
import { driveName, driveExtension, detectDriveMime } from './drive-policy';
import { EditorialError } from './educativo-policy';
import { escapeHtml } from './educativo-html';
import { editorialId, editorialTransaction, materialProjection } from './educativo-editorial';
import { query } from './db';
import { audit } from './audit';
import type { SessionUser } from './auth';
import type { Material } from './educativo-types';
import { renderEducationalDocument } from './educativo-render';

const mimes: Record<string,string> = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
export function validateUploadName(name: string, claimed: string) {
  const clean = driveName(name), ext = driveExtension(clean);
  if (!mimes[ext] || (claimed && claimed !== 'application/octet-stream' && claimed !== mimes[ext])) throw new EditorialError('Envie JPG, PNG, WEBP, PDF, PPT ou PPTX com o tipo correto.');
  return { name:clean, ext, mime:mimes[ext], limit:(['jpg','jpeg','png','webp'].includes(ext) ? 8 : 40)*1024*1024 };
}
async function inspectPptx(bytes: Buffer): Promise<{ slides:number; thumbnail?:Buffer }> {
  return new Promise((resolve,reject) => {
    yauzl.fromBuffer(bytes,{lazyEntries:true,validateEntrySizes:true,strictFileNames:true},(error,zip) => {
      if (error || !zip) { reject(new EditorialError('Apresentação PPTX inválida.')); return; }
      let entries=0, size=0, slides=0, presentation=false, contentTypes=false, thumbnail: Buffer | undefined;
      let finished=false;
      const fail=() => { if (!finished) {finished=true;zip.close();reject(new EditorialError('PPTX inválido, protegido por senha ou com conteúdo não permitido.'));} };
      zip.on('error',fail);
      zip.on('entry',(entry:yauzl.Entry) => {
        entries++; size+=entry.uncompressedSize;
        if (entries>5000 || size>250*1024*1024 || entry.uncompressedSize>60*1024*1024 || (entry.generalPurposeBitFlag&1) || /(?:vbaProject|activeX|embeddings\/)/i.test(entry.fileName)) {fail();return;}
        if (/^ppt\/slides\/slide\d+\.xml$/.test(entry.fileName)) slides++;
        const xml=entry.fileName==='ppt/presentation.xml'||entry.fileName==='[Content_Types].xml';
        if ((xml || /^docProps\/thumbnail\.(?:jpeg|jpg|png)$/i.test(entry.fileName)) && entry.uncompressedSize<3*1024*1024) {
          zip.openReadStream(entry,(err,stream) => {
            if(err||!stream){fail();return;}
            const chunks:Buffer[]=[];let n=0;
            stream.on('data',(chunk:Buffer)=>{n+=chunk.length;if(n>3*1024*1024){stream.destroy();fail();}else chunks.push(chunk);});
            stream.on('error',fail);stream.on('end',()=>{
              const value=Buffer.concat(chunks);
              if(entry.fileName==='ppt/presentation.xml')presentation=/<(?:\w+:)?presentation\b/.test(value.toString())&&value.includes(Buffer.from('http://schemas.openxmlformats.org/presentationml/2006/main'));
              else if(entry.fileName==='[Content_Types].xml')contentTypes=value.includes(Buffer.from('application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml'));
              else thumbnail=value;
              zip.readEntry();
            });
          });
        } else zip.readEntry();
      });
      zip.on('end',()=>{if(finished)return;if(!presentation||!contentTypes||!slides){fail();return;}finished=true;resolve({slides,thumbnail});});
      zip.readEntry();
    });
  });
}
export async function validateEducationalFile(bytes:Buffer, name:string, claimed:string) {
  const { ext,mime,limit }=validateUploadName(name,claimed);
  if (!bytes.length || bytes.length>limit) throw new EditorialError('Arquivo vazio ou maior que o limite.',413);
  let slideCount:number|null=null, embedded:Buffer|undefined, type:Material['type'];
  if (mime.startsWith('image/')) {
    detectDriveMime(bytes.subarray(0,4096),name,claimed);
    try {
      const output=await sharp(bytes,{limitInputPixels:24_000_000,animated:false}).rotate().toFormat(ext==='jpg'||ext==='jpeg'?'jpeg':ext as 'png'|'webp').toBuffer();
      return {bytes:output,mime,type:'IMAGE' as const,slideCount,previewKind:'embedded' as const,preview:await sharp(output).resize(640,400,{fit:'inside',withoutEnlargement:true}).png().toBuffer()};
    } catch {throw new EditorialError('Imagem inválida ou com dimensões muito grandes.');}
  }
  if(ext==='pdf') {
    detectDriveMime(bytes.subarray(0,4096),name,claimed);
    if(!bytes.subarray(-4096).includes(Buffer.from('%%EOF'))) throw new EditorialError('PDF incompleto.');
    type='PDF';
  } else if(ext==='pptx') {
    const result=await inspectPptx(bytes);slideCount=result.slides;embedded=result.thumbnail;type='POWERPOINT';
  } else {
    try {
      if(bytes.subarray(0,8).toString('hex')!=='d0cf11e0a1b11ae1') throw new Error();
      const doc=CFB.read(bytes,{type:'buffer'});
      if(!CFB.find(doc,'PowerPoint Document') || doc.FullPaths.some(p=>/VBA|Macros|EncryptedPackage/i.test(p))) throw new Error();
    } catch {throw new EditorialError('PPT inválido, com macros ou protegido por senha. Exporte uma apresentação sem macros.');}
    type='POWERPOINT';
  }
  if(embedded) {try{embedded=await sharp(embedded,{limitInputPixels:8_000_000}).resize(640,400,{fit:'inside'}).png().toBuffer();}catch{embedded=undefined;}}
  const label=type==='PDF'?'AULA EM PDF':'APRESENTAÇÃO';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#103E6A"/><rect x="36" y="36" width="8" height="328" fill="#15A7DD"/><text x="72" y="98" font-family="sans-serif" font-size="22" fill="#72d6f8">${label}</text><text x="72" y="204" font-family="sans-serif" font-size="24" fill="white">${escapeHtml(name.slice(0,34))}</text><text x="72" y="305" font-family="sans-serif" font-size="18" fill="white">${slideCount?`${slideCount} slides`:'Material da aula'} · Nogueira Cardiologia</text></svg>`;
  return {bytes,mime,type,slideCount,previewKind:embedded?'embedded' as const:'cover' as const,preview:embedded || await sharp(Buffer.from(svg)).png().toBuffer()};
}
export async function uploadEducationalFile(user:SessionUser,id:string,request:Request) {
  editorialId(id);
  const params=new URL(request.url).searchParams;
  const {name,limit}=validateUploadName(params.get('name')||'',(request.headers.get('content-type')||'').split(';')[0]);
  const purpose=params.get('purpose')||'MATERIAL';
  if(!['COVER','INLINE','MATERIAL'].includes(purpose)) throw new EditorialError('Uso do arquivo inválido.');
  if(!(await query('select id from educativo_posts where id=$1',[id])).rowCount) throw new EditorialError('Conteúdo não encontrado.',404);
  const upload=await receiveDriveFile(request,name,limit);
  try {
    const incoming=path.join(driveRoot,'incoming',upload.key);
    const checked=await validateEducationalFile(await readFile(incoming),name,request.headers.get('content-type')||'');
    if(purpose!=='MATERIAL'&&checked.type!=='IMAGE')throw new EditorialError('Selecione uma imagem para a capa ou o texto.');
    const pages=checked.type==='IMAGE'?[]:await renderEducationalDocument(checked.bytes,driveExtension(name));
    await writeFile(incoming,checked.bytes,{mode:0o600});
    return await editorialTransaction(user,async client=>{
      await client.query('select id from educativo_posts where id=$1 for update',[id]);
      const usage=(await client.query('select count(*)::int n,coalesce(sum(size),0)::float8 bytes from educativo_post_attachments where post_id=$1',[id])).rows[0];
      if(usage.n>=300||usage.bytes+checked.bytes.length>2*1024**3) throw new EditorialError('O limite de materiais deste conteúdo foi atingido.',413);
      const rendered=(await client.query('select coalesce(sum(octet_length(image_bytes)),0)::float8 bytes from educativo_material_pages p join educativo_post_attachments a on a.id=p.attachment_id where a.post_id=$1',[id])).rows[0];
      if(rendered.bytes+pages.reduce((n,p)=>n+p.length,0)>128*1024**2)throw new EditorialError('O limite de páginas deste conteúdo foi atingido. Divida a aula em outro conteúdo.',413);
      const row=(await client.query<Material>(`insert into educativo_post_attachments(post_id,type,original_filename,stored_name,mime_type,size,checksum,preview_bytes,preview_kind,slide_count,title,purpose,created_by_id,page_count)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$3,$11,$12,$13) returning ${materialProjection}`,
      [id,checked.type,name,upload.key,checked.mime,checked.bytes.length,createHash('sha256').update(checked.bytes).digest('hex'),checked.preview,checked.previewKind,checked.slideCount,purpose,user.id,pages.length])).rows[0];
      for(let i=0;i<pages.length;i++)await client.query('insert into educativo_material_pages(attachment_id,page_number,image_bytes) values($1,$2,$3)',[row.id,i+1,pages[i]]);
      await audit({actor:user.id,action:'content.attachment.upload',entity:'educativo_posts',id,metadata:{kind:row.id}},request,client);
      await commitDriveObject(upload.key);
      return row;
    });
  } catch(error) {
    const exists=await query('select id from educativo_post_attachments where stored_name=$1',[upload.key]).catch(()=>null);
    if(exists?.rowCount===0)await removeDriveObject(upload.key);
    throw error;
  }
}
