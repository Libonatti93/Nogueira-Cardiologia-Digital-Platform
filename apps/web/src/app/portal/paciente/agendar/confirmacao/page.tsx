import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PixPaymentDetails } from '@/components/portal/pix-payment-details';

export const dynamic = 'force-dynamic';

type PaymentDetails = {
  id: string;
  appointment_id: string | null;
  status: string;
  amount_cents: number;
  checkout_url: string | null;
  paid_at: Date | null;
  created_at: Date;
  scheduled_for: Date | null;
  doctor_name: string | null;
  billing_type: string | null;
  pix_qr_code: string | null;
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
            payments.created_at,
            appointments.scheduled_for,
            doctors.full_name as doctor_name
            , payments.billing_type
            , payments.pix_qr_code
          from payments
          join patient_profiles on patient_profiles.id = payments.patient_id
          left join appointments on appointments.id = payments.appointment_id
          left join doctors on doctors.id = appointments.doctor_id
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
    <PortalShell patientName={user.fullName}>
      <section className="max-w-3xl rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Confirmação</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
          {payment ? (isPaid ? 'Consulta reservada' : paymentStatusLabel[payment.status] ?? 'Consulta solicitada') : 'Consulta não encontrada'}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          {payment
            ? isPaid
              ? 'Tudo certo. Seu horário e seu pagamento foram registrados. Você pode enviar seus exames antes do atendimento.'
              : 'Seu horário foi selecionado e o pagamento ainda está em processamento. Você pode acompanhar ou concluir pela opção abaixo.'
            : 'Não encontramos essa consulta na sua conta. Volte à agenda e tente novamente.'}
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
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Data e horário</dt>
              <dd className="mt-1 text-base font-semibold text-[#0F3760]">{formatAppointment(payment.scheduled_for)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Cardiologista</dt>
              <dd className="mt-1 text-base font-semibold text-[#0F3760]">{payment.doctor_name ?? 'A confirmar'}</dd>
            </div>
          </dl>
        ) : null}

        {payment?.billing_type === 'PIX' && payment.pix_qr_code && !isPaid ? (
          <PixPaymentDetails code={payment.pix_qr_code} checkoutUrl={payment.checkout_url} />
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {payment?.checkout_url && !isPaid && (payment.billing_type !== 'PIX' || !payment.pix_qr_code) ? (
            <a href={payment.checkout_url} className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
              Abrir pagamento seguro
            </a>
          ) : null}
          {payment ? (
            <Link href="/portal/paciente/exames" className="inline-flex w-fit rounded-full bg-[#EAF4FF] px-6 py-3 text-sm font-bold text-[#14508B] hover:bg-[#DCEEFF]">
              Enviar exames
            </Link>
          ) : null}
          <Link href="/portal/paciente" className="inline-flex w-fit rounded-full border border-[#14508B]/20 px-6 py-3 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
            Voltar ao portal
          </Link>
        </div>
      </section>
    </PortalShell>
  );
}

function formatAppointment(value: Date | null) {
  if (!value) return 'Horário a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}
