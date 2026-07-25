import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PixPaymentDetails } from '@/components/portal/pix-payment-details';
import { PaymentStatusRefresh } from '@/components/portal/payment-status-refresh';

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
  modality: string;
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
            , appointments.modality
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
        <PaymentStatusRefresh active={Boolean(payment && !isPaid && ['pending', 'authorized'].includes(payment.status))} />

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
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Modalidade</dt>
              <dd className="mt-1 text-base font-semibold text-[#0F3760]">{payment.modality === 'telemedicine' ? 'Telemedicina • atendimento online' : 'Consulta presencial'}</dd>
            </div>
          </dl>
        ) : null}

        {payment?.billing_type === 'PIX' && payment.pix_qr_code && !isPaid ? (
          <PixPaymentDetails code={payment.pix_qr_code} checkoutUrl={payment.checkout_url} />
        ) : null}

        {isPaid ? (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-xl font-bold text-white" aria-hidden="true">✓</span>
              <div>
                <h2 className="text-lg font-semibold">Pagamento confirmado pelo Asaas</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-800">Seu horário foi registrado. Agora é só se preparar para a consulta.</p>
              </div>
            </div>
            {payment.modality === 'telemedicine' ? (
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#14508B]">Sua consulta será online</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  A secretaria dará sequência ao atendimento e enviará o link do Google Meet pelos seus canais cadastrados. No horário marcado, abra o link em um celular ou computador com câmera, microfone e internet.
                </p>
                <p className="mt-3 text-sm font-bold text-[#0F3760]">Entre no Google Meet 10 minutos antes para testar áudio e vídeo.</p>
              </div>
            ) : (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#14508B]">Endereço da clínica</p>
              <address className="mt-2 text-sm not-italic leading-6 text-slate-700">
                Nogueira Cardiologia<br />
                Av. José Munia, 7301 — Jardim Redentor<br />
                São José do Rio Preto — SP, CEP 15085-895
              </address>
              <p className="mt-3 text-sm font-bold text-[#0F3760]">Chegue com 20 minutos de antecedência.</p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Av.%20Jos%C3%A9%20Munia%2C%207301%2C%20S%C3%A3o%20Jos%C3%A9%20do%20Rio%20Preto%20SP"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-[#14508B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F3760]"
              >
                Abrir rota no Google Maps
              </a>
            </div>
            )}
          </section>
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
