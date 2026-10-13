'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { contentLabels, type ContentType } from '@/lib/educativo-types';
type Item={id:string;title:string;status:string;slug:string;content_type:ContentType;has_unpublished_changes:boolean};
export function EditorialList({posts}:{posts:Item[]}) {
  const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[search,setSearch]=useState('');
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#15A7DD]">MASTER · Educativo / Blog</p><h1 className="mt-2 text-3xl font-semibold text-[#103E6A]">Central de publicação</h1><p className="mt-3 text-slate-600">Artigos, aulas e materiais do professor em um só lugar.</p></div>
      <button className="edu-primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const r=await fetch('/api/internal/educativo',{method:'POST'});const v=await r.json();if(!r.ok)throw Error(v.message);router.push(`/educativo/${v.id}`);}catch(e){setError(e instanceof Error?e.message:'Não foi possível criar.');setBusy(false);}}}>{busy?'Criando…':'+ Novo conteúdo'}</button></div>
    {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
    <label className="mt-8 grid max-w-md gap-2 text-sm font-semibold">Buscar conteúdo<input className="edu-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Título ou URL"/></label>
    <div className="mt-5 grid gap-4">{posts.filter(p=>(p.title+' '+p.slug).toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(p=><article key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-white p-5"><div className="min-w-0"><p className="text-xs font-semibold text-[#14508B]">{contentLabels[p.content_type]} · {p.status==='published'?'Publicado':p.status==='archived'?'Arquivado':'Rascunho'}{p.has_unpublished_changes?' · Alterações em rascunho':''}</p><h2 className="mt-2 break-words text-lg font-semibold text-[#103E6A]">{p.title||'Sem título'}</h2><p className="mt-1 break-all text-xs text-slate-500">/blog/{p.slug}</p></div><Link href={`/educativo/${p.id}`} className="edu-secondary">Editar conteúdo</Link></article>)}</div>
    {!posts.length&&<p className="mt-6 rounded-2xl bg-white p-6 text-slate-600">Crie seu primeiro conteúdo. Os artigos históricos continuam disponíveis na biblioteca pública.</p>}
    <Link href="https://www.nogueiracardiologia.com.br/blog" target="_blank" className="mt-6 inline-block text-sm font-semibold text-[#14508B] underline">Ver biblioteca pública</Link>
  </div>;
}
