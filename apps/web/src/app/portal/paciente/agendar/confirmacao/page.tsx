import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PaymentDetails = {
  id: string;
  appointment_id: string | null;
  status: string;
  amount_cents: number;
  checkout_url: string | null;
  paid_at: Date | null;
  created_at: Date;
};

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pagamento pendente',
  authorized: 'Pagamento autorizado',
  paid: 'Pagamento confirmado',
  overdue: 'Pagamento vencido',
  refunded: 'Pagamento reembolsado',
  cancelled: 'Pagamento cancelado',
  failed: 'Pagamento recusado',
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default async function PatientScheduleConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string | string[] }>;
}) {
  const user = await requirePatientUser();
  const params = await searchParams;
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;

  const paymentResult = paymentId
    ? await query<PaymentDetails>(
        `
          select
            payments.id,
            payments.appointment_id,
            payments.status::text,
            payments.amount_cents,
            payments.checkout_url,
            payments.paid_at,
            payments.created_at
          from payments
          join patient_profiles on patient_profiles.id = payments.patient_id
          where payments.id = $1
            and lower(patient_profiles.email::text) = lower($2)
          limit 1
        `,
        [paymentId, user.email],
      )
    : { rows: [] };
  const payment = paymentResult.rows[0];
  const isPaid = payment?.status === 'paid';

  return (
    <PortalShell>
      <section className="max-w-3xl rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Confirmação</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
          {payment ? paymentStatusLabel[payment.status] ?? 'Solicitação registrada' : 'Pagamento não encontrado'}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          {payment
            ? isPaid
              ? 'Seu pagamento foi confirmado e a equipe da Nogueira Cardiologia seguira com a confirmacao do horário.'
              : 'Sua solicitacao foi registrada. Se o emissor ainda estiver processando, acompanhe a confirmacao pelo portal ou finalize pela fatura do Asaas.'
            : 'Não encontramos esse pagamento para o usuário atual. Volte ao agendamento e tente novamente.'}
        </p>

        {payment ? (
          <dl className="mt-6 grid gap-4 rounded-2xl bg-[#F4F9FF] p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Valor</dt>
              <dd className="mt-1 text-lg font-semibold text-[#0F3760]">{formatMoney(payment.amount_cents)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Status</dt>
              <dd className="mt-1 text-lg font-semibold text-[#0F3760]">{paymentStatusLabel[payment.status] ?? payment.status}</dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {payment?.checkout_url && !isPaid ? (
            <a href={payment.checkout_url} className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
              Abrir fatura Asaas
            </a>
          ) : null}
          <Link href="/portal/paciente" className="inline-flex w-fit rounded-full border border-[#14508B]/20 px-6 py-3 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
            Voltar ao portal
          </Link>
        </div>
      </section>
    </PortalShell>
  );
}
