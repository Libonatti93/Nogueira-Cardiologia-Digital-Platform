import { sanitizeContent, sectionsToHtml } from '@/lib/educativo-html';
import type { BlogSection } from '@/data/blog-posts';
export function ArticleBody({html,sections=[]}:{html?:string;sections?:BlogSection[]}) {
  return <div className="educativo-prose mt-8" dangerouslySetInnerHTML={{__html:sanitizeContent(html ?? sectionsToHtml(sections))}}/>;
}
