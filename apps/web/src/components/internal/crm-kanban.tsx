'use client';
import { useEffect, useRef } from 'react';
import { commercialStages, crmDate, crmLabels, type CrmRow } from './crm-types';

const colors: Record<string, string> = {
  new: 'border-t-sky-400', contact_started: 'border-t-blue-500', interested: 'border-t-violet-400',
  registered: 'border-t-amber-400', confirmed: 'border-t-emerald-500', reschedule: 'border-t-orange-400',
  lost: 'border-t-slate-400', awaiting_payment: 'border-t-amber-400', paid: 'border-t-emerald-500',
};

export function CrmKanban({ items, counts, busy, canManage, canRegister, canSchedule, focusSingleCard, onMove, onEdit, onRegister, onSchedule }: {
  items: CrmRow[]; counts: Record<string, number>; busy: boolean; canManage: boolean; canRegister: boolean; canSchedule: boolean;
  onMove: (row: CrmRow, stage: string) => void; onEdit: (row: CrmRow) => void;
  onRegister: (row: CrmRow) => void; onSchedule: (row: CrmRow) => void;
  focusSingleCard: boolean;
}) {
  const board = useRef<HTMLDivElement>(null);
  const singleCard = items.length === 1 ? `${items[0].id}:${items[0].stage}` : '';
  useEffect(() => {
    const container = board.current, card = container?.querySelector('article');
    if (focusSingleCard && singleCard && container && card) container.scrollTo({ left: card.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft - 12, behavior: 'auto' });
  }, [focusSingleCard, singleCard]);
  const stages = [...commercialStages, ...['awaiting_payment', 'paid'].filter(stage => counts[stage])];
  return <div ref={board} role="region" aria-label="Kanban comercial de consultas" tabIndex={0} className="max-w-full overflow-x-auto rounded-2xl pb-4 focus-visible:outline-2 focus-visible:outline-blue-500">
    <div className="flex min-w-max items-start gap-4">
      {stages.map(stage => {
        const cards = items.filter(item => item.stage === stage);
        return <section key={stage} aria-label={crmLabels[stage]} className={`w-[280px] shrink-0 rounded-2xl border border-t-4 bg-slate-100/80 ${colors[stage]}`}
          onDragOver={event => { if (canManage && !busy && commercialStages.includes(stage)) event.preventDefault(); }}
          onDrop={event => {
            event.preventDefault();
            if (!canManage || busy || !commercialStages.includes(stage)) return;
            const row = items.find(item => item.id === event.dataTransfer.getData('text/plain'));
            if (row && row.stage !== stage && commercialStages.includes(row.stage ?? '')) onMove(row, stage);
          }}>
          <div className="flex items-center justify-between gap-2 px-4 py-4"><h2 className="text-sm font-bold text-[#103E6A]">{crmLabels[stage]}</h2><span aria-label={`${counts[stage] ?? 0} oportunidades`} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{counts[stage] ?? 0}</span></div>
          <div className="min-h-40 space-y-3 px-3 pb-3">{cards.map(row => {
            const movable = canManage && !busy && commercialStages.includes(row.stage ?? '');
            return <article key={row.id} aria-label={`Oportunidade de ${row.full_name}`} draggable={movable}
              onDragStart={event => { event.dataTransfer.setData('text/plain', row.id); event.dataTransfer.effectAllowed = 'move'; }}
              className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${movable ? 'cursor-grab active:cursor-grabbing' : ''}`}>
              <h3 className="break-words font-semibold text-slate-900">{row.full_name}</h3>
              <p className="mt-1 text-xs text-slate-500">{row.patient_id ? 'Paciente cadastrado' : 'Cadastro pendente'} · {row.source === 'crm' ? 'Equipe' : row.source}</p>
              <div className="mt-3 space-y-1 break-words text-sm text-slate-600">{row.phone_whatsapp && <p><a draggable={false} className="text-[#14508B] underline-offset-2 hover:underline" href={`tel:${row.phone_whatsapp.replace(/[^+0-9]/g, '')}`}>{row.phone_whatsapp}</a></p>}{row.email && <p>{row.email}</p>}</div>
              {row.next_follow_up_at && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Próximo contato: {crmDate(row.next_follow_up_at)}</p>}
              {row.scheduled_for && <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900">Consulta: {crmDate(row.scheduled_for)}</p>}
              <div className="mt-4 flex flex-col items-start gap-3 text-xs font-semibold text-[#14508B]">
                {canManage && <button disabled={busy} onClick={() => onEdit(row)}>Editar contato / retorno</button>}
                {!row.patient_id && canRegister && <button disabled={busy} onClick={() => onRegister(row)}>Cadastrar paciente</button>}
                {row.patient_id && canSchedule && <button disabled={busy} onClick={() => onSchedule(row)}>{row.appointment_id ? 'Ver / editar consulta' : 'Agendar consulta'}</button>}
              </div>
              {canManage && commercialStages.includes(stage) && <label className="mt-4 block text-xs text-slate-500">Mover para<select aria-label={`Etapa de ${row.full_name}`} disabled={busy} value={stage} onChange={event => onMove(row, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700">{commercialStages.map(value => <option key={value} value={value}>{crmLabels[value]}</option>)}</select></label>}
            </article>;
          })}{!cards.length && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500">{counts[stage] ? 'Oportunidades nas outras páginas' : 'Nenhuma oportunidade nesta etapa'}</p>}</div>
        </section>;
      })}
    </div>
  </div>;
}
