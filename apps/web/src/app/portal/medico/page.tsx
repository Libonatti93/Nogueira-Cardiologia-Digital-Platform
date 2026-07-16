import { PortalShell } from '@/components/dashboard/portal-shell';
import { doctorMetrics, riskSummary, todayAppointments } from '@/data/dashboard';

export default function DoctorDashboardPage() {
  return (
    <PortalShell>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Dashboard médico</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
          Visão completa da operação digital da Nogueira Cardiologia.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Este painel consolida leads, agendamentos, pagamentos, conteúdos educativos e perfil de risco dos pacientes para apoiar decisões clínicas e gerenciais.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {doctorMetrics.map(([label, value, detail]) => (
          <article key={label} className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">{label}</p>
            <strong className="mt-3 block text-3xl font-semibold text-[#0F3760]">{value}</strong>
            <p className="mt-2 text-sm text-slate-600">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
          <h2 className="text-2xl font-semibold text-[#0F3760]">Agenda do dia</h2>
          <div className="mt-5 grid gap-3">
            {todayAppointments.map((appointment) => (
              <article key={`${appointment.time}-${appointment.patient}`} className="grid gap-3 rounded-2xl bg-[#F4F9FF] p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                <span className="font-bold text-[#14508B]">{appointment.time}</span>
                <div>
                  <h3 className="font-semibold text-[#0F3760]">{appointment.patient}</h3>
                  <p className="text-sm text-slate-600">{appointment.doctor}</p>
                </div>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#14508B]">{appointment.status}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[#0A2C4D] p-6 text-white shadow-[0_26px_70px_-48px_rgba(20,80,139,0.85)]">
          <h2 className="text-2xl font-semibold">Resumo de risco cardiovascular</h2>
          <div className="mt-5 grid gap-3">
            {riskSummary.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/14 bg-white/8 px-4 py-3">
                <span className="text-sm text-white/82">{label}</span>
                <strong className="text-sm">{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PortalShell>
  );
}
