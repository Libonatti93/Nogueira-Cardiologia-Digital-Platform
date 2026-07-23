import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { PatientScheduleCheckout } from '@/components/portal/patient-schedule-checkout';
import { requirePatientUser } from '@/lib/auth';
import { getAppointmentPaymentAmountCents } from '@/lib/asaas';

export default async function PatientSchedulePage() {
  const user = await requirePatientUser();
  const amountCents = getAppointmentPaymentAmountCents();

  return (
    <PortalShell>
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Agendamento</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
          Dados para solicitar sua consulta.
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Esta etapa confirma seus dados, registra a solicitacao e processa o pagamento com checkout transparente Asaas.
        </p>
        <Link href="/portal/paciente" className="mt-4 inline-flex text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
          Voltar ao portal
        </Link>
      </div>

      <PatientScheduleCheckout user={{ fullName: user.fullName, email: user.email }} amountCents={amountCents} />
    </PortalShell>
  );
}
