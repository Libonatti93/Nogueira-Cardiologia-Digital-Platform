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
    select
      id,
      title,
      slug,
      excerpt,
      category,
      tags,
      cover_image_url,
      seo_title,
      seo_description,
      reading_time,
      published_at,
      updated_at,
      sections
    from educativo_posts
    where status = 'published'
    order by published_at desc nulls last, updated_at desc
  `);

  return result.rows.map(mapEducativoPost);
}

export async function getPublishedEducativoPostBySlug(slug: string) {
  const result = await query<EducativoPostRow>(
    `
      select
        id,
        title,
        slug,
        excerpt,
        category,
        tags,
        cover_image_url,
        seo_title,
        seo_description,
        reading_time,
        published_at,
        updated_at,
        sections
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
      name: 'Nogueira Cardiologia',
      role: 'Conteúdo educativo publicado pela clínica',
    },
    seoTitle: row.seo_title ?? `${row.title} | Nogueira Cardiologia`,
    seoDescription: row.seo_description ?? row.excerpt,
    coverImage: row.cover_image_url ?? '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris2.png',
    featured: false,
    sections: parseSections(row.sections),
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
