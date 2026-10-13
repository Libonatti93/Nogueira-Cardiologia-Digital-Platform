'use client';
import { useState } from 'react';
import type { Material } from '@/lib/educativo-types';
import { materialUrl } from '@/lib/educativo-types';

export function Materials({materials}:{materials:Material[]}) {
  const [open,setOpen]=useState<string|null>(null),[page,setPage]=useState(1),[failed,setFailed]=useState(false);
  if(!materials.length)return null;
  return <section className="mt-10" aria-label="Materiais da aula" data-nosnippet>
    <h2 className="text-2xl font-semibold text-[#103E6A]">Materiais da aula</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">Aulas exclusivas do Prof. Dr. Paulo Roberto Nogueira. Acesso pessoal para leitura neste site. Não é permitido redistribuir os materiais.</p>
    <div className="mt-4 grid gap-5">
      {materials.map(m=><article key={m.id} className="min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-slate-50">
        <div className="grid sm:grid-cols-[180px_1fr]">
          {/* Protected images carry the session cookie and are never sent through an optimization proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${materialUrl(m.id)}?thumbnail=1`} alt={m.alt||`Capa do material ${m.title}`} loading="lazy" draggable={false} className="aspect-[16/10] w-full object-contain bg-[#103E6A]"/>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase text-[#14508B]">{m.type==='PDF'?'Aula em PDF':m.type==='POWERPOINT'?'Apresentação':'Imagem'}{m.page_count?` · ${m.page_count} páginas`:''}</p>
            <h3 className="mt-2 break-words text-lg font-semibold text-[#103E6A]">{m.title}</h3>
            {m.caption&&<p className="mt-2 text-xs text-slate-500">{m.caption}</p>}
            {m.description&&<p className="mt-2 text-sm text-slate-600">{m.description}</p>}
            {m.type!=='IMAGE'&&!m.page_count?<p className="mt-3 text-sm text-slate-600">Visualização em preparação. Tente novamente mais tarde.</p>:<button className="edu-primary mt-4" onClick={()=>{setOpen(open===m.id?null:m.id);setPage(1);setFailed(false);}}>{open===m.id?'Fechar visualização':'Visualizar aula'}</button>}
          </div>
        </div>
        {open===m.id&&<div className="border-t border-blue-100 p-3 sm:p-5" aria-label={`Visualização de ${m.title}`}>
          {m.type!=='IMAGE'&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button className="edu-secondary" disabled={page<=1} onClick={()=>{setPage(p=>p-1);setFailed(false);}}>Página anterior</button>
            <p className="text-sm" aria-live="polite">Página {page} de {m.page_count}</p>
            <button className="edu-secondary" disabled={page>=m.page_count} onClick={()=>{setPage(p=>p+1);setFailed(false);}}>Próxima página</button>
          </div>}
          {failed?<p role="alert" className="p-5 text-sm text-red-800">Não foi possível abrir esta página. Se o acesso expirou, recarregue a aula e preencha o cadastro novamente.</p>:
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={`${m.id}-${page}`} src={m.type==='IMAGE'?materialUrl(m.id):`${materialUrl(m.id)}?page=${page}`} alt={`${m.title}, página ${page}`} draggable={false} onError={()=>setFailed(true)} className="mx-auto h-auto w-full rounded border border-slate-200"/>}
          <p className="mt-3 text-center text-xs text-slate-500">© Prof. Dr. Paulo Roberto Nogueira · Uso pessoal · Reprodução e compartilhamento não autorizados.</p>
        </div>}
      </article>)}
    </div>
  </section>;
}
