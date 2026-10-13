'use client';
import { analyzeSeo } from '@/lib/educativo-seo';
import type { EditorialContent } from '@/lib/educativo-types';
export function SeoPanel({post,onChange}:{post:EditorialContent;onChange:(patch:Partial<EditorialContent>)=>void}) {
  const analysis=analyzeSeo(post);
  return <aside className="min-w-0 rounded-2xl border border-blue-100 bg-white p-5" aria-label="Assistente de SEO">
    <h2 className="text-xl font-semibold text-[#103E6A]">SEO</h2>
    <div className={`mt-3 rounded-xl p-4 ${analysis.score>=80?'bg-emerald-50 text-emerald-800':analysis.score>=50?'bg-amber-50 text-amber-800':'bg-rose-50 text-rose-800'}`}>
      <strong className="text-2xl">SEO: {analysis.score}/100</strong><p>{analysis.score>=80?'Bom':analysis.score>=50?'Melhorar':'Fraco'}</p>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">Apoio editorial, sem promessa de posição no Google. Priorize precisão, clareza e uso natural dos termos. {analysis.words} palavras.</p>
    <label className="mt-4 grid gap-1 text-sm font-semibold">Palavra-chave principal<input className="edu-input" value={post.primary_keyword} onChange={e=>onChange({primary_keyword:e.target.value})} maxLength={100}/></label>
    <label className="mt-4 grid gap-1 text-sm font-semibold">Palavras-chave secundárias<input className="edu-input" value={post.secondary_keywords.join(', ')} onChange={e=>onChange({secondary_keywords:e.target.value.split(',').map(s=>s.trimStart())})}/></label>
    <label className="mt-4 grid gap-1 text-sm font-semibold">Título SEO<input className="edu-input" aria-label="Título SEO" value={post.seo_title} onChange={e=>onChange({seo_title:e.target.value})} maxLength={180}/><span className="text-xs font-normal text-slate-500">{post.seo_title.length} caracteres</span></label>
    <label className="mt-4 grid gap-1 text-sm font-semibold">Meta description<textarea className="edu-input" rows={4} aria-label="Meta description" value={post.seo_description} onChange={e=>onChange({seo_description:e.target.value})} maxLength={500}/><span className="text-xs font-normal text-slate-500">{post.seo_description.length} caracteres</span></label>
    <div className="mt-5 rounded-xl border border-slate-200 p-3" aria-label="Preview Google"><p className="text-xs font-semibold text-slate-500">Preview Google</p><p className="mt-2 break-all text-xs text-slate-500">nogueiracardiologia.com.br/blog/{post.slug}</p><p className="mt-1 text-lg text-blue-800">{post.seo_title||post.title}</p><p className="mt-1 text-sm text-slate-600">{post.seo_description||post.excerpt}</p><p className="mt-3 text-xs text-slate-400">O buscador pode adaptar o título e a descrição.</p></div>
    <details className="mt-5" open><summary className="cursor-pointer font-semibold text-[#103E6A]">Revisão do conteúdo</summary><ul className="mt-3 space-y-3">{analysis.checks.map(c=><li key={c.label} className="text-sm"><p className={c.ok?'text-emerald-700':'text-amber-800'}>{c.ok?'✓':'⚠'} {c.label}</p>{!c.ok&&<p className="mt-1 text-xs leading-5 text-slate-500">{c.tip}</p>}</li>)}</ul></details>
    <h3 className="mt-5 font-semibold text-[#103E6A]">Termos relacionados</h3><p className="mt-1 text-xs text-slate-500">Extraídos do seu texto, sem estimativa de volume de busca.</p><div className="mt-3 flex flex-wrap gap-2">{analysis.suggestions.map(s=><button key={s} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-[#14508B]" onClick={()=>onChange({secondary_keywords:[...new Set([...post.secondary_keywords.filter(Boolean),s])].slice(0,30)})}>{s} +</button>)}</div>
  </aside>;
}
