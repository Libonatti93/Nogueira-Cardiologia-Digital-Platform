'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { patientAge } from '@/lib/crm-patient';
import { CrmPatientForm } from './crm-patient-form';
import { CrmKanban } from './crm-kanban';
import { commercialStages, crmButton as button, crmCard as card, crmDate as date, crmField as field, crmLabels as labels, type CrmRow as Row } from './crm-types';

const tabs = [['leads','crm.leads.read'],['patients','crm.patients.read'],['appointments','crm.appointments.read'],['agenda','crm.appointments.read'],['summary','crm.access'],['history','crm.leads.read']];
type Overview = { items?: Row[]; events?: Row[]; doctors?: Row[]; counts?: Record<string, number>; stageCounts?: Record<string, number>; total?: number };
// datetime-local values use the clinic's timezone, independent of the operator's device timezone.
const localDate = (value?: string) => {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  return parts.replace(' ', 'T');
};
const clinicDate = (value: FormDataEntryValue | null) => value ? new Date(`${value}:00-03:00`).toISOString() : null;

export function CrmConsole({ permissions, initialView }: { permissions: string[]; initialView: string }) {
  const allowed = tabs.filter(([, permission]) => permissions.includes(permission));
  const [view, setView] = useState(allowed.some(([key]) => key === initialView) ? initialView : allowed[0]?.[0] ?? 'summary');
  const [q, setQ] = useState(''), [offset, setOffset] = useState(0);
  const [data, setData] = useState<Overview>({});
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [patientEditor, setPatientEditor] = useState<Partial<Row> | null>(null);
  const [sourceLead, setSourceLead] = useState<string>();
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Row[]>([]), [patientSearch, setPatientSearch] = useState('');
  const editorRef = useRef<HTMLElement>(null);
  const requestVersion = useRef(0);
  const canLead = permissions.includes('crm.leads.manage');
  const canSchedule = permissions.includes('crm.appointments.manage');
  const canRegister = permissions.includes('crm.patients.manage');
  const items = data.items ?? [], events = data.events ?? [], doctors = data.doctors ?? [];
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/internal/crm?view=${view}&q=${encodeURIComponent(q)}&offset=${offset}`, { cache: 'no-store', signal });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message);
    return body as Overview;
  }, [view, q, offset]);
  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    load(controller.signal).then(result => { if (version === requestVersion.current) { setData(result); setLoading(false); } }).catch(error => {
      if (!controller.signal.aborted && version === requestVersion.current) { setMessage(error.message); setLoading(false); }
    });
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    if (view !== 'appointments' || !canSchedule) return;
    const controller = new AbortController();
    fetch(`/api/internal/crm?view=patients&q=${encodeURIComponent(patientSearch)}`, { signal: controller.signal }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.message); setPatients(body.items);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, [view, canSchedule, patientSearch]);
  useEffect(() => { if (editing) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [editing]);

  async function save(body: Record<string, unknown>) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/internal/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      // Invalidate older reads so they cannot restore a card's previous stage after a successful write.
      const version = ++requestVersion.current;
      setEditing(null);
      setMessage('Alteração salva e registrada no histórico.');
      try { const fresh = await load(); if (version === requestVersion.current) setData(fresh); }
      catch { setMessage('Alteração salva. Atualize a página para recarregar os registros.'); }
      return result as { ok: boolean; id: string; leadId?: string };
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); return null; }
    finally { setBusy(false); }
  }
  function switchView(value: string) {
    window.history.replaceState(null, '', value === 'leads' ? '/crm' : `/crm?view=${value}`);
    if (value !== view || q || offset) { setLoading(true); setData({}); }
    setView(value); setQ(''); setOffset(0); setEditing(null); setPatientEditor(null); setSourceLead(undefined); setMessage('');
  }
  function showKanban(name = '') { switchView('leads'); setQ(name); }
  async function openPatient(row: Row) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/internal/crm?view=patient&id=${row.id}`, { cache: 'no-store' });
      const body = await response.json(); if (!response.ok) throw new Error(body.message);
      setSourceLead(undefined); setPatientEditor(body.patient);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o cadastro.'); }
    finally { setBusy(false); }
  }
  function registerFromLead(row: Row) {
    switchView('patients'); setSourceLead(row.id);
    setPatientEditor({ full_name: row.full_name, email: row.email, phone_whatsapp: row.phone_whatsapp });
  }
  function scheduleFromLead(row: Row) {
    switchView('appointments');
    setEditing({ id: row.appointment_id, patient_id: row.patient_id, patient_name: row.full_name,
      lead_id: row.id, status: row.appointment_status ?? 'confirmed', scheduled_for: row.scheduled_for,
      doctor_id: row.doctor_id, modality: row.modality });
  }
  async function moveLead(row: Row, stage: string) {
    if (stage === row.stage) return;
    if (stage === 'confirmed' && !row.appointment_id) {
      if (row.patient_id && canSchedule) scheduleFromLead(row);
      else setMessage('Cadastre o paciente e use Agendar consulta para definir a data e o horário.');
      return;
    }
    const result = await save({ operation: 'lead_stage', id: row.id, stage, expectedStage: row.stage });
    if (!result) { const fresh = await load().catch(() => null); if (fresh) setData(fresh); }
  }
  const patientForm = patientEditor && <CrmPatientForm key={patientEditor.id ?? sourceLead ?? 'new-patient'} patient={patientEditor} leadId={sourceLead}
    canEdit={canRegister} canAddToCrm={canLead} busy={busy} onCancel={() => { setPatientEditor(null); setSourceLead(undefined); }}
    onUseExisting={sourceLead ? () => { setPatientEditor(null); setQ(patientEditor.full_name ?? ''); } : undefined}
    onSave={async body => {
      const result = await save(body);
      if (result) {
        setPatientEditor(null); setSourceLead(undefined);
        if (result.leadId) { showKanban(String(body.fullName)); setMessage('Paciente salvo e vinculado ao funil. Use Agendar consulta no cartão.'); }
      }
    }}/>;

  return <div className="min-w-0 space-y-6" aria-busy={busy}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#15A7DD]">Atendimento e relacionamento</p>
      <h1 className="mt-2 text-3xl font-bold text-[#103E6A]">{view === 'patients' ? 'Pacientes' : 'CRM de consultas'}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{view === 'patients' ? 'Cadastre o paciente e leve o atendimento para o funil comercial.' : 'Acompanhe cada contato até o agendamento da consulta na Nogueira.'}</p>
    </div><div className="flex gap-2">
      {view === 'patients' && canRegister && <button disabled={busy} className={button} onClick={() => { setPatientEditor({}); setSourceLead(undefined); }}>Novo paciente</button>}
      {view === 'leads' && canLead && <button disabled={busy} className={button} onClick={() => setEditing({})}>Nova oportunidade</button>}
    </div></div>
    <nav aria-label="Áreas do CRM" className="flex flex-wrap gap-2">{allowed.map(([key]) => <button key={key} disabled={busy} onClick={() => switchView(key)} aria-current={view === key ? 'page' : undefined} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${view === key ? 'bg-[#103E6A] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{labels[key]}</button>)}</nav>
    {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">{message}</p>}
    {view === 'patients' && patientForm}
    {view === 'patients' && sourceLead && !patientEditor && <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">Localize o paciente abaixo e escolha “Vincular à oportunidade”. <button className="ml-2 underline" onClick={() => setSourceLead(undefined)}>Cancelar vínculo</button></p>}
    {view === 'leads' && editing && canLead && <section ref={editorRef} className={`${card} scroll-mt-20`}><h2 className="mb-4 text-lg font-bold">{editing.id ? 'Editar acompanhamento' : 'Nova oportunidade'}</h2>
      <form key={editing.id ?? 'new-lead'} className="grid gap-4 md:grid-cols-2" onSubmit={async event => {
        event.preventDefault(); const f = new FormData(event.currentTarget);
        await save({ operation: 'lead', id: editing.id, fullName: f.get('fullName'), email: f.get('email'), phone: f.get('phone'), stage: f.get('stage'), nextFollowUp: clinicDate(f.get('nextFollowUp')) });
      }}>
        <label>Nome<input name="fullName" className={field} required minLength={2} maxLength={160} defaultValue={editing.full_name}/></label>
        <label>E-mail<input name="email" type="email" className={field} maxLength={254} defaultValue={editing.email}/></label>
        <label>WhatsApp<input name="phone" type="tel" className={field} maxLength={40} defaultValue={editing.phone_whatsapp}/></label>
        <label>Etapa<select aria-label="Etapa" name="stage" className={field} defaultValue={editing.stage ?? 'new'}>{editing.stage && ['paid','awaiting_payment'].includes(editing.stage) && <option value={editing.stage}>{labels[editing.stage]}</option>}{commercialStages.map(stage => <option key={stage} value={stage}>{labels[stage]}</option>)}</select></label>
        <label>Próximo contato (horário de Brasília)<input name="nextFollowUp" type="datetime-local" className={field} defaultValue={localDate(editing.next_follow_up_at)}/></label>
        <div className="flex items-end gap-4"><button disabled={busy} className={button}>Salvar oportunidade</button><button type="button" disabled={busy} onClick={() => setEditing(null)}>Cancelar</button></div>
      </form>
    </section>}
    {view === 'summary' ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(data.counts ?? {}).map(([key, value]) => <div key={key} className={card}><p className="text-sm text-slate-500">{{ leads: 'Leads cadastrados', new_leads: 'Novos contatos', patients: 'Pacientes', today: 'Atendimentos hoje', pending: 'Solicitações pendentes' }[key]}</p><p className="mt-3 text-3xl font-bold text-[#103E6A]">{value}</p></div>)}</div>
      <section className={card}><h2 className="font-bold text-[#103E6A]">Do contato à consulta</h2><p className="mt-2 text-sm leading-6 text-slate-500">Cadastre o paciente, acompanhe a oportunidade no Kanban e confirme o agendamento. Registre o próximo contato para dar continuidade a cada atendimento.</p>{permissions.includes('crm.leads.read') && <button onClick={() => showKanban()} className={`${button} mt-4`}>Abrir Kanban</button>}</section>
    </> : <>
      <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-semibold">Pesquisar por nome ou contato<input disabled={busy} className={field} value={q} onChange={event => { setQ(event.target.value); setOffset(0); setLoading(true); }} placeholder="Pesquisar..."/></label>{q && <button disabled={busy} className="rounded-xl border bg-white px-4 py-3 text-sm" onClick={() => { setQ(''); setOffset(0); }}>Limpar pesquisa</button>}</div>
      {loading && <p className="text-sm text-slate-500">Carregando registros…</p>}
      {view === 'leads' ? <>
        <p className="text-sm text-slate-500">Arraste os cartões entre as etapas ou use “Mover para”. Para concluir, use “Agendar consulta”.</p>
        <CrmKanban items={items} counts={data.stageCounts ?? {}} busy={busy || loading} canManage={canLead} canRegister={canRegister && canLead} canSchedule={canSchedule} focusSingleCard={Boolean(q)}
          onMove={moveLead} onEdit={row => setEditing(row)} onRegister={registerFromLead} onSchedule={scheduleFromLead}/>
      </> : <section className={card}><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">{view === 'patients' ? 'Paciente' : 'Registro'}</th><th className="px-3">{view === 'history' ? 'Alteração' : 'Contato / profissional'}</th><th className="px-3">{view === 'patients' ? 'Nascimento / idade' : 'Status / data'}</th><th className="px-3">Ações</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className="border-b border-slate-100">
          <td className="px-3 py-4 font-semibold">{item.full_name || item.patient_name}</td>
          <td className="px-3 py-4 text-slate-500">{view === 'history' ? `${labels[item.old_stage ?? ''] || '—'} → ${labels[item.new_stage ?? ''] || '—'}` : <>{item.doctor_name || item.email || '—'}<br/>{item.phone_whatsapp}</>}</td>
          <td className="px-3 py-4">{view === 'patients' ? item.birth_date ? <>{item.birth_date.split('-').reverse().join('/')}<p className="mt-1 text-xs text-slate-500">{patientAge(item.birth_date)} anos</p></> : 'Não informado' : <>{labels[item.stage || item.status || ''] || item.event_type || 'Cadastrado'}<p className="mt-1 text-xs text-slate-500">{date(item.scheduled_for || item.next_follow_up_at || item.created_at)}</p></>}</td>
          <td className="px-3 py-4"><div className="flex min-w-28 flex-col items-start gap-3 font-semibold text-[#14508B]">
            {view === 'patients' && <><button disabled={busy} onClick={() => openPatient(item)}>{canRegister ? 'Ver / editar cadastro' : 'Ver cadastro'}</button>{canLead && <button disabled={busy} onClick={async () => { if (await save({ operation: sourceLead ? 'link_patient' : 'patient_lead', id: sourceLead, patientId: item.id })) showKanban(item.full_name); }}>{sourceLead ? 'Vincular à oportunidade' : 'Abrir no CRM'}</button>}</>}
            {view === 'appointments' && canSchedule && <button disabled={busy} onClick={() => setEditing(item)}>Editar</button>}
          </div></td>
        </tr>)}</tbody></table></div>{!loading && !items.length && <p className="py-10 text-center text-sm text-slate-500">Nenhum registro encontrado nesta área.</p>}</section>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><button disabled={!offset || busy || loading} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40" onClick={() => { setOffset(Math.max(0, offset - 100)); setLoading(true); }}>← Anterior</button><span>{items.length ? `${offset + 1}–${offset + items.length}` : '0'}{data.total !== undefined ? ` de ${data.total}` : ' registros'} · até 100 por página</span><button disabled={busy || loading || (data.total !== undefined ? offset + items.length >= data.total : items.length < 100)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40" onClick={() => { setOffset(offset + 100); setLoading(true); }}>Seguinte →</button></div>
    </>}
    {view === 'appointments' && canSchedule && <section ref={editorRef} className={`${card} scroll-mt-20`}><h2 className="mb-4 text-lg font-bold">{editing?.id ? 'Organizar atendimento' : 'Novo agendamento'}</h2>
      <p className="mb-4 text-xs text-slate-500">Datas e horários de Brasília.</p>
      {!editing?.patient_id && <label className="text-sm">Localizar paciente<input className={field} value={patientSearch} onChange={event => setPatientSearch(event.target.value)} placeholder="Nome ou contato do paciente"/></label>}
      <form key={editing?.id ?? editing?.lead_id ?? 'new-appointment'} className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget; const f = new FormData(form);
        if (await save({ operation: 'appointment', id: editing?.id, leadId: editing?.lead_id, patientId: editing?.patient_id || f.get('patientId'), doctorId: f.get('doctorId'), status: f.get('status'), scheduledFor: clinicDate(f.get('scheduledFor')), modality: f.get('modality') })) form.reset();
      }}>
        <label>Paciente{editing?.patient_id ? <p className="mt-3 font-semibold">{editing.patient_name}</p> : <select aria-label="Paciente" name="patientId" required className={field}><option value="">Selecione um paciente cadastrado</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}</select>}</label>
        <label>Médico<select aria-label="Médico" name="doctorId" className={field} defaultValue={editing?.doctor_id || ''}><option value="">A definir</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>)}</select></label>
        <label>Data e horário<input name="scheduledFor" type="datetime-local" className={field} defaultValue={localDate(editing?.scheduled_for)}/></label>
        <label>Status<select aria-label="Status" name="status" className={field} defaultValue={editing?.status || 'requested'}>{editing?.status && ['paid','awaiting_payment'].includes(editing.status) && <option value={editing.status}>{labels[editing.status]}</option>}{['requested','confirmed','cancelled','rescheduled','attended','no_show'].map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
        <label>Modalidade<select aria-label="Modalidade" name="modality" className={field} defaultValue={editing?.modality || 'in_person'}><option value="in_person">Presencial</option><option value="telemedicine">Teleconsulta</option></select></label>
        <div className="flex items-end gap-4"><button disabled={busy} className={button}>Salvar agendamento</button>{editing && <button type="button" disabled={busy} onClick={() => setEditing(null)}>Cancelar edição</button>}</div>
      </form>
    </section>}
    {view === 'agenda' && <section className={card}><h2 className="text-lg font-bold">Compromissos da equipe</h2><div className="my-4 space-y-3">{events.map(event => <div key={event.id} className="rounded-xl border border-slate-200 p-3"><p className="font-semibold">{event.title}</p><p className="text-sm text-slate-500">{date(event.starts_at)} · {event.location || 'Local a definir'}</p></div>)}{!events.length && <p className="text-sm text-slate-500">Nenhum compromisso operacional cadastrado.</p>}</div>
      {canSchedule && <form className="grid gap-4 md:grid-cols-3" onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget; const f = new FormData(form);
        if (await save({ operation: 'event', title: f.get('title'), startsAt: clinicDate(f.get('startsAt')), location: f.get('location') })) form.reset();
      }}><label>Compromisso<input name="title" className={field} required minLength={2} maxLength={160}/></label><label>Data e horário (Brasília)<input name="startsAt" type="datetime-local" className={field} required/></label><label>Local<input name="location" className={field} maxLength={160}/></label><button className={button} disabled={busy}>Compartilhar compromisso</button></form>}
    </section>}
  </div>;
}
