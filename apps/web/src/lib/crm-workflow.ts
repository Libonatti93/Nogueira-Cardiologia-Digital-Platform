export const workflowStages = [
 ['entry','01. Entrada / Base'],['connection','02. Conexão'],['negotiation','03. Negociação'],
 ['follow_up','04. Prospecção / Follow-up'],['conditions','05. Orçamento / Condições'],
 ['scheduling','06. Agendamento'],['waiting','07. Aguardando consulta'],
 ['completed','08. Consulta realizada'],['post_sale','09. Pós-venda / POP 1'],
] as const;
export const relationshipLabels: Record<string,string> = {lead:'Lead',active:'Paciente ativo',follow_up:'Em acompanhamento',cold:'Frio / inativo',lost:'Perdido / não converteu',deceased:'Falecido'};
export const taskLabels: Record<string,string> = {follow_up:'Próximo contato',confirmation:'Confirmar consulta',pop_d3:'POP · D+3',pop_d6:'POP · D+6',pop_d180:'Continuidade · D+180',recovery_1:'Recuperação · contato 1',recovery_2:'Recuperação · contato 2',recovery_3:'Recuperação · encerramento',exam:'Acompanhar exames'};
export const objections = ['preço','tenho convênio','preciso falar com familiar','vou pensar','sem tempo','distância','prefere outro médico','não respondeu','horário','outros'];
export const sources = ['indicação','WhatsApp','telefone','site','redes sociais','campanhas','outros'];
export const appointmentLabels: Record<string,string> = {requested:'Solicitada',confirmed:'Confirmada',rescheduled:'Reagendada',cancelled:'Cancelada',attended:'Consulta realizada',no_show:'Não compareceu'};
export function clinicInput(value?:string|null) {
 if(!value)return '';
 return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(' ','T');
}
export function clinicIso(value:string) { return new Date(`${value}:00-03:00`).toISOString(); }
export function crmDate(value?:string|null) {return value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'—';}
