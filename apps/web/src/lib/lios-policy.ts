const id = '(?:app|run|article)_[a-f0-9]{16}';
const reads = new RegExp(`^(?:health|dashboard|applications|applications/${id}(?:/documents)?|runs|runs/${id}|articles/${id})$`);
const writes = new RegExp(`^(?:applications|applications/app_[a-f0-9]{16}/(?:documents|runs))$`);

export function liosPermission(path: string, method: string) {
  if (method === 'GET' && reads.test(path)) return 'lios.read';
  if (method === 'POST' && writes.test(path)) return 'lios.manage';
  return null;
}

export function canSubmitArticle(article: { audit: { approved?: boolean; score?: number; blockers?: unknown[] }; sources: { synthetic?: boolean; source?: string; url?: string }[] }) {
  return article.audit.approved === true && Number(article.audit.score) >= 8
    && Array.isArray(article.audit.blockers) && article.audit.blockers.length === 0
    && Array.isArray(article.sources) && article.sources.length > 0
    && article.sources.every(source => !source.synthetic && source.source !== 'LIOS Demo'
      && typeof source.url === 'string' && /^https?:\/\//.test(source.url));
}
