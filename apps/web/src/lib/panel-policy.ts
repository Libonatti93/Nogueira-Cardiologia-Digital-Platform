export const panelHost = 'painel.nogueiracardiologia.com.br';
export const panelOrigin = `https://${panelHost}`;

type Access = { permissions?: string[]; mustChangePassword?: boolean };
export function panelLanding(user: Access) {
  if (!user.permissions?.includes('panel.access')) return '/acesso?denied=1';
  if (user.mustChangePassword) return '/alterar-senha';
  if (user.permissions.includes('internal.access')) return '/dashboard';
  if (user.permissions.includes('crm.access')) return '/crm';
  if (user.permissions.includes('lios.read')) return '/lios';
  if (user.permissions.includes('governance.read')) return '/governanca';
  if (user.permissions.includes('audit.read')) return '/auditoria';
  return '/sem-acesso';
}

export const panelNavigation = [
  {label:'Dashboard',href:'/dashboard',permission:'internal.access',icon:'▦'},
  {label:'CRM',href:'/crm',permission:'crm.access',icon:'◫'},
  {label:'Agenda',href:'/crm?view=agenda',permission:'crm.appointments.read',icon:'▤'},
  {label:'Pacientes',href:'/crm?view=patients',permission:'crm.patients.read',icon:'♧'},
  {label:'Consultas',href:'/crm?view=appointments',permission:'crm.appointments.read',icon:'◷'},
  {label:'Exames',href:'/dashboard#exames',permission:'exams.read',icon:'▧'},
  {label:'Financeiro',href:'/dashboard#financeiro',permission:'internal.access',icon:'◈'},
  {label:'Conteúdo',href:'/dashboard#públicar',permission:'content.manage',icon:'▱'},
  {label:'LIOS',href:'/lios',permission:'lios.read',icon:'✧'},
  {label:'Governança & IAM',href:'/governanca',permission:'governance.read',icon:'◎'},
  {label:'Auditoria',href:'/auditoria',permission:'audit.read',icon:'≡'},
  {label:'Configurações',href:'/configuracoes',permission:'governance.manage',icon:'⚙'},
] as const;

export function validInternalPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && new TextEncoder().encode(value).length <= 72;
}
