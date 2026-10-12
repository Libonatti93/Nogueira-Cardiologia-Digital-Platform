'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { clinicInput, clinicIso, sources, appointmentLabels } from '@/lib/crm-workflow';
import { brazilStates, patientAge, patientSexOptions, todayInBrazil } from '@/lib/crm-patient';
import { button, field, secondary, type Person, type Team, type Save, type Appointment } from './crm-model';

export function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
 useEffect(()=>{const listener=(event:KeyboardEvent)=>{if(event.key==='Escape')close();};document.addEventListener('keydown',listener);const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',listener);document.body.style.overflow=previous;};},[close]);
 return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-2 sm:p-6" role="presentation"><section role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between gap-4 border-b p-4 sm:px-6"><h2 className="text-xl font-bold text-[#103E6A]">{title}</h2><button className={secondary} onClick={close} aria-label="Fechar">✕</button></header><div className="overflow-y-auto p-4 sm:p-6">{children}</div></section></div>;
}
export function ContactForm({person,owners,save,cancel}:{person?:Person;owners:Team[];save:Save;cancel?:()=>void}){
 const [busy,setBusy]=useState(false),[birthDate,setBirthDate]=useState(person?.birth_date?.slice(0,10)||'');
 const age=patientAge(birthDate);
 return <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();setBusy(true);const f=Object.fromEntries(new FormData(e.currentTarget));await save({operation:'contact',id:person?.id,...f,nextAt:f.nextAt?clinicIso(String(f.nextAt)):undefined});setBusy(false);}}>
  <label>Nome completo *<input autoFocus className={field} name="fullName" required minLength={2} maxLength={160} defaultValue={person?.full_name}/></label>
  <label>Telefone / WhatsApp *<input className={field} name="phone" type="tel" required maxLength={40} defaultValue={person?.phone_whatsapp}/></label>
  <label>Origem *<input className={field} name="source" list="crm-sources" required maxLength={80} defaultValue={person?.contact_source||'WhatsApp'}/><datalist id="crm-sources">{sources.map(s=><option key={s}>{s}</option>)}</datalist></label>
  <label>Responsável<select className={field} name="assignedUserId" defaultValue={person?.assigned_user_id||''}><option value="">Meu usuário</option>{owners.map(o=><option key={o.id} value={o.id}>{o.full_name}</option>)}</select></label>
  <label>E-mail<input className={field} type="email" name="email" maxLength={254} defaultValue={person?.email}/></label>
  <label>Data de nascimento<input className={field} type="date" name="birthDate" max={todayInBrazil()} value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
  <div><span>Idade calculada</span><output className="mt-1 block rounded-xl bg-blue-50 px-3 py-2.5 text-sm">{age===null?'Informe o nascimento':`${age} ${age===1?'ano':'anos'}`}</output></div>
  <label>Sexo<select className={field} name="sex" defaultValue={person?.sex||''}><option value="">Não informado</option>{patientSexOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label>CPF, quando disponível<input className={field} name="cpf" inputMode="numeric" maxLength={14} defaultValue={person?.cpf}/></label>
  <label>Cidade<input className={field} name="city" maxLength={100} defaultValue={person?.address_city}/></label>
  <details className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><summary className="cursor-pointer font-semibold">Endereço e medicamentos informados</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">
   <label>CEP<input className={field} name="postalCode" inputMode="numeric" maxLength={9} defaultValue={person?.postal_code}/></label>
   <label>Rua / logradouro<input className={field} name="street" maxLength={160} defaultValue={person?.address_street}/></label>
   <label>Número<input className={field} name="number" maxLength={20} defaultValue={person?.address_number}/></label>
   <label>Complemento<input className={field} name="complement" maxLength={120} defaultValue={person?.address_complement}/></label>
   <label>Bairro<input className={field} name="neighborhood" maxLength={100} defaultValue={person?.address_neighborhood}/></label>
   <label>UF<select className={field} name="state" defaultValue={person?.address_state||''}><option value="">Não informado</option>{brazilStates.map(state=><option key={state}>{state}</option>)}</select></label>
   <label className="sm:col-span-2">Medicamentos em uso<textarea className={field} name="medications" rows={3} maxLength={3000} defaultValue={person?.medications}/><span className="text-xs text-slate-500">Registre apenas o que foi informado pelo paciente.</span></label>
  </div></details>
  <label>Quem indicou<input className={field} name="referredBy" maxLength={160} defaultValue={person?.referred_by}/></label>
  <label>Convênio do paciente<input className={field} name="insurance" maxLength={160} defaultValue={person?.insurance}/></label>
  <label className="sm:col-span-2">Tags, separadas por vírgula<input className={field} name="tags" maxLength={500} defaultValue={person?.tags?.join(', ')}/></label>
  <label className="sm:col-span-2">Observações<textarea className={field} name="notes" rows={3} maxLength={4000} defaultValue={person?.contact_notes}/></label>
  {!person&&<><label>Próxima ação<input className={field} name="nextAction" required defaultValue="Dar boas-vindas e entender a necessidade" maxLength={500}/></label><label>Data e hora da próxima ação<input className={field} name="nextAt" type="datetime-local" required defaultValue={clinicInput(new Date().toISOString())}/></label></>}
  <div className="flex gap-3 sm:col-span-2"><button className={button} disabled={busy}>{busy?'Salvando…':'Salvar contato'}</button>{cancel&&<button type="button" onClick={cancel} className={secondary}>Cancelar</button>}</div>
 </form>;
}
export function BookingForm({person,appointment,doctors,save,cancel}:{person?:Person;appointment?:Appointment;doctors:Team[];save:Save;cancel?:()=>void}){
 const [search,setSearch]=useState(''),[people,setPeople]=useState<Person[]>([]),[busy,setBusy]=useState(false);
 useEffect(()=>{if(person)return;const controller=new AbortController();const timeout=setTimeout(()=>{fetch(`/api/internal/crm?view=people&q=${encodeURIComponent(search)}`,{signal:controller.signal}).then(r=>r.json()).then(d=>setPeople(d.items||[])).catch(()=>{});},200);return()=>{clearTimeout(timeout);controller.abort();};},[search,person]);
 return <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();setBusy(true);const f=Object.fromEntries(new FormData(e.currentTarget));await save({operation:'booking',...f,id:appointment?.id,leadId:appointment?.lead_id,personId:person?.id||f.personId,scheduledFor:clinicIso(String(f.scheduledFor)),completedAt:f.completedAt?clinicIso(String(f.completedAt)):undefined});setBusy(false);}}>
  {person?<p className="rounded-xl bg-blue-50 p-3 font-semibold sm:col-span-2">{person.full_name} · {person.phone_whatsapp}</p>:<><label>Localizar contato<input className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome ou telefone"/></label><label>Contato / paciente<select name="personId" className={field} required><option value="">Selecione</option>{people.map(p=><option key={p.id} value={p.id}>{p.full_name} · {p.phone_whatsapp}</option>)}</select></label></>}
  <label>Profissional<select className={field} name="doctorId" required defaultValue={appointment?.doctor_id||''}><option value="">Selecione</option>{doctors.map(d=><option value={d.id} key={d.id}>{d.full_name}</option>)}</select></label>
  <label>Data e horário (Brasília)<input className={field} name="scheduledFor" type="datetime-local" required defaultValue={clinicInput(appointment?.scheduled_for)}/></label>
  <label>Modalidade<select className={field} name="modality" defaultValue={appointment?.modality||'in_person'}><option value="in_person">Presencial</option><option value="telemedicine">Online</option></select></label>
  <label>Status<select className={field} name="status" defaultValue={appointment?.care_status||'confirmed'}>{Object.entries(appointmentLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
  <label>Duração em minutos<input className={field} name="durationMinutes" type="number" min={5} max={480} defaultValue={appointment?.duration_minutes||60} required/></label>
  <label>Realizada em (se aplicável)<input className={field} type="datetime-local" name="completedAt" defaultValue={clinicInput(appointment?.completed_at)}/><span className="mt-1 block text-xs text-slate-500">Ao concluir, usa o momento atual se não informado. POP conta dessa data.</span></label>
  <label className="sm:col-span-2">Observação do atendimento<textarea className={field} name="notes" maxLength={2000} defaultValue={appointment?.operational_notes}/></label>
  <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className={button}>{busy?'Salvando…':'Salvar consulta'}</button>{cancel&&<button type="button" className={secondary} onClick={cancel}>Cancelar edição</button>}</div>
 </form>;
}
