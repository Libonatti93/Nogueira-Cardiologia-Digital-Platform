import Link from 'next/link';
import Image from 'next/image';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PatientCalendar } from '@/components/portal/patient-calendar';
import { getHealthNews } from '@/lib/health-news';
import { PatientPageGuide } from '@/components/portal/patient-page-guide';

export default async function PatientDashboardPage() {
  const user = await requirePatientUser();
  const [appointments, healthNews] = await Promise.all([
    query<{
    id: string;
    scheduled_for: Date | null;
    status: string;
    doctor_name: string | null;
    }>(
      `
        select appointments.id, appointments.scheduled_for, appointments.status::text, doctors.full_name as doctor_name
        from appointments
        join patient_profiles on patient_profiles.id = appointments.patient_id
        left join doctors on doctors.id = appointments.doctor_id
        where lower(patient_profiles.email::text) = lower($1)
          and appointments.status not in ('cancelled', 'attended', 'no_show')
        order by appointments.scheduled_for asc nulls last, appointments.created_at desc
        limit 24
      `,
      [user.email],
    ),
    getHealthNews(),
  ]);
  const nextAppointment = appointments.rows[0];

  return (
    <PortalShell patientName={user.fullName}>
      <section>
        <p className="text-sm font-semibold text-[#15A7DD]">Sua área de cuidado</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F3760] sm:text-4xl">
          Como podemos cuidar do seu coração hoje?
        </h1>

        <section className="relative mt-7 min-h-[175px] overflow-hidden rounded-3xl bg-[#0F3760] shadow-lg shadow-[#14508B]/15 sm:min-h-[205px]">
          <Image
            src="/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png"
            alt="Dra. Cristiani Nogueira e Dr. Paulo Nogueira na clínica"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover object-[center_22%] blur-[1.2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071F36]/90 via-[#0F3760]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071F36]/55 to-transparent" />
          <div className="relative flex min-h-[175px] max-w-xl flex-col justify-center p-5 text-white sm:min-h-[205px] sm:p-7">
            <span className="w-fit rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
              Nogueira Cardiologia
            </span>
            <h2 className="mt-3 text-xl font-semibold leading-tight sm:text-3xl">
              Cuidado próximo, experiência e tempo para ouvir você.
            </h2>
            <p className="mt-2 hidden max-w-md text-sm leading-5 text-white/82 sm:block">
              Escolha seu cardiologista e encontre o melhor horário para sua consulta de 60 minutos.
            </p>
            <Link href="/portal/paciente/agendar" className="mt-4 inline-flex w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0F3760] shadow-md hover:bg-[#EAF4FF]">
              Ver horários disponíveis
            </Link>
          </div>
        </section>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <Link href="/portal/paciente/agendar" className="group relative min-h-56 overflow-hidden rounded-2xl border border-[#14508B] bg-[#EAF4FF] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="relative z-10 flex h-full max-w-[58%] flex-col justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#14508B] text-white shadow-md shadow-[#14508B]/20" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                  <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" />
                  <path d="m9.2 15 1.8 1.8 4-4.1" />
                </svg>
              </span>
              <span className="mt-8">
                <h2 className="text-xl font-semibold text-[#0F3760]">Agendar consulta</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Escolha o médico, veja a agenda e marque o melhor horário.</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#14508B]">
                  Ver agenda <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </span>
              </span>
            </span>

            <span className="absolute -bottom-5 -right-3 w-[47%] rotate-[-4deg] rounded-2xl border border-[#14508B]/15 bg-white p-3 shadow-[0_20px_45px_-20px_rgba(15,55,96,0.35)] transition-transform group-hover:-translate-y-1 group-hover:rotate-0" aria-hidden>
              <span className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#14508B]">Agenda</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">Disponível</span>
              </span>
              <span className="mt-3 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((day) => (
                  <span key={day} className={`grid aspect-square place-items-center rounded-md text-[9px] font-bold ${day === 7 ? 'bg-[#14508B] text-white' : 'bg-[#F4F9FF] text-slate-500'}`}>
                    {day}
                  </span>
                ))}
              </span>
            </span>
          </Link>
          <Link href="/portal/paciente/exames" className="group relative min-h-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#14508B]/40 hover:shadow-md">
            <span className="relative z-10 flex h-full max-w-[58%] flex-col justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF4FF] text-[#14508B]" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9.5 12.8 5.8-5.8a3.2 3.2 0 0 1 4.5 4.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8-8" />
                </svg>
              </span>
              <span className="mt-8">
                <h2 className="text-xl font-semibold text-[#0F3760]">Meus exames</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Anexe laudos e imagens com segurança ou consulte seus arquivos.</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#14508B]">
                  Enviar arquivo <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </span>
              </span>
            </span>

            <span className="absolute -bottom-4 -right-2 w-[45%] rotate-3 rounded-2xl border-2 border-dashed border-[#15A7DD]/35 bg-[#F4F9FF] p-4 text-center shadow-[0_18px_40px_-24px_rgba(15,55,96,0.28)] transition-transform group-hover:-translate-y-1 group-hover:rotate-0" aria-hidden>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[#14508B] shadow-sm">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9.5 12.8 5.8-5.8a3.2 3.2 0 0 1 4.5 4.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8-8" />
                </svg>
              </span>
              <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#14508B]">Solte seu exame aqui</span>
              <span className="mt-1 block text-[9px] text-slate-500">PDF ou imagem</span>
            </span>
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#15A7DD]">Próxima consulta</p>
              <h2 className="mt-1 text-xl font-semibold text-[#0F3760]">
                {nextAppointment?.scheduled_for ? formatAppointmentDate(nextAppointment.scheduled_for) : 'Você ainda não tem uma consulta marcada'}
              </h2>
              {nextAppointment ? (
                <p className="mt-2 text-sm text-slate-600">
                  {nextAppointment.doctor_name ?? 'Cardiologista disponível'} · {appointmentStatus(nextAppointment.status)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Escolha um médico e encontre um horário que funcione para você.</p>
              )}
            </div>
            <Link href="/portal/paciente/agendar" className="inline-flex w-fit rounded-xl bg-[#EAF4FF] px-5 py-3 text-sm font-bold text-[#14508B] hover:bg-[#DCEEFF]">
              {nextAppointment ? 'Ver outros horários' : 'Ver agenda'}
            </Link>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <PatientCalendar
            appointments={appointments.rows
              .filter((appointment) => appointment.scheduled_for)
              .map((appointment) => ({
                id: appointment.id,
                scheduledFor: appointment.scheduled_for!.toISOString(),
                doctorName: appointment.doctor_name ?? 'Cardiologista',
                status: appointment.status,
              }))}
          />

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#15A7DD]">Saúde em pauta</p>
                <h2 className="mt-1 text-xl font-semibold text-[#0F3760]">Notícias para você</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF4FF] text-xl" aria-hidden="true">♡</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Conteúdo de fontes públicas e institucionais. Notícias não substituem orientação médica.</p>

            <div className="mt-5 divide-y divide-slate-100">
              {healthNews.map((item, index) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid grid-cols-[88px_1fr] gap-3 py-4 first:pt-0"
                >
                  <HealthNewsIcon index={index} />
                  <span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#15A7DD]">{item.source}</span>
                    <h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-slate-700 group-hover:text-[#14508B]">{item.title}</h3>
                    <span className="mt-2 inline-flex text-xs font-bold text-[#14508B]">Ler notícia ↗</span>
                  </span>
                </a>
              ))}
            </div>

            <Link href="/blog" className="mt-2 flex justify-center rounded-xl bg-[#EAF4FF] px-4 py-3 text-sm font-bold text-[#14508B] hover:bg-[#DCEEFF]">
              Ver conteúdos dos cardiologistas
            </Link>
          </aside>
        </div>
      </section>
      <PatientPageGuide variant="home" />
    </PortalShell>
  );
}

function formatAppointmentDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function appointmentStatus(status: string) {
  return ({
    requested: 'Aguardando confirmação',
    awaiting_payment: 'Aguardando pagamento',
    paid: 'Pagamento confirmado',
    confirmed: 'Consulta confirmada',
    rescheduled: 'Horário remarcado',
  } as Record<string, string>)[status] ?? 'Em acompanhamento';
}

function HealthNewsIcon({ index }: { index: number }) {
  const variants = [
    { background: 'from-sky-50 to-cyan-100', color: '#14508B', type: 'heart' },
    { background: 'from-emerald-50 to-teal-100', color: '#059669', type: 'shield' },
    { background: 'from-violet-50 to-indigo-100', color: '#6366F1', type: 'science' },
    { background: 'from-rose-50 to-orange-100', color: '#E11D48', type: 'pulse' },
  ] as const;
  const variant = variants[index % variants.length];

  return (
    <span className={`grid h-16 w-[88px] place-items-center rounded-xl border border-white bg-gradient-to-br ${variant.background} shadow-sm`}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-9 w-9" fill="none">
        {variant.type === 'heart' ? (
          <>
            <path d="M24 39S8 30.4 8 18.5C8 11.6 16.5 8 24 15c7.5-7 16-3.4 16 3.5C40 30.4 24 39 24 39Z" fill={variant.color} opacity=".16" />
            <path d="M24 38S9 29.9 9 18.8C9 12.7 16.5 9.2 24 16c7.5-6.8 15-3.3 15 2.8C39 29.9 24 38 24 38Z" stroke={variant.color} strokeWidth="3" strokeLinejoin="round" />
            <path d="M14 24h6l2.5-5 4 10 2.5-5h5" stroke={variant.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : variant.type === 'shield' ? (
          <>
            <path d="M24 6 39 12v11c0 9.5-6.2 15.7-15 19-8.8-3.3-15-9.5-15-19V12l15-6Z" fill={variant.color} opacity=".15" />
            <path d="M24 7 38 12.5V23c0 8.8-5.7 14.7-14 18-8.3-3.3-14-9.2-14-18V12.5L24 7Z" stroke={variant.color} strokeWidth="3" />
            <path d="M24 16v14M17 23h14" stroke={variant.color} strokeWidth="3" strokeLinecap="round" />
          </>
        ) : variant.type === 'science' ? (
          <>
            <path d="M19 7h10M21 7v12L11 36a3 3 0 0 0 2.6 4.5h20.8A3 3 0 0 0 37 36L27 19V7" stroke={variant.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 31h16" stroke={variant.color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="21" cy="34" r="2" fill={variant.color} />
            <circle cx="27" cy="27" r="2" fill={variant.color} />
          </>
        ) : (
          <>
            <circle cx="24" cy="24" r="17" fill={variant.color} opacity=".12" />
            <path d="M7 25h9l3-8 6 15 4-10 3 3h9" stroke={variant.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    </span>
  );
}
