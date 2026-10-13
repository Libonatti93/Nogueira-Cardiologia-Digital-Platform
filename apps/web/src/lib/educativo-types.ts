export type ContentType = 'ARTICLE' | 'CLASS' | 'EDUCATIONAL_MATERIAL';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type Material = {
  id: string; post_id: string; type: 'IMAGE' | 'PDF' | 'POWERPOINT';
  original_filename: string; mime_type: string; size: number; title: string;
  description: string; alt: string; caption: string; purpose: 'COVER' | 'INLINE' | 'MATERIAL';
  display_order: number; slide_count: number | null; preview_kind: 'cover' | 'embedded';
};
export type EditorialContent = {
  title: string; slug: string; excerpt: string; category: string; tags: string[];
  content_html: string; content_type: ContentType; requires_registration: boolean;
  cover_image_url: string; cover_alt: string; cover_caption: string;
  primary_keyword: string; secondary_keywords: string[]; seo_title: string; seo_description: string;
  author_profile_slug: string | null; attachment_ids: string[];
  material_details: Record<string, { title: string; description: string; alt?: string; caption?: string }>;
};
export type EditorialPost = EditorialContent & {
  id: string; status: ContentStatus; revision: number; published_at: string | null;
  updated_at: string; materials: Material[]; has_unpublished_changes?: boolean;
};
export const contentLabels: Record<ContentType,string> = {
  ARTICLE: 'Artigo', CLASS: 'Aula do professor', EDUCATIONAL_MATERIAL: 'Material educativo',
};
export const materialUrl = (id: string) => `/api/educativo/materials/${id}`;
export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
