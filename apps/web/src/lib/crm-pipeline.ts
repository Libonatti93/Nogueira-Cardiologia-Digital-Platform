export const crmPipelineStages = ['new', 'contact_started', 'interested', 'registered', 'attended'] as const;
export type CrmPipelineStage = typeof crmPipelineStages[number];

export const crmPipelineLabels: Record<CrmPipelineStage, string> = {
  new: 'Entrada/Base',
  contact_started: 'Negociação/Prospecção',
  interested: 'Orçamento/Conexão',
  registered: 'Agendamento/Aguard. Consulta',
  attended: 'Consulta Realizada',
};

// Keep the stored commercial/financial statuses and group them for the operational board.
// Completion comes from the linked appointment, never from a payment or a scheduled date.
export function crmPipelineStage(row: { stage?: string; appointment_status?: string }): CrmPipelineStage {
  if (row.appointment_status === 'attended') return 'attended';
  switch (row.stage) {
    case 'contact_started': return 'contact_started';
    case 'interested': return 'interested';
    case 'registered':
    case 'confirmed':
    case 'reschedule':
    case 'awaiting_payment':
    case 'paid': return 'registered';
    default: return 'new';
  }
}
