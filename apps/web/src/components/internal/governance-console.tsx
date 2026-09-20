'use client';

import { useCallback, useEffect, useState } from 'react';
type User = {id:string;full_name:string;email:string;role:string;roles:string[];is_active:boolean;last_login_at:string|null;permissions:string[];has_local_credential:boolean;must_change_password:boolean};
type Role = {id:string;name:string;permissions:string[];user_count:number};
type Permission = {id:string;module:string;description:string};
type Event = {id:string;created_at:string;actor:string;actor_user_id:string|null;action:string;result:string;entity_type:string;entity_id:string;ip_address:string;before_data:unknown;after_data:unknown;metadata:unknown};
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg bg-[#14508B] px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';

export function GovernanceConsole({canManage,canAudit,auditOnly=false}:{canManage:boolean;canAudit:boolean;auditOnly?:boolean}) {
  const [data,setData] = useState<{users:User[];roles:Role[];permissions:Permission[];summary:Record<string,number>}>({users:[],roles:[],permissions:[],summary:{}});
  const [q,setQ] = useState('');
  const [offset,setOffset] = useState(0);
  const [events,setEvents] = useState<Event[]>([]);
  const [action,setAction] = useState('');
  const [actor,setActor] = useState('');
  const [auditOffset,setAuditOffset] = useState(0);
  const [selected,setSelected] = useState<User|null>(null);
  const [role,setRole] = useState<Role|null>(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [credential,setCredential] = useState<User|null>(null);
  const [tab,setTab] = useState('users');
  const load = useCallback(async () => {
    if(auditOnly)return {users:[],roles:[],permissions:[],summary:{}};
    const response = await fetch(`/api/internal/governance?q=${encodeURIComponent(q)}&offset=${offset}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.message);
    return body;
  },[q,offset,auditOnly]);
  const loadAudit = useCallback(async () => {
    if (!canAudit) return;
    const response = await fetch(`/api/internal/audit?action=${encodeURIComponent(action)}&actor=${actor}&offset=${auditOffset}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.message);
    return body.events;
  },[action,actor,auditOffset,canAudit]);
  useEffect(() => { load().then(setData).catch(e=>setMessage(e.message)); },[load]);
  useEffect(() => { loadAudit().then(events=>setEvents(events??[])).catch(e=>setMessage(e.message)); },[loadAudit]);
  async function save(body:unknown) {
    setBusy(true);setMessage('');
    try {
      const response = await fetch('/api/internal/governance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setMessage('Alteração salva e registrada na auditoria. Sessões do usuário editado foram revogadas.');
      setSelected(null);setRole(null);setCredential(null);setData(await load());setEvents((await loadAudit())??[]);
      return true;
    } catch(e) {setMessage(e instanceof Error?e.message:'Falha ao salvar.');return false;}
    finally {setBusy(false);}
  }
  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#15A7DD]">Administração e segurança</p><h1 className="mt-2 text-3xl font-bold text-[#0F3760]">{auditOnly?'Auditoria de acessos':'Governança & IAM'}</h1><p className="mt-2 text-slate-600">Identidades, perfis e permissões da equipe em um único lugar.</p></div>
    {!auditOnly&&<><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">{Object.entries(data.summary).map(([key,value])=><div className={panel} key={key}><p className="text-xs text-slate-500">{{internal_active:'Internos ativos',masters:'MASTER',crm_operators:'Operadores CRM',doctors:'Médicos',inactive:'Inativos',recent_access:'Acessos em 24h'}[key]}</p><p className="mt-2 text-2xl font-bold text-[#103E6A]">{value}</p></div>)}</div>
    <nav className="flex flex-wrap gap-2" aria-label="Áreas do IAM">{[['users','Usuários'],['roles','Perfis'],['matrix','Permissões efetivas'],...(canAudit?[['audit','Auditoria']]:[])].map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab===key?'bg-[#103E6A] text-white':'border bg-white text-slate-600'}`}>{label}</button>)}</nav></>}
    {message && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3">{message}</p>}
    {!auditOnly&&tab==='users'&&<><section className={panel}><h2 className="mb-4 text-xl font-bold">Usuários</h2>
      <label>Pesquisar nome ou e-mail<input className={input} value={q} onChange={e=>{setQ(e.target.value);setOffset(0);}} /></label>
      <div className="mt-4 overflow-x-auto"><table className="min-w-[850px] w-full text-left text-sm [&_th]:px-3 [&_th]:py-3 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top"><thead><tr><th className="p-2">Usuário</th><th>Perfis / nível</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
      <tbody>{data.users.map(user=><tr key={user.id} className="border-t border-slate-100"><td className="p-2"><p className="font-semibold">{user.full_name}</p><p>{user.email}</p></td>
        <td>{user.roles.join(', ')||'Paciente / sem acesso administrativo'}<p className="text-xs text-slate-500">{user.has_local_credential?(user.must_change_password?'Troca de senha pendente':'Credencial local ativa'):'Credencial local não habilitada'}</p></td><td>{user.is_active?'Ativo':'Inativo'}</td><td>{user.last_login_at?new Date(user.last_login_at).toLocaleString('pt-BR'):'Sem acesso'}</td>
        <td>{canManage && <button className="font-bold text-[#14508B]" onClick={()=>setSelected(user)}>Editar</button>}{canManage&&user.roles.length>0&&<><button className="ml-3 text-[#14508B]" onClick={()=>setCredential(user)}>Credencial</button><button className="ml-3 text-slate-600" onClick={()=>void save({operation:'revoke',id:user.id})}>Revogar sessões</button></>}{canAudit && <button className="ml-3 text-[#14508B]" onClick={()=>{setActor(user.id);setAuditOffset(0);setTab('audit');}}>Histórico</button>}</td></tr>)}</tbody></table></div>
      <div className="mt-3 flex gap-3"><button disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-100))}>Anterior</button><span>{offset+1}–{offset+data.users.length}</span><button disabled={data.users.length<100} onClick={()=>setOffset(offset+100)}>Seguinte</button></div>
    </section>
    {canManage && <section className={panel}><h2 className="mb-4 text-xl font-bold">{selected?'Editar acesso':'Criar usuário interno'}</h2>
      <form key={selected?.id??'new'} className="grid gap-4 md:grid-cols-2" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);if(await save({operation:selected?'user':'create',id:selected?.id,fullName:f.get('fullName'),email:f.get('email'),password:f.get('password'),isActive:f.get('active')==='on',roles:f.getAll('roles')}))form.reset();}}>
        <label>Nome<input required name="fullName" className={input} defaultValue={selected?.full_name} maxLength={160}/></label>
        <label>E-mail<input required={!selected} name="email" type="email" className={input} defaultValue={selected?.email} disabled={Boolean(selected)}/></label>
        {!selected && <label>Senha temporária (troca obrigatória)<input required name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" className={input}/></label>}
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={selected?.is_active??true}/>Usuário ativo</label>
        <fieldset className="md:col-span-2"><legend className="mb-2 font-semibold">Perfis e nível de acesso</legend><div className="flex flex-wrap gap-4">{data.roles.map(r=><label key={r.id} className="flex items-center gap-2"><input type="checkbox" name="roles" value={r.id} defaultChecked={selected?.roles.includes(r.id)}/>{r.name}</label>)}</div></fieldset>
        <div className="flex gap-3"><button disabled={busy} className={button}>Salvar</button>{selected && <button type="button" onClick={()=>setSelected(null)}>Cancelar edição</button>}</div>
      </form></section>}
    {canManage&&credential&&<section className={panel}><h2 className="text-xl font-bold">Habilitar / redefinir credencial interna</h2><p className="my-3 text-sm text-slate-500">Conta existente: {credential.full_name}. O vínculo com o portal de pacientes será preservado. As sessões serão revogadas e a troca de senha será obrigatória.</p><form className="flex flex-wrap items-end gap-4" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const password=new FormData(form).get('password');if(await save({operation:'credential',id:credential.id,password}))form.reset();}}><label className="flex-1">Nova senha temporária<input required type="password" name="password" minLength={12} maxLength={72} autoComplete="new-password" className={input}/></label><button className={button} disabled={busy}>Salvar credencial temporária</button><button type="button" onClick={()=>setCredential(null)}>Cancelar</button></form><p className="mt-3 text-xs text-slate-500">Entregue a senha diretamente ao titular por canal seguro. A senha não fica visível no histórico.</p></section>}
    </>}
    {!auditOnly&&tab==='roles'&&<section className={panel}><h2 className="mb-4 text-xl font-bold">Perfis, permissões e módulos</h2>
      <div className="grid gap-3 md:grid-cols-2">{data.roles.map(r=><div key={r.id} className="rounded-lg border border-slate-200 p-3"><h3 className="font-bold">{r.name} <span className="text-xs font-normal text-slate-500">{r.user_count} usuários</span></h3><p className="mt-2 text-sm">{r.permissions.map(p=>data.permissions.find(x=>x.id===p)?.description??p).join(' · ')||'Sem permissões'}</p>{canManage && r.id!=='MASTER' && <button className="mt-2 font-bold text-[#14508B]" onClick={()=>setRole(r)}>Editar perfil</button>}</div>)}</div>
      {canManage && <form key={role?.id??'new-role'} className="mt-6 space-y-3" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await save({operation:'role',id:role?.id??f.get('id'),name:f.get('name'),permissions:f.getAll('permissions')});}}>
        <h3 className="font-bold">{role?'Editar perfil':'Novo perfil'}</h3><label>Identificador<input name="id" required pattern="[A-Z][A-Z0-9_]{1,39}" className={input} defaultValue={role?.id} disabled={Boolean(role)}/></label>
        <label>Nome do perfil<input name="name" required className={input} defaultValue={role?.name}/></label>
        <div className="grid gap-2 md:grid-cols-2">{data.permissions.map(p=><label key={p.id} className="flex gap-2 text-sm"><input type="checkbox" name="permissions" value={p.id} defaultChecked={role?.permissions.includes(p.id)}/>{p.module}: {p.description}</label>)}</div>
        <button className={button} disabled={busy}>Salvar perfil</button>{role && <button type="button" className="ml-3" onClick={()=>setRole(null)}>Cancelar</button>}
      </form>}
    </section>}
    {!auditOnly&&tab==='matrix'&&<section className={panel}><h2 className="text-xl font-bold">Usuário → Perfil → Módulo → Permissão</h2><p className="mt-2 text-sm text-slate-500">A combinação dos perfis determina os acessos efetivos. Pacientes sem perfil interno não recebem permissões administrativas.</p><label className="mt-4 block text-sm">Pesquisar usuário<input className={input} value={q} onChange={e=>{setQ(e.target.value);setOffset(0);}}/></label><div className="mt-5 space-y-3">{data.users.map(user=><details key={user.id} className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-semibold">{user.full_name} · {user.roles.join(' + ')||'Sem perfil interno'} · {user.permissions.length} permissões</summary><div className="mt-4 grid gap-4 md:grid-cols-2">{[...new Set(data.permissions.filter(p=>user.permissions.includes(p.id)).map(p=>p.module))].map(module=><div key={module}><h3 className="text-sm font-bold text-[#14508B]">{module}</h3><ul className="mt-2 space-y-1 text-xs text-slate-600">{data.permissions.filter(p=>p.module===module&&user.permissions.includes(p.id)).map(p=><li key={p.id}>{p.description} <span className="text-slate-400">({p.id})</span></li>)}</ul></div>)}</div></details>)}</div></section>}
    {canAudit && (auditOnly||tab==='audit') && <section className={panel}><h2 className="mb-4 text-xl font-bold">Auditoria e histórico de login</h2>
      <div className="flex flex-wrap gap-3"><label>Ação<input className={input} placeholder="auth.login, governance, lios..." value={action} onChange={e=>{setAction(e.target.value);setAuditOffset(0);}}/></label>
      <label>Usuário<select className={input} value={actor} onChange={e=>{setActor(e.target.value);setAuditOffset(0);}}><option value="">Todos</option>{(data.users.length?data.users:[...new Map(events.filter(e=>e.actor_user_id).map(e=>[e.actor_user_id,{id:e.actor_user_id!,full_name:e.actor}])).values()]).map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></label>
      <button onClick={()=>loadAudit().then(events=>setEvents(events??[])).catch(e=>setMessage(e.message))}>Atualizar</button></div>
      <div className="mt-4 space-y-2">{events.map(event=><details key={event.id} className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm"><strong>{event.action}</strong> · {event.result} · {event.actor||'Sistema'} · {new Date(event.created_at).toLocaleString('pt-BR')}</summary>
        <p className="my-2 text-sm">Entidade: {event.entity_type} / {event.entity_id||'—'} · IP: {event.ip_address||'indisponível'}</p><pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({antes:event.before_data,depois:event.after_data,contexto:event.metadata},null,2)}</pre></details>)}</div>
      <div className="mt-3 flex gap-4"><button disabled={!auditOffset} onClick={()=>setAuditOffset(Math.max(0,auditOffset-100))}>Anterior</button><button disabled={events.length<100} onClick={()=>setAuditOffset(auditOffset+100)}>Seguinte</button></div>
    </section>}
  </div>;
}
