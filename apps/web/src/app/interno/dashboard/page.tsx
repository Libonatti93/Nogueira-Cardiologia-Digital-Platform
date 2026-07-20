import type { Metadata } from 'next';
import { InternalShell } from '@/components/internal/internal-shell';
import { requireInternalUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Dashboard Interna | Nogueira Cardiologia',
  description: 'Dashboard operacional da equipe interna da Nogueira Cardiologia.',
};

export const dynamic = 'force-dynamic';

type Metric = {
  label: string;
  value: string;
  detail: string;
};

type RecentUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
};

type RecentLead = {
  id: string;
  full_name: string;
  email: string | null;
  phone_whatsapp: string | null;
  stage: string;
  source: string;
  created_at: Date;
};

type RecentAppointment = {
  id: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string | null;
  status: string;
  scheduled_for: Date | null;
  created_at: Date;
};

type RecentPayment = {
  id: string;
  patient_name: string;
  status: string;
  amount_cents: number;
  provider: string;
  created_at: Date;
  paid_at: Date | null;
};

type StageRow = {
  stage: string;
  total: string;
};

const roleLabel: Record<string, string> = {
  patient: 'Paciente',
  secretary: 'Secretaria',
  doctor: 'Medico',
  admin: 'Admin',
};

const stageLabel: Record<string, string> = {
  new: 'Novo',
  contact_started: 'Contato iniciado',
  interested: 'Interessado',
  registered: 'Cadastrado',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  confirmed: 'Confirmado',
  reschedule: 'Reagendar',
  lost: 'Perdido',
};

const appointmentStatusLabel: Record<string, string> = {
  requested: 'Solicitada',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Paga',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  rescheduled: 'Reagendada',
  attended: 'Atendida',
  no_show: 'Faltou',
};

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  authorized: 'Autorizado',
  paid: 'Pago',
  overdue: 'Vencido',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
  failed: 'Falhou',
};

function formatDate(value: Date | null) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

async function getDashboardData() {
  const [metricsResult, usersResult, leadsResult, appointmentsResult, paymentsResult, stagesResult] = await Promise.all([
    query<{
      users_total: string;
      patients_total: string;
      leads_total: string;
      appointments_total: string;
      payments_paid_total: string;
      revenue_paid_cents: string;
      requested_appointments_total: string;
      pending_payments_total: string;
    }>(`
      select
        (select count(*) from app_users) as users_total,
        (select count(*) from patient_profiles) as patients_total,
        (select count(*) from leads) as leads_total,
        (select count(*) from appointments) as appointments_total,
        (select count(*) from payments where status = 'paid') as payments_paid_total,
        (select coalesce(sum(amount_cents), 0) from payments where status = 'paid') as revenue_paid_cents,
        (select count(*) from appointments where status = 'requested') as requested_appointments_total,
        (select count(*) from payments where status in ('pending', 'authorized', 'overdue')) as pending_payments_total
    `),
    query<RecentUser>(`
      select id, email, full_name, role::text, is_active, created_at, last_login_at
      from app_users
      order by created_at desc
      limit 8
    `),
    query<RecentLead>(`
      select id, full_name, email, phone_whatsapp, stage::text, source, created_at
      from leads
      order by created_at desc
      limit 8
    `),
    query<RecentAppointment>(`
      select
        appointments.id,
        patient_profiles.full_name as patient_name,
        patient_profiles.email as patient_email,
        doctors.full_name as doctor_name,
        appointments.status::text,
        appointments.scheduled_for,
        appointments.created_at
      from appointments
      join patient_profiles on patient_profiles.id = appointments.patient_id
      left join doctors on doctors.id = appointments.doctor_id
      order by appointments.created_at desc
      limit 8
    `),
    query<RecentPayment>(`
      select
        payments.id,
        patient_profiles.full_name as patient_name,
        payments.status::text,
        payments.amount_cents,
        payments.provider,
        payments.created_at,
        payments.paid_at
      from payments
      join patient_profiles on patient_profiles.id = payments.patient_id
      order by payments.created_at desc
      limit 8
    `),
    query<StageRow>(`
      select stage::text, count(*) as total
      from leads
      group by stage
      order by count(*) desc, stage
    `),
  ]);

  const row = metricsResult.rows[0];
  const metrics: Metric[] = [
    {
      label: 'Usuarios',
      value: row.users_total,
      detail: 'Contas criadas no portal',
    },
    {
      label: 'Pacientes',
      value: row.patients_total,
      detail: 'Perfis com dados clinicos',
    },
    {
      label: 'Leads',
      value: row.leads_total,
      detail: `${row.requested_appointments_total} consultas solicitadas`,
    },
    {
      label: 'Pagamentos',
      value: formatMoney(Number(row.revenue_paid_cents)),
      detail: `${row.payments_paid_total} pagos / ${row.pending_payments_total} pendentes`,
    },
  ];

  return {
    metrics,
    users: usersResult.rows,
    leads: leadsResult.rows,
    appointments: appointmentsResult.rows,
    payments: paymentsResult.rows,
    stages: stagesResult.rows,
  };
}

export default async function InternalDashboardPage() {
  const user = await requireInternalUser();
  const data = await getDashboardData();

  return (
    <InternalShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Medico / Admin</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
            Painel operacional da clinica.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Dados reais do PostgreSQL para acompanhar cadastros, pacientes, leads, consultas e pagamentos em uma unica tela.
          </p>
          <p className="mt-2 text-sm font-semibold text-[#14508B]">
            Logado como {user.fullName} ({user.email})
          </p>
        </div>
        <a href="/interno" className="w-fit rounded-lg border border-[#14508B]/20 px-4 py-2 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
          Trocar usuario
        </a>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{metric.label}</p>
            <strong className="mt-3 block text-3xl font-semibold text-[#0F3760]">{metric.value}</strong>
            <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]" id="consultas">
        <Panel title="Ultimas consultas" subtitle="Solicitacoes mais recentes feitas pelo portal do paciente.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Medico</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Criada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.appointments.length ? (
                  data.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="py-3 pr-4">
                        <strong className="block text-[#0F3760]">{appointment.patient_name}</strong>
                        <span className="text-xs text-slate-500">{appointment.patient_email}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{appointment.doctor_name ?? 'A definir'}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{appointmentStatusLabel[appointment.status] ?? appointment.status}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(appointment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={4} text="Nenhuma consulta registrada ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Funil de leads" subtitle="Distribuicao atual por etapa comercial." id="leads">
          <div className="grid gap-3">
            {data.stages.length ? (
              data.stages.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between gap-4 rounded-lg bg-[#F4F9FF] px-4 py-3">
                  <span className="text-sm font-semibold text-[#0F3760]">{stageLabel[stage.stage] ?? stage.stage}</span>
                  <strong className="text-sm text-[#14508B]">{stage.total}</strong>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-[#F4F9FF] px-4 py-3 text-sm text-slate-600">Nenhum lead registrado ainda.</p>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Ultimos usuarios" subtitle="Contas criadas no sistema." id="pacientes">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Perfil</th>
                  <th className="py-3 pr-4">Ativo</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <strong className="block text-[#0F3760]">{user.full_name}</strong>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{roleLabel[user.role] ?? user.role}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge>{user.is_active ? 'Sim' : 'Nao'}</StatusBadge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Ultimos leads" subtitle="Entradas recentes no funil da secretaria.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Lead</th>
                  <th className="py-3 pr-4">Origem</th>
                  <th className="py-3 pr-4">Etapa</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leads.length ? (
                  data.leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="py-3 pr-4">
                        <strong className="block text-[#0F3760]">{lead.full_name}</strong>
                        <span className="text-xs text-slate-500">{lead.phone_whatsapp ?? lead.email ?? 'Sem contato'}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{lead.source}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{stageLabel[lead.stage] ?? lead.stage}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(lead.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={4} text="Nenhum lead registrado ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-6" id="pagamentos">
        <Panel title="Pagamentos recentes" subtitle="Movimentacoes registradas pelo fluxo Asaas/webhook.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Provedor</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.length ? (
                  data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4 font-semibold text-[#0F3760]">{payment.patient_name}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatMoney(payment.amount_cents)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{paymentStatusLabel[payment.status] ?? payment.status}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{payment.provider}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={5} text="Nenhum pagamento registrado ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </InternalShell>
  );
}

function Panel({
  title,
  subtitle,
  id,
  children,
}: {
  title: string;
  subtitle: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_54px_-46px_rgba(20,80,139,0.72)]">
      <div>
        <h2 className="text-xl font-semibold text-[#0F3760]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-lg bg-[#EAF6FF] px-3 py-1 text-xs font-bold text-[#14508B]">
      {children}
    </span>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-sm text-slate-500">
        {text}
      </td>
    </tr>
  );
}
