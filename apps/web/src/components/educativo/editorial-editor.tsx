'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SeoPanel } from './seo-panel';
import type { EditorialContent, EditorialPost, Material } from '@/lib/educativo-types';
import { materialUrl, contentLabels } from '@/lib/educativo-types';
const RichEditor=dynamic(()=>import('./rich-editor').then(m=>m.RichEditor),{ssr:false,loading:()=> <p>Carregando editor…</p>});
const slugify=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);

export function EditorialEditor({initial,categories}:{initial:EditorialPost;categories:string[]}) {
  const router=useRouter();
  const [post,setPost]=useState(initial),current=useRef(initial);
  const [dirty,setDirty]=useState(false),unsaved=useRef(false), [busy,setBusy]=useState(false),[notice,setNotice]=useState('Rascunho carregado'),[error,setError]=useState('');
  const saving=useRef<Promise<EditorialPost>|null>(null),[uploading,setUploading]=useState(false),[confirmPublish,setConfirmPublish]=useState(false),[confirmArchive,setConfirmArchive]=useState(false);
  const change=useCallback((patch:Partial<EditorialPost>)=>{current.current={...current.current,...patch};setPost(current.current);setDirty(true);unsaved.current=true;setNotice('Alterações ainda não salvas');},[]);
  const save=useCallback(async(action:'save'|'publish'|'archive'='save'):Promise<EditorialPost>=>{
    if(saving.current){await saving.current;}
    const snapshot=current.current;
    setBusy(true);setError('');setNotice('Salvando…');
    const work=(async()=>{
      const response=await fetch(`/api/internal/educativo/${snapshot.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot,materials:undefined,action})});
      const next=await response.json();if(!response.ok)throw Error(next.message);
      if(current.current===snapshot){current.current=next;setDirty(false);unsaved.current=false;}else{current.current={...current.current,revision:next.revision,status:next.status,published_at:next.published_at,has_unpublished_changes:next.has_unpublished_changes};}
      setPost(current.current);setNotice(action==='publish'?'Publicado no blog':action==='archive'?'Conteúdo arquivado':`Salvo às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}${next.status==='published'?' · Alterações em rascunho':''}`);
      return next as EditorialPost;
    })();
    saving.current=work;
    try{return await work;}catch(e){setError(e instanceof Error?e.message:'Falha ao salvar. Seu texto continua nesta tela.');setNotice('Falha ao salvar');throw e;}finally{saving.current=null;setBusy(false);}
  },[]);
  useEffect(()=>{if(!dirty||uploading||error)return;const timer=setTimeout(()=>{void save().catch(()=>{});},2500);return()=>clearTimeout(timer);},[post,dirty,uploading,error,save]);
  useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(unsaved.current){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[]);
  async function upload(file:File,purpose:Material['purpose'],replace?:string) {
    setUploading(true);setError('');
    try {
      const limit=purpose==='MATERIAL'&&!file.type.startsWith('image/')?40:8;
      if(file.size>limit*1024*1024)throw Error(`O limite é ${limit} MB por arquivo.`);
      const response=await fetch(`/api/internal/educativo/${current.current.id}/materials?${new URLSearchParams({name:file.name,purpose})}`,{method:'PUT',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});
      const material:Material & {message?:string}=await response.json();if(!response.ok)throw Error(material.message);
      const snapshot=current.current;
      const remove=replace||(purpose==='COVER'?snapshot.cover_image_url.split('/').at(-1):undefined);
      const materials=[...snapshot.materials.filter(m=>m.id!==remove),material];
      const ids=snapshot.attachment_ids.filter(id=>id!==remove);ids.push(material.id);
      const material_details={...snapshot.material_details,...(purpose==='MATERIAL'?{[material.id]:{title:material.title,description:'',...(material.type==='IMAGE'?{alt:'',caption:''}:{})}}:{})};
      change({materials,attachment_ids:ids,material_details,...(purpose==='COVER'?{cover_image_url:materialUrl(material.id)}:{}),...(material.type!=='IMAGE'?{requires_registration:true}:{})});
      return material;
    }catch(e){setError(e instanceof Error?e.message:'Falha ao enviar arquivo.');throw e;}finally{setUploading(false);}
  }
  const field=(key: keyof EditorialContent,label:string,max=180)=><label className="grid min-w-0 gap-2 text-sm font-semibold" key={key}>{label}<input className="edu-input" value={String(post[key]||'')} maxLength={max} onChange={e=>change({[key]:e.target.value})}/></label>;
  const removeMaterial=(id:string)=>change({attachment_ids:post.attachment_ids.filter(v=>v!==id),materials:post.materials.filter(m=>m.id!==id)});
  return <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><button className="text-sm font-semibold text-[#14508B]" onClick={()=>{void save().then(()=>router.push('/educativo')).catch(()=>{});}}>← Biblioteca de conteúdos</button><p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#15A7DD]">MASTER · Educativo / Blog</p><h1 className="mt-2 text-3xl font-semibold text-[#103E6A]">Editar conteúdo</h1></div><span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#14508B]">{post.status==='published'?'Publicado':post.status==='archived'?'Arquivado':'Rascunho'}</span></div>
    <div className="sticky top-0 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-white/95 p-3 shadow-sm backdrop-blur">
      <button className="edu-secondary" disabled={busy||uploading} onClick={()=>void save().catch(()=>{})}>Salvar rascunho</button>
      <button className="edu-secondary" disabled={busy||uploading} onClick={()=>{const tab=window.open('about:blank','_blank');void save().then(()=>{if(tab){tab.opener=null;tab.location.href=`/educativo/${post.id}/preview`;}else router.push(`/educativo/${post.id}/preview`);}).catch(()=>tab?.close());}}>Pré-visualizar</button>
      <button className="edu-primary" disabled={busy||uploading} onClick={()=>setConfirmPublish(true)}>{post.status==='published'?'Publicar alterações':'Publicar'}</button>
      <p role="status" className="text-xs text-slate-500">{uploading?'Enviando arquivo…':notice}</p>
    </div>
    {post.status==='published'&&<p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-[#103E6A]">As edições são salvas em rascunho. Clique em Publicar alterações para atualizar o conteúdo no site.</p>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <section className="grid gap-5 rounded-2xl border border-blue-100 bg-white p-5 sm:p-6">
          {field('title','Título')}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><label className="grid min-w-0 gap-2 text-sm font-semibold">URL / Slug<input className="edu-input" value={post.slug} disabled={Boolean(post.published_at)} onChange={e=>change({slug:e.target.value})}/><span className="break-all text-xs font-normal text-slate-500">/blog/{post.slug}{post.published_at?' · URL preservada após publicação':''}</span></label>{!post.published_at&&<button className="edu-secondary self-center" onClick={()=>change({slug:slugify(post.title)||post.slug})}>Gerar pelo título</button>}</div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Tipo de conteúdo<select className="edu-input" value={post.content_type} onChange={e=>change({content_type:e.target.value as EditorialContent['content_type'],...(e.target.value!=='ARTICLE'?{requires_registration:true}:{})})}>{Object.entries(contentLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Categoria<input className="edu-input" list="edu-categories" value={post.category} onChange={e=>change({category:e.target.value})}/><datalist id="edu-categories">{categories.map(c=><option key={c} value={c}/>)}</datalist></label></div>
          <label className="grid gap-2 text-sm font-semibold">Tags<input className="edu-input" value={post.tags.join(', ')} onChange={e=>change({tags:e.target.value.split(',').map(s=>s.trimStart())})} placeholder="Separe por vírgula"/></label>
          <label className="grid gap-2 text-sm font-semibold">Resumo<textarea className="edu-input" rows={3} maxLength={1000} value={post.excerpt} onChange={e=>change({excerpt:e.target.value})}/></label>
          <label className="grid gap-2 text-sm font-semibold">Autoria exibida<select className="edu-input" value={post.author_profile_slug||''} onChange={e=>change({author_profile_slug:e.target.value||null})}><option value="dr-paulo-roberto-nogueira">Prof. Dr. Paulo Roberto Nogueira</option><option value="">Equipe Nogueira Cardiologia</option></select></label>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={post.requires_registration} disabled={post.content_type!=='ARTICLE'||post.materials.some(m=>m.type!=='IMAGE')} onChange={e=>change({requires_registration:e.target.checked})}/><span>Exigir inscrição para o conteúdo completo<span className="mt-1 block text-xs text-slate-500">Aulas e arquivos PDF/PowerPoint sempre exigem inscrição. Título, capa, resumo e início do texto permanecem visíveis.</span></span></label>
        </section>
        <section><h2 className="mb-3 text-xl font-semibold text-[#103E6A]">Conteúdo</h2><RichEditor html={initial.content_html} onChange={html=>change({content_html:html})} onUpload={upload} disabled={uploading}/></section>
        <section className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-5"><h2 className="text-xl font-semibold text-[#103E6A]">Imagem de capa</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_image_url} alt={post.cover_alt||'Prévia da capa'} className="max-h-60 w-full rounded-xl bg-slate-50 object-contain"/>
          <label className="grid gap-2 text-sm font-semibold">Enviar ou substituir capa<input type="file" accept=".jpg,.jpeg,.png,.webp" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,'COVER').catch(()=>{});e.target.value='';}}/></label><p className="text-xs text-slate-500">JPG, PNG ou WEBP · até 8 MB.</p>
          {field('cover_alt','ALT da capa',300)}{field('cover_caption','Legenda da capa',500)}
        </section>
        <section id="materiais-editor" className="scroll-mt-28 rounded-2xl border border-blue-100 bg-white p-5"><h2 className="text-xl font-semibold text-[#103E6A]">Materiais da aula</h2><p className="mt-2 text-sm text-slate-500">Imagens até 8 MB. PDF, PPT ou PPTX até 40 MB. Você pode adicionar vários materiais.</p>
          <label className="mt-4 grid gap-2 text-sm font-semibold">Adicionar material da aula<input type="file" multiple accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.webp" disabled={uploading} onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value='';for(const f of files){try{await upload(f,'MATERIAL');}catch{break;}}}}/></label>
          <div className="mt-5 grid gap-4">{post.materials.filter(m=>m.purpose==='MATERIAL').map(m=><div key={m.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[110px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
    <img alt={`Prévia de ${m.original_filename}`} src={`${materialUrl(m.id)}?thumbnail=1`} className="w-28 rounded-lg" loading="lazy"/>
            <div className="grid min-w-0 gap-3"><p className="break-all text-xs text-slate-500">{m.original_filename} · {m.mime_type} · {(m.size/1024/1024).toFixed(2)} MB {m.slide_count?` · ${m.slide_count} slides`:''}</p>
              <label className="grid gap-1 text-sm">Título do material<input className="edu-input" maxLength={180} value={post.material_details[m.id]?.title??m.title} onChange={e=>change({material_details:{...post.material_details,[m.id]:{...post.material_details[m.id],title:e.target.value,description:post.material_details[m.id]?.description??m.description}}})}/></label>
              <label className="grid gap-1 text-sm">Descrição do material<input className="edu-input" maxLength={500} value={post.material_details[m.id]?.description??m.description} onChange={e=>change({material_details:{...post.material_details,[m.id]:{...post.material_details[m.id],title:post.material_details[m.id]?.title??m.title,description:e.target.value}}})}/></label>
              {m.type==='IMAGE'&&<>{(['alt','caption'] as const).map(key=><label key={key} className="grid gap-1 text-sm">{key==='alt'?'ALT do material':'Legenda do material'}<input className="edu-input" value={post.material_details[m.id]?.[key]||''} maxLength={key==='alt'?300:500} onChange={e=>change({material_details:{...post.material_details,[m.id]:{...(post.material_details[m.id]||{title:m.title,description:m.description}),[key]:e.target.value}}})}/></label>)}</>}
              <div className="flex flex-wrap gap-3"><a href={m.type==='POWERPOINT'?`${materialUrl(m.id)}?thumbnail=1`:materialUrl(m.id)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#14508B]">Visualizar</a><a className="text-sm font-semibold text-[#14508B]" href={`${materialUrl(m.id)}?download=1`}>Baixar</a><button className="text-sm font-semibold text-red-700" onClick={()=>removeMaterial(m.id)}>Remover</button><button className="text-sm font-semibold text-[#14508B]" onClick={()=>{const ids=[...post.attachment_ids];const i=ids.indexOf(m.id);if(i>0){[ids[i],ids[i-1]]=[ids[i-1],ids[i]];change({attachment_ids:ids,materials:ids.map(id=>post.materials.find(v=>v.id===id)!).filter(Boolean)});}}}>Mover acima</button></div>
              <label className="grid gap-1 text-xs text-slate-500">Substituir arquivo<input type="file" accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.webp" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,'MATERIAL',m.id).catch(()=>{});e.target.value='';}}/></label>
            </div></div>)}</div>
        </section>
        {post.status!=='archived'&&<button className="text-sm font-semibold text-red-700" onClick={()=>setConfirmArchive(true)}>Arquivar conteúdo</button>}
      </div>
      <SeoPanel post={post} onChange={change}/>
    </div>
    {(confirmPublish||confirmArchive)&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="publish-title" className="w-full max-w-lg rounded-2xl bg-white p-6"><h2 id="publish-title" className="text-xl font-semibold text-[#103E6A]">{confirmArchive?'Arquivar este conteúdo?':'Publicar no blog?'}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{confirmArchive?'O conteúdo sairá da biblioteca pública. Texto, materiais e histórico serão preservados.':`Título, capa e resumo ficarão públicos. ${post.requires_registration?'O conteúdo completo e os materiais exigirão inscrição.':'O texto será aberto aos visitantes.'}`}</p><div className="mt-6 flex flex-wrap gap-3"><button className="edu-secondary" onClick={()=>{setConfirmPublish(false);setConfirmArchive(false);}}>Continuar editando</button><button className="edu-primary" disabled={busy} onClick={()=>{void save(confirmArchive?'archive':'publish').then(()=>{setConfirmPublish(false);setConfirmArchive(false);}).catch(()=>{setConfirmPublish(false);setConfirmArchive(false);});}}>{confirmArchive?'Confirmar arquivamento':'Confirmar publicação'}</button></div></section></div>}
  </div>;
}
