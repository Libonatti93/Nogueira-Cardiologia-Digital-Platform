'use client';
import { useState } from 'react';
import type { Material } from '@/lib/educativo-types';
import { materialUrl } from '@/lib/educativo-types';

export function Materials({materials}:{materials:Material[]}) {
  const [open,setOpen]=useState<string|null>(null);
  if(!materials.length)return null;
  return <section className="mt-10" aria-label="Materiais da aula">
    <h2 className="text-2xl font-semibold text-[#103E6A]">Materiais da aula</h2>
    <div className="mt-4 grid gap-5 sm:grid-cols-2">
      {materials.map(m=><article key={m.id} className="min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-slate-50">
        {/* Protected images use the session cookie, without an optimization proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${materialUrl(m.id)}?thumbnail=1`} alt={m.alt||`Capa do material ${m.title}`} loading="lazy" className="aspect-[16/10] w-full object-contain bg-[#103E6A]"/>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase text-[#14508B]">{m.type==='PDF'?'Aula em PDF':m.type==='POWERPOINT'?'PowerPoint':'Imagem'}{m.slide_count?` · ${m.slide_count} slides`:''}</p>
          <h3 className="mt-2 break-words text-lg font-semibold text-[#103E6A]">{m.title}</h3>
          <p className="mt-1 break-words text-xs text-slate-500">{m.original_filename} · {(m.size/1024/1024).toFixed(2)} MB</p>
          {m.caption&&<p className="mt-2 text-xs text-slate-500">{m.caption}</p>}
          {m.description&&<p className="mt-2 text-sm text-slate-600">{m.description}</p>}
          {m.preview_kind==='cover'&&<p className="mt-2 text-xs text-slate-500">Capa gerada para identificar o material.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {m.type==='PDF'&&<button className="edu-secondary" onClick={()=>setOpen(open===m.id?null:m.id)}>{open===m.id?'Fechar visualização':'Visualizar aula'}</button>}
            {m.type==='IMAGE'&&<a className="edu-secondary" href={materialUrl(m.id)} target="_blank" rel="noreferrer">Visualizar imagem</a>}
            <a className="edu-primary" href={`${materialUrl(m.id)}?download=1`}>{m.type==='POWERPOINT'?'Baixar apresentação':'Baixar material'}</a>
          </div>
          {open===m.id&&<div className="mt-4"><iframe title={`Visualização de ${m.title}`} src={`${materialUrl(m.id)}#view=FitH`} className="h-[450px] w-full rounded-lg border border-slate-200"/><a href={materialUrl(m.id)} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-[#14508B] underline">Abrir PDF em nova aba</a></div>}
        </div>
      </article>)}
    </div>
  </section>;
}
