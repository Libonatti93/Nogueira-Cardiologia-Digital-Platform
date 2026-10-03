'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { DriveItem } from '@/lib/drive';
import { canPreviewDrive } from '@/lib/drive-policy';
import './files.css';

type Listing={items:DriveItem[];total:number;breadcrumbs:{id:string;name:string}[];usage:{bytes:number;files:number;trash:number};quota:number;maxFileSize:number;storage:{totalBytes:number;freeBytes:number;availableBytes:number}|null};
type DialogState={action:'folder'|'rename'|'move'|'trash'|'purge'|'preview';items:DriveItem[]};
const endpoint='/api/internal/files';
function bytes(n:number){if(!n)return '0 B';const units=['B','KB','MB','GB','TB'],i=Math.min(4,Math.floor(Math.log(n)/Math.log(1024)));return `${(n/1024**i).toLocaleString('pt-BR',{maximumFractionDigits:i?1:0})} ${units[i]}`;}
function date(value:string){return new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});}
function Icon({name,large=false}:{name:string;large?:boolean}) {
  const paths:Record<string,ReactNode>={
    folder:<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z"/>,
    file:<><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/></>,
    upload:<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    grid:<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>,
    list:<path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"/>,
    trash:<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>,
    star:<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    download:<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>,
    move:<path d="M3 7V4h7l2 3h9v14H3v-5m-1-4h12m-4-4 4 4-4 4"/>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={large?38:19} height={large?38:19} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]||paths.file}</svg>;
}
function FileIcon({item}:{item:DriveItem}) {
  const kind=item.kind==='folder'?'folder':item.mime_type.startsWith('image/')?'image':item.mime_type==='application/pdf'?'pdf':'file';
  return <span aria-hidden="true" className={`drive-file-icon drive-icon-${kind}`}><Icon name={item.kind==='folder'?'folder':'file'} large/>{item.kind==='file'&&<span>{item.extension.slice(0,5)||'FILE'}</span>}</span>;
}
function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return <dialog className="drive-dialog" ref={ref} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="drive-dialog-head"><h2>{title}</h2><button className="drive-icon-button" aria-label="Fechar janela" onClick={onClose}>×</button></div>{children}
  </dialog>;
}
async function json(response:Response){const body=await response.json();if(!response.ok)throw new Error(body.message||'Não foi possível concluir.');return body;}

export function FilesConsole() {
  const params=useSearchParams(),router=useRouter();
  const folder=params.get('folder')||'',view=params.get('view')||'files';
  const [data,setData]=useState<Listing|null>(null),[search,setSearch]=useState(''),[sort,setSort]=useState('name'),[direction,setDirection]=useState('asc');
  const [layout,setLayout]=useState<'grid'|'list'>('grid'),[selected,setSelected]=useState<string[]>([]),[offset,setOffset]=useState(0),[revision,setRevision]=useState(0);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [dialog,setDialog]=useState<DialogState|null>(null),[name,setName]=useState(''),[modalError,setModalError]=useState('');
  const [moveFolder,setMoveFolder]=useState(''),[moveData,setMoveData]=useState<Listing|null>(null),[moveOffset,setMoveOffset]=useState(0);
  const [drag,setDrag]=useState(false),[upload,setUpload]=useState<{name:string;index:number;total:number;percent:number}|null>(null);
  const input=useRef<HTMLInputElement>(null),xhr=useRef<XMLHttpRequest|null>(null),cancelUpload=useRef(false),uploading=useRef(false);
  const refresh=()=>{setSelected([]);setRevision(n=>n+1);};
  const navigate=useCallback((nextFolder='',nextView='files')=>{setSelected([]);setOffset(0);setSearch('');setLoading(true);router.push(`/arquivos?${new URLSearchParams({...nextFolder?{folder:nextFolder}:{},...nextView!=='files'?{view:nextView}:{}})}`);},[router]);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);setError('');
      try{const result=await json(await fetch(`${endpoint}?${new URLSearchParams({folder,view,q:search,sort,direction,offset:String(offset)})}`,{signal:controller.signal,cache:'no-store'}));setData(result);}
      catch(e){if(!controller.signal.aborted)setError((e as Error).message);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },search?200:0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[folder,view,search,sort,direction,offset,revision]);
  useEffect(()=>{
    if(dialog?.action!=='move')return;
    const controller=new AbortController();
    fetch(`${endpoint}?${new URLSearchParams({folder:moveFolder,foldersOnly:'1',offset:String(moveOffset)})}`,{signal:controller.signal,cache:'no-store'}).then(json).then(setMoveData).catch(e=>{if(!controller.signal.aborted)setModalError(e.message);});
    return()=>controller.abort();
  },[dialog?.action,moveFolder,moveOffset]);
  useEffect(()=>()=>{cancelUpload.current=true;xhr.current?.abort();},[]);
  function openDialog(action:DialogState['action'],items=chosen) {setModalError('');setName(action==='rename'?items[0].name:'');setMoveFolder('');setMoveOffset(0);setMoveData(null);setDialog({action,items});}
  const chosen=data?.items.filter(item=>selected.includes(item.id))||[];
  async function mutate(action:string,items:DriveItem[],extra:Record<string,unknown>={}) {
    setBusy(true);setError('');setModalError('');setNotice('');
    try{await json(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,items:items.map(({id,kind})=>({id,kind})),...extra})}));setDialog(null);refresh();setNotice(action==='restore'?'Itens restaurados.':action==='trash'?'Itens movidos para a lixeira.':'Alteração salva.');}
    catch(e){if(dialog)setModalError((e as Error).message);else setError((e as Error).message);}
    finally{setBusy(false);}
  }
  async function sendFiles(files:File[]) {
    if(uploading.current||!files.length||view==='trash')return;
    uploading.current=true;cancelUpload.current=false;setError('');setNotice('');let successes=0;const failures:string[]=[];
    const targetFolder=folder;
    for(let i=0;i<files.length;i++) {
      if(cancelUpload.current)break;
      const file=files[i];setUpload({name:file.name,index:i+1,total:files.length,percent:0});
      if(file.size>(data?.maxFileSize||250*1024**2)){failures.push(`${file.name}: limite de 250 MB.`);continue;}
      try{await new Promise<void>((resolve,reject)=>{
        const req=new XMLHttpRequest();xhr.current=req;
        req.open('PUT',`${endpoint}/upload?${new URLSearchParams({name:file.name,folder:targetFolder})}`);
        req.setRequestHeader('Content-Type',file.type||'application/octet-stream');req.timeout=10*60*1000;
        req.upload.onprogress=e=>{if(e.lengthComputable)setUpload({name:file.name,index:i+1,total:files.length,percent:Math.round(e.loaded/e.total*100)});};
        req.onload=()=>{if(req.status>=200&&req.status<300)resolve();else{let message='Falha no envio.';try{message=JSON.parse(req.responseText).message||message;}catch{}reject(new Error(message));}};
        req.onerror=()=>reject(new Error('Falha de conexão. Tente novamente.'));req.ontimeout=()=>reject(new Error('O envio excedeu o tempo. Tente novamente.'));req.onabort=()=>reject(new Error('Envio cancelado.'));req.send(file);
      });successes++;}catch(e){failures.push(`${file.name}: ${(e as Error).message}`);}
    }
    xhr.current=null;uploading.current=false;setUpload(null);refresh();
    setNotice(`${successes} arquivo${successes===1?' enviado':'s enviados'}.${cancelUpload.current?' Envios restantes cancelados.':''}`);
    if(failures.length)setError(failures.slice(0,5).join(' ')+(failures.length>5?` Mais ${failures.length-5} falhas.`:''));
  }
  function openItem(item:DriveItem){if(view==='trash')return;if(item.kind==='folder')navigate(item.id);else openDialog('preview',[item]);}
  const preview=dialog?.action==='preview'?dialog.items[0]:null;
  const previewUrl=preview?`${endpoint}/${preview.id}/content?preview=1`:'';
  const tabs=[['files','folder','Todos os arquivos'],['recent','clock','Recentes'],['favorites','star','Favoritos'],['trash','trash','Lixeira']];
  const usedPercent=data?Math.min(100,Math.max(0,data.usage.bytes/data.quota*100)):0;
  const diskLimited=Boolean(data?.storage&&data.storage.availableBytes<Math.max(0,data.quota-data.usage.bytes));
  return <section className="drive" onDragOver={event=>{if(view!=='trash'&&event.dataTransfer.types.includes('Files')){event.preventDefault();setDrag(true);}}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDrag(false);}} onDrop={event=>{event.preventDefault();setDrag(false);void sendFiles(Array.from(event.dataTransfer.files));}}>
    <header className="drive-heading"><div><span className="drive-eyebrow">NOGUEIRA CARDIOLOGIA</span><h1>Meus Arquivos</h1><p>Seus documentos, organizados em um só lugar.</p></div><span className="drive-private"><Icon name="lock"/> Espaço privado</span></header>
    <section className={`drive-storage ${usedPercent>=90||diskLimited?'drive-storage-warning':''}`} aria-label="Armazenamento da conta">
      <div className="drive-storage-heading"><strong>Armazenamento</strong><span>{data?.storage?`${bytes(data.storage.availableBytes)} disponíveis`:data?'Disponibilidade temporariamente indisponível':loading?'Consultando espaço…':'Não foi possível consultar o espaço'}</span></div>
      {data&&<>
        <div className="drive-storage-track" role="meter" aria-label="Espaço usado na conta" aria-valuemin={0} aria-valuemax={data.quota} aria-valuenow={Math.min(data.usage.bytes,data.quota)} aria-valuetext={`${bytes(data.usage.bytes)} usados de ${bytes(data.quota)}`}><span style={{width:`${usedPercent}%`}}/></div>
        <div className="drive-storage-details"><span><strong>{bytes(data.usage.bytes)}</strong> de {bytes(data.quota)} usados na conta</span><span>{data.storage?`VPS: ${bytes(data.storage.freeBytes)} livres de ${bytes(data.storage.totalBytes)}`:'Espaço da VPS indisponível no momento'}</span></div>
        <p>{diskLimited?'O espaço disponível está limitado pela capacidade livre do servidor. ':usedPercent>=90?'Sua conta está próxima do limite de armazenamento. ':''}Os arquivos na lixeira também ocupam espaço.</p>
      </>}
    </section>
    <div className="drive-topbar"><nav aria-label="Áreas de arquivos">{tabs.map(([key,icon,label])=><button key={key} aria-label={label} className={view===key?'active':''} onClick={()=>{setSort(key==='recent'?'date':'name');setDirection(key==='recent'?'desc':'asc');navigate('',key);}} aria-current={view===key?'page':undefined}><Icon name={icon}/>{label}</button>)}</nav>
      <details className="drive-new"><summary>+ Novo</summary><div><button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');input.current?.click();}} disabled={view==='trash'}><Icon name="upload"/>Upload de arquivo</button><button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');openDialog('folder',[]);}} disabled={view==='trash'}><Icon name="folder"/>Nova pasta</button></div></details>
    </div>
    <div className="drive-workspace">
      <div className="drive-toolbar"><label className="drive-search"><Icon name="search"/><input aria-label="Buscar arquivos e pastas" placeholder="Buscar arquivos e pastas" type="search" value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);setSelected([]);}}/></label>
        <div className="drive-sort"><select aria-label="Ordenar arquivos" value={sort} onChange={e=>{setSort(e.target.value);setOffset(0);}}><option value="name">Nome</option><option value="date">Modificação</option><option value="size">Tamanho</option></select><button className="drive-icon-button" aria-label={direction==='asc'?'Ordenar decrescente':'Ordenar crescente'} onClick={()=>setDirection(direction==='asc'?'desc':'asc')}>{direction==='asc'?'↑':'↓'}</button></div>
        <div className="drive-view"><button aria-label="Visualização em grade" aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}><Icon name="grid"/></button><button aria-label="Visualização em lista" aria-pressed={layout==='list'} onClick={()=>setLayout('list')}><Icon name="list"/></button></div>
      </div>
      <div className="drive-location"><nav aria-label="Caminho da pasta"><button onClick={()=>navigate()}>Meus Arquivos</button>{view!=='files'&&<><span>›</span><span>{tabs.find(t=>t[0]===view)?.[2]}</span></>}{data?.breadcrumbs.map(crumb=><span className="drive-crumb" key={crumb.id}><span>›</span><button onClick={()=>navigate(crumb.id)}>{crumb.name}</button></span>)}{search&&<span>› Resultados da busca</span>}</nav><span>{data?.total??0} itens</span></div>
      {view==='trash'&&<p className="drive-hint">Restaure seus itens ou exclua definitivamente para liberar espaço. Pastas são restauradas com seu conteúdo.</p>}
      {view!=='trash'&&<div className="drive-quick"><button onClick={()=>input.current?.click()} disabled={Boolean(upload)}><Icon name="upload"/>Upload de arquivo</button><button onClick={()=>openDialog('folder',[])}><Icon name="folder"/>Nova pasta</button><span>Até 250 MB por arquivo · Arraste arquivos para enviar</span></div>}
      <input ref={input} type="file" multiple className="drive-hidden" aria-label="Selecionar arquivos para upload" onChange={event=>{void sendFiles(Array.from(event.target.files||[]));event.target.value='';}}/>
      {upload&&<div className="drive-upload" role="status"><div><Icon name="upload"/><span>Enviando {upload.index} de {upload.total}: <strong>{upload.name}</strong></span><button onClick={()=>{cancelUpload.current=true;xhr.current?.abort();}}>Cancelar</button></div><progress max="100" value={upload.percent}/><small>{upload.percent===100?'Finalizando envio…':`${upload.percent}%`}</small></div>}
      {error&&<div className="drive-alert" role="alert">{error} <button onClick={refresh}>Atualizar</button></div>}{notice&&<div className="drive-notice" role="status">{notice}</div>}
      {data&&data.items.length>0&&<div className="drive-selection"><label><input type="checkbox" aria-label="Selecionar todos os itens desta página" checked={data.items.every(i=>selected.includes(i.id))} onChange={e=>setSelected(e.target.checked?data.items.map(i=>i.id):[])}/> {chosen.length?`${chosen.length} selecionado(s)`:'Selecionar'}</label>
        {chosen.length>0&&<div>{view==='trash'?<><button disabled={busy} onClick={()=>void mutate('restore',chosen)}>Restaurar</button><button className="danger" onClick={()=>openDialog('purge')}>Excluir definitivamente</button></>:<><button onClick={()=>openDialog('move')}><Icon name="move"/>Mover</button>{chosen.length===1&&<button onClick={()=>openDialog('rename')}>Renomear</button>}<button disabled={busy} onClick={()=>void mutate('favorite',chosen,{favorite:true})}><Icon name="star"/>Favoritar</button><button className="danger" onClick={()=>openDialog('trash')}><Icon name="trash"/>Excluir</button></>}</div>}
      </div>}
      <div aria-busy={loading} className={loading?'drive-loading':''}>
        {loading&&<p className="drive-hint" role="status">Carregando arquivos…</p>}
        {!loading&&!error&&data?.items.length===0&&<div className="drive-empty"><span><Icon name={view==='trash'?'trash':view==='favorites'?'star':'folder'} large/></span><h2>{search?'Nenhum resultado encontrado':view==='trash'?'Sua lixeira está vazia':view==='favorites'?'Seus favoritos ficam aqui':'Um lugar para tudo que importa'}</h2><p>{search?'Tente outro nome para encontrar seu arquivo.':view==='trash'?'Os itens excluídos aparecerão aqui.':view==='favorites'?'Toque na estrela de um arquivo ou pasta para encontrá-lo rapidamente.':'Crie uma pasta ou envie seus primeiros arquivos.'}</p>{view==='files'&&!search&&<button className="drive-primary" onClick={()=>input.current?.click()}><Icon name="upload"/>Enviar arquivos</button>}</div>}
        <div className={`drive-items drive-${layout}`}>
          {layout==='list'&&data?.items.length!==0&&<div className="drive-list-heading"><span/><span>Nome</span><span>Modificação</span><span>Tamanho</span><span/></div>}
          {data?.items.map(item=><article key={item.id} className={`drive-item ${selected.includes(item.id)?'selected':''}`}>
            <input type="checkbox" aria-label={`Selecionar ${item.name}`} checked={selected.includes(item.id)} onChange={e=>setSelected(e.target.checked?[...selected,item.id]:selected.filter(id=>id!==item.id))}/>
            <button className="drive-item-open" disabled={view==='trash'} onClick={()=>openItem(item)} title={item.name}><FileIcon item={item}/><span className="drive-item-text"><strong>{item.name}</strong><small>{item.kind==='folder'?'Pasta':`${item.extension.toUpperCase()||'Arquivo'} · ${bytes(item.size)}`}</small></span></button>
            <span className="drive-item-date">{date(item.updated_at)}</span><span className="drive-item-size">{item.kind==='folder'?'—':bytes(item.size)}</span>
            <div className="drive-item-actions">{view!=='trash'&&<button className={`drive-icon-button ${item.favorite?'is-favorite':''}`} aria-label={`${item.favorite?'Remover favorito':'Favoritar'} ${item.name}`} disabled={busy} onClick={()=>void mutate('favorite',[item],{favorite:!item.favorite})}><Icon name="star"/></button>}
              <details className="drive-menu"><summary aria-label={`Ações de ${item.name}`}>⋯</summary><div onClick={e=>{e.currentTarget.parentElement?.removeAttribute('open');}}>{view==='trash'?<><button disabled={busy} onClick={()=>void mutate('restore',[item])}>Restaurar</button><button className="danger" onClick={()=>openDialog('purge',[item])}>Excluir definitivamente</button></>:<><button onClick={()=>openItem(item)}>{item.kind==='folder'?'Abrir pasta':'Visualizar'}</button>{item.kind==='file'&&<a href={`${endpoint}/${item.id}/content`} download>Download</a>}<button onClick={()=>openDialog('rename',[item])}>Renomear</button><button onClick={()=>openDialog('move',[item])}>Mover</button><button className="danger" onClick={()=>openDialog('trash',[item])}>Excluir</button></>}</div></details>
            </div>
          </article>)}
        </div>
      </div>
      {(offset>0||(data?.total||0)>100)&&<div className="drive-pagination"><button disabled={!offset} onClick={()=>{setOffset(Math.max(0,offset-100));setSelected([]);}}>Anterior</button><span>Página {offset/100+1}</span><button disabled={offset+100>=(data?.total||0)} onClick={()=>{setOffset(offset+100);setSelected([]);}}>Próxima</button></div>}
      <footer className="drive-footer"><span><Icon name="lock"/>Apenas você tem acesso aos seus arquivos.</span></footer>
    </div>
    {drag&&<div className="drive-drop" aria-hidden="true"><Icon name="upload" large/><strong>Solte seus arquivos aqui</strong><span>Enviar para {data?.breadcrumbs.at(-1)?.name||'Meus Arquivos'}</span></div>}
    {dialog&&<Modal title={dialog.action==='folder'?'Nova pasta':dialog.action==='rename'?'Renomear':dialog.action==='move'?'Mover para uma pasta':dialog.action==='trash'?'Mover para a lixeira?':dialog.action==='purge'?'Excluir definitivamente?':preview?.name||'Visualizar'} onClose={()=>{if(!busy)setDialog(null);}}>
      {modalError&&<p className="drive-alert" role="alert">{modalError}</p>}
      {['folder','rename'].includes(dialog.action)&&<form onSubmit={event=>{event.preventDefault();void mutate(dialog.action,dialog.items,{name,parentId:folder||null});}}><label className="drive-field">Nome<input autoFocus required maxLength={180} value={name} onChange={e=>setName(e.target.value)}/></label><div className="drive-dialog-buttons"><button type="button" disabled={busy} onClick={()=>setDialog(null)}>Cancelar</button><button className="drive-primary" disabled={busy||!name.trim()}>{busy?'Salvando…':'Salvar'}</button></div></form>}
      {['trash','purge'].includes(dialog.action)&&<><p>{dialog.items.length===1?<strong>{dialog.items[0].name}</strong>:`${dialog.items.length} itens selecionados`}</p><p className="drive-hint">{dialog.action==='purge'?'Os arquivos e o conteúdo das pastas serão removidos permanentemente. Essa ação não pode ser desfeita.':'Você poderá restaurar estes itens pela lixeira.'}</p><div className="drive-dialog-buttons"><button disabled={busy} onClick={()=>setDialog(null)}>Cancelar</button><button className="drive-danger" disabled={busy} onClick={()=>void mutate(dialog.action,dialog.items)}>{busy?'Aguarde…':dialog.action==='purge'?'Excluir definitivamente':'Mover para lixeira'}</button></div></>}
      {dialog.action==='move'&&<><nav className="drive-move-crumbs"><button onClick={()=>{setMoveFolder('');setMoveOffset(0);}}>Meus Arquivos</button>{moveData?.breadcrumbs.map(c=><button key={c.id} onClick={()=>{setMoveFolder(c.id);setMoveOffset(0);}}>› {c.name}</button>)}</nav><div className="drive-move-folders">{moveData?.items.filter(i=>!dialog.items.some(s=>s.id===i.id)).map(i=><button key={i.id} onClick={()=>{setMoveFolder(i.id);setMoveOffset(0);}}><Icon name="folder"/>{i.name}<span>›</span></button>)}{moveData?.items.length===0&&<p className="drive-hint">Nenhuma subpasta. Você pode mover para cá.</p>}</div>{(moveOffset>0||(moveData?.total||0)>100)&&<div className="drive-pagination"><button disabled={!moveOffset} onClick={()=>setMoveOffset(n=>n-100)}>Anterior</button><button disabled={moveOffset+100>=(moveData?.total||0)} onClick={()=>setMoveOffset(n=>n+100)}>Próxima</button></div>}<div className="drive-dialog-buttons"><button disabled={busy} onClick={()=>setDialog(null)}>Cancelar</button><button className="drive-primary" disabled={busy||!moveData} onClick={()=>void mutate('move',dialog.items,{parentId:moveFolder||null})}>Mover para cá</button></div></>}
      {preview&&<><div className="drive-preview-meta"><span>{preview.extension.toUpperCase()||'Arquivo'} · {bytes(preview.size)} · {date(preview.updated_at)}</span><a className="drive-primary" href={`${endpoint}/${preview.id}/content`} download><Icon name="download"/>Download</a></div>
        <div className="drive-preview">{preview.mime_type.startsWith('image/')&&canPreviewDrive(preview.mime_type)? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={previewUrl} alt={preview.name} onError={()=>setModalError('Este navegador não conseguiu exibir a imagem. Use Download.')}/>:
          preview.mime_type.startsWith('video/')?<video src={previewUrl} controls playsInline preload="metadata" onError={()=>setModalError('Este formato de vídeo não é compatível com o navegador. Use Download.')}/>:
          preview.mime_type.startsWith('audio/')?<audio src={previewUrl} controls preload="metadata" onError={()=>setModalError('Este formato de áudio não é compatível com o navegador. Use Download.')}/>:
          canPreviewDrive(preview.mime_type)?<iframe title={`Visualização de ${preview.name}`} src={previewUrl}/>:
          <div className="drive-empty"><FileIcon item={preview}/><h3>Arquivo pronto para download</h3><p>A visualização deste formato depende de um aplicativo compatível.</p></div>}</div>
        {canPreviewDrive(preview.mime_type)&&<p className="drive-hint">Se a visualização não abrir, <a href={previewUrl} target="_blank" rel="noopener noreferrer">abra em uma nova aba</a> ou use Download.</p>}
        {preview.parent_id&&<Link className="drive-hint" href={`/arquivos?folder=${preview.parent_id}`} onClick={()=>setDialog(null)}>Ir para a pasta do arquivo</Link>}
      </>}
    </Modal>}
  </section>;
}
