export type CrmRow = {
  id: string; full_name?: string; email?: string; phone_whatsapp?: string; stage?: string;
  source?: string; created_at?: string; next_follow_up_at?: string; patient_id?: string;
  patient_name?: string; doctor_id?: string; doctor_name?: string; scheduled_for?: string;
  status?: string; title?: string; starts_at?: string; location?: string; event_type?: string;
  old_stage?: string; new_stage?: string; actor?: string; birth_date?: string; sex?: string;
  postal_code?: string; address_street?: string; address_number?: string; address_complement?: string;
  address_neighborhood?: string; address_city?: string; address_state?: string; medications?: string;
  lead_id?: string; appointment_id?: string; appointment_status?: string; modality?: string;
};

export const crmLabels: Record<string, string> = {
  summary: 'Visão geral', leads: 'Kanban de consultas', patients: 'Pacientes', appointments: 'Consultas',
  agenda: 'Agenda', history: 'Histórico', new: 'Novo contato', contact_started: 'Em atendimento',
  interested: 'Interessado', registered: 'Agendar consulta', confirmed: 'Consulta agendada',
  reschedule: 'Reagendar', lost: 'Encerrado', requested: 'Solicitado', cancelled: 'Cancelado',
  rescheduled: 'Reagendado', attended: 'Atendido', no_show: 'Não compareceu', paid: 'Pago',
  awaiting_payment: 'Aguardando pagamento',
};
export const commercialStages = ['new','contact_started','interested','registered','confirmed','reschedule','lost'];
export const crmField = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-700';
export const crmButton = 'rounded-xl bg-[#14508B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
export const crmCard = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
export const crmDate = (value?: string) => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não agendado';
