'use client';
import { useEffect, useRef, useState } from 'react';
import { brazilStates, patientAge, patientSexOptions, todayInBrazil } from '@/lib/crm-patient';
import { crmButton, crmCard, crmField, type CrmRow } from './crm-types';

export function CrmPatientForm({ patient, busy, canEdit, canAddToCrm, leadId, onSave, onCancel, onUseExisting }: {
  patient: Partial<CrmRow>; busy: boolean; canEdit: boolean; canAddToCrm: boolean; leadId?: string;
  onSave: (body: Record<string, unknown>) => Promise<void>; onCancel: () => void;
  onUseExisting?: () => void;
}) {
  const [birthDate, setBirthDate] = useState(patient.birth_date ?? '');
  const section = useRef<HTMLElement>(null);
  const age = patientAge(birthDate);
  useEffect(() => { section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);
  return <section ref={section} className={`${crmCard} scroll-mt-20`}>
    <div className="mb-5 flex items-start justify-between gap-3"><div>
      <h2 className="text-xl font-bold text-[#103E6A]">{patient.id ? 'Cadastro do paciente' : 'Novo paciente'}</h2>
      <p className="mt-1 text-sm text-slate-500">Dados para organizar o atendimento e agendar a consulta.</p>
    </div><button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm">Fechar</button></div>
    {onUseExisting && <button type="button" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#14508B]" disabled={busy} onClick={onUseExisting}>Usar cadastro de paciente existente</button>}
    <form onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      await onSave({ operation: 'patient', id: patient.id, leadId, ...Object.fromEntries(data), addToCrm: Boolean(leadId) || data.get('addToCrm') === 'on' });
    }}>
      <fieldset disabled={busy || !canEdit} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="sm:col-span-2">Nome completo<input className={crmField} name="fullName" autoComplete="name" required minLength={2} maxLength={160} defaultValue={patient.full_name}/></label>
        <label>Data de nascimento<input className={crmField} name="birthDate" type="date" required min="1900-01-01" max={todayInBrazil()} value={birthDate} onChange={event => setBirthDate(event.target.value)}/></label>
        <div><span className="text-sm">Idade calculada</span><output aria-live="polite" className="mt-1 block rounded-xl bg-blue-50 px-3 py-3 font-semibold text-[#103E6A]">{age === null ? 'Informe a data de nascimento' : `${age} ${age === 1 ? 'ano' : 'anos'}`}</output></div>
        <label>Sexo<select aria-label="Sexo" className={crmField} name="sex" required defaultValue={patient.sex ?? ''}><option value="">Selecione</option>{patientSexOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Telefone / WhatsApp<input className={crmField} name="phone" type="tel" autoComplete="tel" required maxLength={40} placeholder="(11) 99999-9999" defaultValue={patient.phone_whatsapp}/></label>
        <label className="sm:col-span-2">E-mail<input className={crmField} name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={patient.email}/></label>
        <label>CEP<input className={crmField} name="postalCode" autoComplete="postal-code" inputMode="numeric" required pattern="[0-9]{5}-?[0-9]{3}" maxLength={9} placeholder="00000-000" defaultValue={patient.postal_code}/></label>
        <label className="sm:col-span-2">Rua / logradouro<input className={crmField} name="street" autoComplete="address-line1" required maxLength={160} defaultValue={patient.address_street}/></label>
        <label>Número<input className={crmField} name="number" required maxLength={20} placeholder="Número ou S/N" defaultValue={patient.address_number}/></label>
        <label>Complemento<input className={crmField} name="complement" autoComplete="address-line2" maxLength={120} defaultValue={patient.address_complement}/></label>
        <label>Bairro<input className={crmField} name="neighborhood" required maxLength={100} defaultValue={patient.address_neighborhood}/></label>
        <label>Cidade<input className={crmField} name="city" autoComplete="address-level2" required maxLength={100} defaultValue={patient.address_city}/></label>
        <label>UF<select aria-label="UF" className={crmField} name="state" autoComplete="address-level1" required defaultValue={patient.address_state ?? ''}><option value="">Selecione</option>{brazilStates.map(state => <option key={state}>{state}</option>)}</select></label>
        <div className="sm:col-span-2 lg:col-span-3"><label>Medicamentos em uso<textarea aria-label="Medicamentos em uso" className={crmField} name="medications" aria-describedby="medications-help" required maxLength={3000} rows={3} placeholder="Registre os medicamentos informados pelo paciente. Se não usa, escreva Nenhum; se não souber, Não informado." defaultValue={patient.medications}/></label><p id="medications-help" className="mt-1 text-xs text-slate-500">Informação declarada pelo paciente para o cadastro.</p></div>
        {canAddToCrm && !leadId && <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3"><input name="addToCrm" type="checkbox" defaultChecked={!patient.id}/>Adicionar ao funil comercial de consultas</label>}
      </fieldset>
      {canEdit && <div className="mt-5 flex flex-wrap items-center gap-4"><button disabled={busy} className={crmButton}>{busy ? 'Salvando…' : 'Salvar paciente'}</button><button type="button" disabled={busy} onClick={onCancel} className="text-sm text-slate-600">Cancelar</button>{leadId && <p className="text-sm text-slate-500">Este cadastro será vinculado à oportunidade selecionada.</p>}</div>}
    </form>
  </section>;
}
