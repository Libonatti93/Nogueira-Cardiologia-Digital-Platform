import { authorize } from '@/lib/api-access';
import { audit } from '@/lib/audit';
import { transaction } from '@/lib/db';
import { canSubmitArticle } from '@/lib/lios-policy';

export async function POST(request: Request) {
  const access = await authorize(request, 'lios.publish');
  if (access.response) return access.response;
  let id: unknown;
  try { id = (await request.json())?.id; } catch { /* Invalid input below. */ }
  if (typeof id !== 'string' || !/^article_[a-f0-9]{16}$/.test(id)) return Response.json({ message: 'Artigo inválido.' }, { status: 400 });
  return transaction(async client => {
    const result = await client.query('select * from lios.articles where id=$1 for update', [id]);
    const article = result.rows[0];
    if (!article) return Response.json({ message: 'Artigo não encontrado.' }, { status: 404 });
    if (article.blog_post_id) return Response.json({ ok: true, id: article.blog_post_id });
    const review = JSON.parse(article.audit_json);
    const sources = JSON.parse(article.sources_json);
    if (!canSubmitArticle({ audit: review, sources })) {
      await audit({ actor: access.user!.id, action: 'lios.submit', entity: 'lios', key: id, result: 'denied' }, request, client);
      return Response.json({ message: 'Auditoria pendente, fonte sem URL ou conteúdo de demonstração.' }, { status: 409 });
    }
    const seo = JSON.parse(article.seo_json);
    const sections = [{ heading: 'Conteúdo para revisão', paragraphs: article.body_markdown.split(/\n\s*\n/).filter(Boolean) },
      { heading: 'Fontes', paragraphs: sources.map((source: { title?: string; url: string }) => `${source.title || 'Fonte'}: ${source.url}`) }];
    const slug = `lios-${article.slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '')}-${id.slice(-8)}`;
    const post = await client.query(`insert into educativo_posts
      (author_id,title,slug,excerpt,category,status,sections,seo_title,seo_description,reading_time)
      values($1,$2,$3,$4,'Cardiologia educativa','draft',$5,$6,$7,'5 min') returning id`,
    [access.user!.id,article.title,slug,article.summary,JSON.stringify(sections),seo.meta_title,seo.meta_description]);
    await client.query("update lios.articles set blog_post_id=$2,status='submitted',updated_at=$3 where id=$1", [id,post.rows[0].id,new Date().toISOString()]);
    await audit({ actor: access.user!.id, action: 'lios.submit', entity: 'educativo_posts', id: post.rows[0].id,
      key: id, after: { status: 'draft', article: id } }, request, client);
    return Response.json({ ok: true, id: post.rows[0].id });
  });
}
