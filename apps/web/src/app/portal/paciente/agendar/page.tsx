import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { PatientScheduleCheckout } from '@/components/portal/patient-schedule-checkout';
import { requirePatientUser } from '@/lib/auth';
import { getAppointmentPaymentAmountCents } from '@/lib/asaas';
import { query } from '@/lib/db';
import { SchedulingHelp } from '@/components/portal/scheduling-help';

export default async function PatientSchedulePage() {
  const user = await requirePatientUser();
  const amountCents = getAppointmentPaymentAmountCents();
  const occupiedSlots = await query<{ doctor_key: string; scheduled_for: Date }>(
    `
      select
        case when doctors.full_name ilike '%Cristiani%' then 'cristiani' else 'paulo' end as doctor_key,
        appointments.scheduled_for
      from appointments
      join doctors on doctors.id = appointments.doctor_id
      where appointments.scheduled_for >= now()
        and appointments.scheduled_for < now() + interval '45 days'
        and appointments.status not in ('cancelled', 'no_show')
    `,
  );

  return (
    <PortalShell patientName={user.fullName}>
      <div className="max-w-4xl">
        <p className="text-sm font-semibold text-[#15A7DD]">Agendar consulta</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F3760] sm:text-4xl">
          Escolha o médico, o dia e o horário.
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          É simples: escolha o cardiologista, selecione o melhor dia e toque no horário desejado. Depois, confira seus dados e escolha pagar por PIX ou cartão de crédito em 1x.
        </p>
        <Link href="/portal/paciente" className="mt-4 inline-flex text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
          ← Voltar para o início
        </Link>
      </div>

      <PatientScheduleCheckout
        user={{ fullName: user.fullName, email: user.email }}
        amountCents={amountCents}
        occupiedSlots={occupiedSlots.rows.map((slot) => ({
          doctor: slot.doctor_key,
          iso: slot.scheduled_for.toISOString(),
        }))}
      />
      <SchedulingHelp />
    </PortalShell>
  );
}
