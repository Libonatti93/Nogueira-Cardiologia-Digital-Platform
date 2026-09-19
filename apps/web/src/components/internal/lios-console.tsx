'use client';

import { useCallback, useEffect, useState } from 'react';
import { canSubmitArticle } from '@/lib/lios-policy';

type Application = { id: string; name: string; counts: Record<string, number> };
type Document = { id: string; rag_type: string; title: string; content: string; source_url?: string };
type Article = { id: string; title: string; body_markdown: string; status: string;
  audit: { approved: boolean; score: number; blockers: string[]; criteria?: { key: string; label: string; score: number; evidence: string }[] };
  sources: { synthetic?: boolean; source?: string; url?: string }[] };
type Run = { id: string; status: string; current_stage: string; started_at: string; audit_score: number | null;
  article?: Article; events?: { id: number; stage: string; message: string; created_at: string }[] };
const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg bg-[#14508B] px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const labels: Record<string,string> = { queued:'Na fila',running:'Em execução',failed:'Falhou',ready_for_review:'Apto para revisão',review_required:'Revisão necessária' };

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/internal/lios/${path}`, body === undefined ? {cache:'no-store'} : {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Não foi possível acessar a LIOS.');
  return data;
}

export function LiosConsole({canManage,canPublish}:{canManage:boolean;canPublish:boolean}) {
  const [apps,setApps] = useState<Application[]>([]);
  const [appId,setAppId] = useState('');
  const [mode,setMode] = useState('');
  const [documents,setDocuments] = useState<Document[]>([]);
  const [runs,setRuns] = useState<Run[]>([]);
  const [run,setRun] = useState<Run|null>(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const loadApps = useCallback(async () => {
    const [applications,health] = await Promise.all([api('applications'),api('health')]);
    setApps(applications);setMode(health.ai_mode);
    setAppId(current => current || applications[0]?.id || '');
  },[]);
  const load = useCallback(async () => {
    if (!appId) return;
    const application = await api(`applications/${appId}`);
    setDocuments(application.documents);setRuns(application.runs);
  },[appId]);
  useEffect(()=>{Promise.all([api('applications'),api('health')]).then(([applications,health])=>{setApps(applications);setMode(health.ai_mode);setAppId(current=>current||applications[0]?.id||'');}).catch(e=>setMessage(e.message));},[]);
  useEffect(()=>{if(!appId)return;let active=true;api(`applications/${appId}`).then(application=>{if(active){setDocuments(application.documents);setRuns(application.runs);}}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[appId]);
  const runId = run?.id;
  const running = run?.status === 'queued' || run?.status === 'running';
  useEffect(()=>{
    if (!runId || !running) return;
    let active = true;
    const timer = setInterval(()=>{
      api(`runs/${runId}`).then(value=>{if(active){setRun(value);if(!['queued','running'].includes(value.status))void load().catch(e=>setMessage(e.message));}})
        .catch(e=>{if(active)setMessage(e.message);});
    },3000);
    return ()=>{active=false;clearInterval(timer);};
  },[runId,running,load]);
  async function mutate(path:string,body:unknown) {
    setBusy(true);setMessage('');
    try {const result=await api(path,body);await loadApps();await load();return result;}
    catch(e){setMessage(e instanceof Error?e.message:'Falha ao salvar.');return null;}
    finally{setBusy(false);}
  }
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-[#0F3760]">LIOS · Inteligência editorial</h1><p className="mt-2 text-slate-600">Público, oferta e sinais conectados à produção e à revisão do blog.</p></div>
    {mode && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3">{mode==='demo'?'Modo demonstração: valide o fluxo. Textos sintéticos não podem ser enviados ao blog.':'Provedor de IA configurado. Todo artigo exige auditoria e revisão antes da publicação.'}</p>}
    {message && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3">{message}</p>}
    <section className={panel}><label className="font-bold">Aplicação editorial<select className={field} value={appId} onChange={e=>{setAppId(e.target.value);setRun(null);}}><option value="">Selecione</option>{apps.map(app=><option key={app.id} value={app.id}>{app.name}</option>)}</select></label>
      {canManage && <details className="mt-4"><summary className="cursor-pointer font-semibold">Nova aplicação</summary><form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const result=await mutate('applications',{name:data.get('name'),slug:data.get('slug')});if(result){setAppId(result.id);form.reset();}}}>
        <label>Nome<input className={field} name="name" required minLength={2} maxLength={100}/></label><label>Identificador<input className={field} name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required maxLength={80}/></label><button disabled={busy} className={button}>Criar aplicação</button></form></details>}
    </section>
    {appId && <>
      <div className="grid gap-4 md:grid-cols-3">{[['avatar','RAG 1 · Público'],['offer','RAG 2 · Oferta'],['signals','RAG 3 · Sinais']].map(([kind,title])=><section className={panel} key={kind}><h2 className="text-lg font-bold">{title}</h2><p className="my-2 text-sm text-slate-500">{documents.filter(d=>d.rag_type===kind).length} documentos</p>{documents.filter(d=>d.rag_type===kind).map(d=><details className="mt-2 border-t pt-2" key={d.id}><summary className="cursor-pointer text-sm font-semibold">{d.title}</summary><p className="mt-2 whitespace-pre-wrap text-sm">{d.content}</p>{d.source_url && /^https?:\/\//.test(d.source_url) && <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Fonte</a>}</details>)}</section>)}</div>
      {canManage && <section className={panel}><h2 className="text-xl font-bold">Adicionar conhecimento</h2><p className="mt-1 text-sm text-slate-500">Use informações editoriais gerais e fontes públicas. Não insira dados pessoais de pacientes.</p><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);if(await mutate(`applications/${appId}/documents`,{rag_type:data.get('rag_type'),title:data.get('title'),content:data.get('content'),source_url:data.get('source_url')||null,source_name:data.get('source_name')||null,observed_at:new Date().toISOString()}))form.reset();}}>
        <label>Base<select className={field} name="rag_type"><option value="avatar">Público</option><option value="offer">Oferta</option><option value="signals">Sinais</option></select></label><label>Título<input name="title" className={field} required minLength={2} maxLength={180}/></label>
        <label className="md:col-span-2">Conteúdo<textarea name="content" className={field} required minLength={2} maxLength={30000} rows={5}/></label>
        <label>URL da fonte<input name="source_url" type="url" className={field}/></label><label>Nome da fonte<input name="source_name" className={field} maxLength={120}/></label><button className={button} disabled={busy}>Salvar documento</button>
      </form></section>}
      <section className={panel}><h2 className="text-xl font-bold">Produção e histórico</h2>{canManage && <form className="my-4 flex flex-wrap items-end gap-3" onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);const result=await mutate(`applications/${appId}/runs`,{topic_hint:data.get('topic'),force_demo_signal:data.get('demo')==='on'});if(result)setRun(result);}}>
        <label className="min-w-48 flex-1">Tema<input className={field} name="topic" maxLength={240}/></label><label className="text-sm"><input name="demo" type="checkbox"/> Usar sinal de demonstração</label><button disabled={busy||running} className={button}>Iniciar produção</button></form>}
        <div className="space-y-2">{runs.map(item=><button key={item.id} className="flex w-full flex-wrap justify-between gap-2 rounded-lg border border-slate-200 p-3 text-left text-sm" onClick={()=>api(`runs/${item.id}`).then(setRun).catch(e=>setMessage(e.message))}><span>{new Date(item.started_at).toLocaleString('pt-BR')}</span><strong>{labels[item.status]||item.status}</strong><span>{item.current_stage} · Nota {item.audit_score??'—'}</span></button>)}</div>
        {!runs.length && <p className="mt-4 text-sm text-slate-500">Nenhuma execução nesta aplicação.</p>}
      </section>
      {run && <section className={panel}><h2 className="text-xl font-bold">{labels[run.status]||run.status}</h2><ol className="my-4 space-y-2">{run.events?.map(event=><li key={event.id} className="border-l-2 border-blue-200 pl-3 text-sm"><strong>{event.stage}</strong> · {event.message}</li>)}</ol>
        {run.article && <><h3 className="text-lg font-bold">{run.article.title}</h3><p className="my-3 font-semibold">Auditoria: {run.article.audit.score}/10</p>{run.article.audit.blockers?.map(text=><p key={text} className="mb-2 text-sm text-amber-800">{text}</p>)}
          <details><summary className="cursor-pointer font-semibold">Critérios da auditoria</summary>{run.article.audit.criteria?.map(c=><p key={c.key} className="mt-2 text-sm">{c.label}: {c.score}/10 · {c.evidence}</p>)}</details>
          <details className="my-4"><summary className="cursor-pointer font-semibold">Ler texto produzido</summary><div className="mt-3 whitespace-pre-wrap text-sm leading-7">{run.article.body_markdown}</div></details>
          {canPublish && <button className={button} disabled={busy||run.article.status==='submitted'||!canSubmitArticle(run.article)} onClick={async()=>{if(await mutate('submit',{id:run.article!.id})){setMessage('Rascunho enviado. Revise o conteúdo na área de Conteúdo do dashboard.');setRun(await api(`runs/${run.id}`));}}}>{run.article.status==='submitted'?'Enviado ao blog':'Enviar rascunho para revisão no blog'}</button>}</>}
      </section>}
    </>}
    <p className="text-xs text-slate-500">LIOS · Criação e arquitetura original de Matheus Libonatti.</p>
  </div>;
}
