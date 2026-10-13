import { getDoctorBySlug } from '@/data/doctors';
import { materialProjection } from './educativo-editorial';
import { sanitizeContent } from './educativo-html';
import type { Material } from './educativo-types';
import { query } from '@/lib/db';
import type { BlogPost, BlogSection } from '@/data/blog-posts';

type EducativoPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_time: string | null;
  published_at: Date | null;
  updated_at: Date;
  sections: unknown;
  content_html: string | null; content_type: 'ARTICLE' | 'CLASS' | 'EDUCATIONAL_MATERIAL'; requires_registration: boolean;
  cover_alt: string; cover_caption: string; author_profile_slug: string | null; attachment_ids: string[]; material_details: Record<string,{title:string;description:string}>; material_types?: string[];
};

export type EducativoDashboardPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: string;
  published_at: Date | null;
  updated_at: Date;
};

export function createPostSlug(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

export function buildSectionsFromBody(body: string): BlogSection[] {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return [];

  return [
    {
      heading: 'Orientação educativa',
      paragraphs: blocks,
    },
  ];
}

export function estimateReadingTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 180))} min`;
}

export async function getPublishedEducativoPosts() {
  const result = await query<EducativoPostRow>(`
    select p.*, null::text as content_html, '[]'::jsonb as sections,
      array(select distinct a.type from educativo_post_attachments a where a.post_id=p.id and a.id=any(p.attachment_ids) and a.purpose='MATERIAL') material_types
    from educativo_posts p
    where status = 'published'
    order by published_at desc nulls last, updated_at desc
  `);

  return result.rows.map(mapEducativoPost);
}

export async function getPublishedEducativoPostBySlug(slug: string) {
  const result = await query<EducativoPostRow>(
    `
      select *
      from educativo_posts
      where slug = $1
        and status = 'published'
      limit 1
    `,
    [slug],
  );

  return result.rows[0] ? mapEducativoPost(result.rows[0]) : null;
}

export async function getDashboardEducativoPosts() {
  const result = await query<EducativoDashboardPost>(`
    select id, title, slug, excerpt, category, status::text, published_at, updated_at
    from educativo_posts
    order by updated_at desc
    limit 6
  `);

  return result.rows;
}

function mapEducativoPost(row: EducativoPostRow): BlogPost {
  const publishedAt = row.published_at ?? row.updated_at;
  const author = row.author_profile_slug ? getDoctorBySlug(row.author_profile_slug) : undefined;

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    tags: row.tags,
    publishedAt: publishedAt.toISOString().slice(0, 10),
    updatedAt: row.updated_at.toISOString().slice(0, 10),
    readingTime: row.reading_time ?? '4 min',
    author: {
      name: author?.name || 'Nogueira Cardiologia',
      role: author?.credentials.find(c => c.startsWith('Professor')) || 'Conteúdo educativo publicado pela clínica',
    },
    seoTitle: row.seo_title || `${row.title} | Nogueira Cardiologia`,
    seoDescription: row.seo_description || row.excerpt,
    coverImage: row.cover_image_url ?? '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris2.png',
    featured: false,
    sections: parseSections(row.sections),
    id: row.id, contentHtml: row.content_html === null ? undefined : sanitizeContent(row.content_html), contentType: row.content_type, requiresRegistration: row.requires_registration,
    coverAlt: row.cover_alt, coverCaption: row.cover_caption, authorProfileSlug: row.author_profile_slug || undefined, materialTypes: row.material_types,
  };
}

function parseSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) return [];

  const sections: Array<BlogSection | null> = value
    .map((section) => {
      if (!section || typeof section !== 'object') return null;
      const candidate = section as { heading?: unknown; paragraphs?: unknown; bullets?: unknown };
      const paragraphs = Array.isArray(candidate.paragraphs)
        ? candidate.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === 'string' && Boolean(paragraph.trim()))
        : [];

      if (!paragraphs.length) return null;

      return {
        heading: typeof candidate.heading === 'string' && candidate.heading.trim() ? candidate.heading : 'Conteúdo educativo',
        paragraphs,
        bullets: Array.isArray(candidate.bullets)
          ? candidate.bullets.filter((bullet): bullet is string => typeof bullet === 'string' && Boolean(bullet.trim()))
        : undefined,
      };
    });

  return sections.filter((section): section is BlogSection => Boolean(section));
}

export async function getPublishedMaterials(postId: string) {
  const result = await query<Material & { material_details: Record<string,{title:string;description:string}> }>(`select ${materialProjection.split(',').map(c => 'a.'+c).join(',')},p.material_details
    from educativo_post_attachments a join educativo_posts p on p.id=a.post_id
    where p.id=$1 and p.status='published' and a.id=any(p.attachment_ids) and a.purpose='MATERIAL' order by array_position(p.attachment_ids,a.id)`,[postId]);
  return result.rows.map(({material_details,...m}) => ({...m,...material_details[m.id]}));
}
