import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, transaction } from './db';
import type { SessionUser } from './auth';
import { audit } from './audit';
import { EditorialError, defaultCover, professorSlug } from './educativo-policy';
import { sanitizeContent, sectionsToHtml, plainText, safeImageUrl } from './educativo-html';
import { blogPosts } from '@/data/blog-posts';
import type { BlogSection } from '@/data/blog-posts';
import type { EditorialContent, EditorialPost, Material } from './educativo-types';
import { uuidPattern } from './educativo-types';

export const materialProjection = 'id,post_id,type,original_filename,mime_type,size::float8,title,description,alt,caption,purpose,display_order,slide_count,preview_kind';
type Db = { query: typeof query };
const fields = ['title','slug','excerpt','category','tags','content_html','content_type','requires_registration','cover_image_url','cover_alt','cover_caption','primary_keyword','secondary_keywords','seo_title','seo_description','author_profile_slug','attachment_ids','material_details'] as const;
export async function editorialTransaction<T>(user: SessionUser, work: (client: PoolClient) => Promise<T>) {
  return transaction(async client => {
    await client.query("select pg_advisory_xact_lock_shared(hashtextextended('nogueira-drive-backup',0))");
    const active = await client.query(`select id from app_users u where id=$1 and is_active and not must_change_password and session_version=$2
      and exists(select 1 from user_roles ur join role_permissions rp on ur.role_id=rp.role_id where ur.user_id=u.id and rp.permission_id='content.manage')
      and exists(select 1 from user_roles ur join role_permissions rp on ur.role_id=rp.role_id where ur.user_id=u.id and rp.permission_id='panel.access') for share`, [user.id,user.sessionVersion]);
    if (user.audience !== 'internal' || !active.rowCount) throw new EditorialError('Acesso revogado.',403);
    return work(client);
  });
}
export function editorialId(id: string) {
  if (!uuidPattern.test(id)) throw new EditorialError('Conteúdo inválido.',404);
  return id;
}
export async function readEditorialPost(id: string, db: Db = { query }): Promise<EditorialPost> {
  const row = (await db.query('select * from educativo_posts where id=$1',[editorialId(id)])).rows[0];
  if (!row) throw new EditorialError('Conteúdo não encontrado.',404);
  const source = row.draft_payload || row;
  const content = Object.fromEntries(fields.map(key => [key, source[key] ?? (key === 'content_html' ? sectionsToHtml(row.sections as BlogSection[]) : '')])) as EditorialContent;
  content.author_profile_slug ||= null;
  content.material_details ||= {};
  content.cover_image_url ||= defaultCover;
  const materials = (await db.query<Material>(`select ${materialProjection} from educativo_post_attachments where post_id=$1 and id=any($2::uuid[])`,[id,content.attachment_ids])).rows;
  return { ...content, id, status: row.status, revision: row.revision, updated_at: row.updated_at.toISOString(), published_at: row.published_at?.toISOString() || null,
    has_unpublished_changes: Boolean(row.draft_payload), materials: content.attachment_ids.map(id => materials.find(m => m.id === id)).filter((m): m is Material => Boolean(m)).map(m => ({...m,...content.material_details[m.id]})) };
}
export async function listEditorialPosts() {
  return (await query<{id:string;title:string;status:string;slug:string;content_type:EditorialContent['content_type'];has_unpublished_changes:boolean}>(`select id,coalesce(draft_payload->>'title',title) title,slug,status,content_type,updated_at,published_at,
    (draft_payload is not null) has_unpublished_changes from educativo_posts order by updated_at desc limit 500`)).rows;
}
export async function createEditorialPost(user: SessionUser, request?: Request) {
  const id = randomUUID();
  return editorialTransaction(user, async client => {
    await client.query(`insert into educativo_posts(id,author_id,updated_by_id,title,slug,excerpt,category,content_html,requires_registration,author_profile_slug)
      values($1,$2,$2,'Novo conteúdo',$3,'','Cardiologia educativa','',true,$4)`,[id,user.id,`rascunho-${id}`,professorSlug]);
    await audit({ actor:user.id, action:'content.create', entity:'educativo_posts', id, after:{status:'draft'} },request,client);
    return readEditorialPost(id,client);
  });
}
function string(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) throw new EditorialError('Um campo está inválido ou excedeu o tamanho permitido.');
  return value.trim();
}
function strings(value: unknown) {
  if (!Array.isArray(value) || value.length > 30) throw new EditorialError('Use até 30 termos.');
  return [...new Set(value.map(v => string(v,100)).filter(Boolean))];
}
export function validateEditorialContent(body: Record<string, unknown>): EditorialContent {
  if (!['ARTICLE','CLASS','EDUCATIONAL_MATERIAL'].includes(String(body.content_type))) throw new EditorialError('Tipo de conteúdo inválido.');
  const slug = string(body.slug,110);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || blogPosts.some(post => post.slug === slug)) throw new EditorialError('Escolha uma URL válida e diferente dos artigos existentes.');
  const ids = body.attachment_ids;
  if (!Array.isArray(ids) || ids.length > 60 || ids.some(id => typeof id !== 'string' || !uuidPattern.test(id))) throw new EditorialError('Materiais inválidos.');
  const attachment_ids = [...new Set(ids)] as string[];
  const cover = string(body.cover_image_url,500);
  if (cover && !safeImageUrl(cover)) throw new EditorialError('Selecione uma imagem da biblioteca ou envie uma capa.');
  if (body.author_profile_slug !== null && body.author_profile_slug !== professorSlug) throw new EditorialError('Autor inválido.');
  const material_details: EditorialContent['material_details'] = {};
  const details = body.material_details as Record<string, {title?:unknown;description?:unknown;alt?:unknown;caption?:unknown}> | undefined;
  for (const id of attachment_ids) if (details?.[id]) material_details[id] = {title:string(details[id].title || '',180),description:string(details[id].description || '',500),...(details[id].alt !== undefined ? {alt:string(details[id].alt || '',300),caption:string(details[id].caption || '',500)} : {})};
  return { title:string(body.title,180), slug, excerpt:string(body.excerpt,1000), category:string(body.category,100) || 'Cardiologia educativa',
    tags:strings(body.tags), content_html:sanitizeContent(string(body.content_html,450_000)), content_type:body.content_type as EditorialContent['content_type'],
    requires_registration:body.requires_registration === true || body.content_type !== 'ARTICLE', cover_image_url:cover || defaultCover,
    cover_alt:string(body.cover_alt,300), cover_caption:string(body.cover_caption,500), primary_keyword:string(body.primary_keyword,100), secondary_keywords:strings(body.secondary_keywords),
    seo_title:string(body.seo_title,180), seo_description:string(body.seo_description,500), author_profile_slug:body.author_profile_slug as string | null, attachment_ids, material_details };
}
export async function saveEditorialPost(user: SessionUser, id: string, body: Record<string, unknown>, request?: Request) {
  if (!['save','publish','archive'].includes(String(body.action))) throw new EditorialError('Ação inválida.');
  const content = validateEditorialContent(body);
  return editorialTransaction(user,async client => {
    const before = (await client.query('select * from educativo_posts where id=$1 for update',[editorialId(id)])).rows[0];
    if (!before) throw new EditorialError('Conteúdo não encontrado.',404);
    if (body.revision !== before.revision) throw new EditorialError('Este conteúdo mudou em outra aba. Reabra-o antes de continuar; seu texto permanece nesta tela.',409);
    if (before.published_at && content.slug !== before.slug) throw new EditorialError('A URL de um conteúdo já publicado deve ser preservada.');
    const materials = (await client.query<Material>(`select ${materialProjection} from educativo_post_attachments where post_id=$1 and id=any($2::uuid[])`,[id,content.attachment_ids])).rows;
    if (materials.length !== content.attachment_ids.length) throw new EditorialError('Um material não pertence a este conteúdo.');
    if (materials.some(m => m.type !== 'IMAGE')) content.requires_registration = true;
    const imageIds = [...content.content_html.matchAll(/src="\/api\/educativo\/materials\/([a-f0-9-]+)"/g)].map(m => m[1]);
    if (content.cover_image_url.startsWith('/api/educativo/materials/')) imageIds.push(content.cover_image_url.split('/').at(-1)!);
    if (imageIds.some(imageId => !materials.some(m => m.id === imageId && m.type === 'IMAGE'))) throw new EditorialError('Use somente imagens anexadas a este conteúdo.');
    if (body.action === 'publish' && (!content.title || !content.excerpt || (!plainText(content.content_html) && !materials.some(m => m.purpose === 'MATERIAL')))) throw new EditorialError('Preencha título, resumo e texto ou material antes de publicar.');
    const prior = (before.draft_payload?.attachment_ids || before.attachment_ids) as string[];
    for (const removed of prior.filter(m => !content.attachment_ids.includes(m))) await audit({actor:user.id,action:'content.attachment.remove',entity:'educativo_posts',id,metadata:{kind:removed}},request,client);
    if (body.action === 'save' && (before.status === 'published' || before.status === 'archived')) {
      await client.query('update educativo_posts set draft_payload=$2::jsonb,revision=revision+1,updated_by_id=$3 where id=$1',[id,JSON.stringify(content),user.id]);
    } else {
      const values = fields.map(key => key === 'material_details' ? JSON.stringify(content[key]) : content[key]);
      await client.query(`update educativo_posts set ${fields.map((key,i) => `${key}=$${i+2}`).join(',')},
        status=$${values.length+2}::post_status, published_at=case when $${values.length+2}='published' then coalesce(published_at,now()) else published_at end,
        updated_by_id=$${values.length+3},updated_at=now(),revision=revision+1,draft_payload=null,reading_time=$${values.length+4} where id=$1`,
      [id,...values,body.action === 'publish' ? 'published' : body.action === 'archive' ? 'archived' : 'draft',user.id,`${Math.max(1,Math.ceil(plainText(content.content_html).split(/\s+/).length/180))} min`]);
    }
    await audit({actor:user.id,action:body.action === 'publish' ? 'content.publish' : body.action === 'archive' ? 'content.archive' : 'content.update',entity:'educativo_posts',id,
      before:{status:before.status,revision:before.revision},after:{operation:body.action,revision:before.revision+1}},request,client);
    return readEditorialPost(id,client);
  });
}
