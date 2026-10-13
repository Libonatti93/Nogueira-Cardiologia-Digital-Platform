import sanitizeHtml from 'sanitize-html';
import type { BlogSection } from '@/data/blog-posts';

export function safeImageUrl(value: string) {
  return /^\/(?:uploads-imagens-nogueira|brand)\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')
    || /^\/api\/educativo\/materials\/[a-f0-9-]{36}$/.test(value);
}
export function sanitizeContent(value: string) {
  return sanitizeHtml(value, {
    allowedTags: ['p','br','strong','em','u','s','h1','h2','h3','ul','ol','li','blockquote','a','hr','figure','img','figcaption','div'],
    allowedAttributes: { a: ['href','rel','target'], img: ['src','alt','title','loading'], '*': ['style'], div: ['class'] },
    allowedClasses: { div: ['educativo-callout'] },
    allowedStyles: { '*': { 'text-align': [/^(left|center|right|justify)$/] } },
    allowedSchemes: ['https','http','mailto','tel'], allowProtocolRelative: false,
    transformTags: {
      b: 'strong', i: 'em', strike: 's',
      a: (tagName, attrs) => ({ tagName, attribs: { ...attrs, rel: 'noopener noreferrer', target: '_blank' } }),
      img: (tagName, attrs) => ({ tagName, attribs: { src: safeImageUrl(attrs.src || '') ? attrs.src : '', alt: attrs.alt || '', loading: 'lazy' } }),
    },
    exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src,
  });
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]!);
}
export function sectionsToHtml(sections: BlogSection[]) {
  return sections.map(s => `<h2>${escapeHtml(s.heading)}</h2>${s.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}`).join('');
}
export function plainText(html: string) {
  return sanitizeHtml(html.replace(/<\/(?:p|h[123]|li|blockquote)>/gi, ' </p>'), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}
export function contentTeaser(html: string) {
  const paragraph = html.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i)?.[1] || html;
  return plainText(paragraph).slice(0, 420);
}
