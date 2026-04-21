import Image from 'next/image';

const authorityPillars = [
  {
    title: 'Autoridade clínica',
    description: 'Condução médica com rigor técnico, decisões individualizadas e comunicação clara em cada consulta.',
  },
  {
    title: 'Tecnologia em cardiologia',
    description:
      'Estrutura orientada por recursos diagnósticos modernos para apoiar decisões seguras e acompanhamento preciso.',
  },
  {
    title: 'Cuidado humanizado',
    description: 'Jornada assistencial acolhedora, com atenção aos detalhes e foco na confiança de longo prazo.',
  },
];

const doctors = [
  {
    name: 'Dr. Paulo Nogueira',
    crm: 'CRM 53.790/SP',
    bio: 'Atendimento cardiológico com avaliação clínica individualizada e foco em prevenção e acompanhamento contínuo.',
  },
  {
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    crm: 'CRM 77.127/SP',
    bio: 'Condução médica humanizada, com atenção aos fatores de risco e plano terapêutico alinhado ao perfil de cada paciente.',
  },
];

const whatsappLink = 'https://wa.me/5517997440223';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#14508B]/15 bg-white p-1.5">
              <Image
                src="/brand/nogueira-cardiologia-logo.svg"
                alt="Logo Nogueira Cardiologia"
                width={96}
                height={96}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#14508B]">Nogueira Cardiologia</p>
              <p className="text-xs text-slate-500">Clínica de referência em cardiologia</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 lg:flex">
            <a href="#inicio" className="transition-colors hover:text-[#14508B]">
              Início
            </a>
            <a href="#autoridade" className="transition-colors hover:text-[#14508B]">
              Autoridade
            </a>
            <a href="#corpo-clinico" className="transition-colors hover:text-[#14508B]">
              Corpo clínico
            </a>
            <a href="#clinica" className="transition-colors hover:text-[#14508B]">
              Clínica
            </a>
            <a href="#contato" className="transition-colors hover:text-[#14508B]">
              Contato
            </a>
          </nav>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11457B]"
          >
            Agende sua consulta
          </a>
        </div>
      </header>

      <main>
        <section
          id="inicio"
          className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-24"
        >
          <div>
            <span className="inline-flex rounded-full border border-[#14508B]/15 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#14508B]">
              Cardiologia com excelência e confiança
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-[#103E6A] md:text-5xl lg:text-6xl">
              Cuidado cardiovascular premium com autoridade médica e atendimento humanizado.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              Na Nogueira Cardiologia, você encontra estrutura moderna, abordagem ética e acompanhamento clínico
              próximo para cuidar da sua saúde com segurança e clareza.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11457B]"
              >
                Agende sua consulta
              </a>
              <a
                href="#contato"
                className="inline-flex items-center justify-center rounded-full border border-[#14508B]/20 bg-white px-7 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/40"
              >
                Ver informações de contato
              </a>
            </div>
          </div>

          <aside className="overflow-hidden rounded-3xl border border-[#14508B]/10 bg-white shadow-[0_20px_60px_-30px_rgba(20,80,139,0.35)]">
            <div className="border-b border-[#14508B]/10 bg-gradient-to-r from-[#103E6A] via-[#14508B] to-[#15A7DD] p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">Identidade institucional</p>
              <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-2xl bg-white px-6 py-4 shadow-inner">
                <Image
                  src="/brand/nogueira-cardiologia-logo.svg"
                  alt="Nogueira Cardiologia"
                  width={420}
                  height={140}
                  className="h-20 w-full object-contain"
                />
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#14508B]">Agendamento rápido</p>
              <div className="mt-5 space-y-3">
                {[
                  'Atendimento em cardiologia com foco em segurança clínica.',
                  'Contato direto para agendamento por telefone ou WhatsApp.',
                  'Equipe preparada para orientar o próximo passo da sua consulta.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-[#F5F8FC] p-4 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="autoridade" className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#103E6A] md:text-4xl">Autoridade médica e confiança institucional</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Estruturamos a clínica para unir excelência assistencial, segurança diagnóstica e experiência premium em
              todos os pontos de contato com o paciente.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {authorityPillars.map((item) => (
                <article key={item.title} className="rounded-2xl border border-[#14508B]/10 bg-[#F7FAFE] p-6">
                  <h3 className="text-lg font-semibold text-[#14508B]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="corpo-clinico" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#14508B]">Corpo clínico</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#103E6A] md:text-4xl">Equipe médica da Nogueira Cardiologia</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-right md:text-base">
                Atendimento cardiológico com compromisso ético, clareza terapêutica e atenção personalizada.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <article
                  key={doctor.name}
                  className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white shadow-[0_18px_45px_-32px_rgba(20,80,139,0.55)]"
                >
                  <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
                    <div className="flex min-h-[220px] items-center justify-center border-b border-dashed border-[#14508B]/20 bg-gradient-to-b from-[#EDF4FB] to-[#F8FBFF] sm:min-h-full sm:border-b-0 sm:border-r">
                      <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#14508B]/80">
                        Espaço para foto oficial
                      </span>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15A7DD]">Cardiologia</p>
                      <h3 className="mt-2 text-xl font-semibold text-[#103E6A]">{doctor.name}</h3>
                      <p className="mt-1 text-sm font-medium text-[#14508B]">{doctor.crm}</p>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="clinica" className="bg-white py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-[#103E6A] via-[#14508B] to-[#15A7DD] p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/85">Estrutura clínica</p>
              <h2 className="mt-3 text-3xl font-semibold">Ambiente preparado para cuidado cardiovascular completo</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                Consultas com organização assistencial, comunicação objetiva e foco em uma experiência segura para o
                paciente e sua família.
              </p>
            </div>

            <div className="rounded-3xl border border-[#14508B]/12 bg-[#F7FAFE] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#14508B]">Facilidade para agendar</p>
              <div className="mt-5 space-y-4">
                {[
                  'Agende sua consulta por WhatsApp em poucos passos.',
                  'Também atendemos por telefone para orientação de horário.',
                  'Localização de fácil acesso em São José do Rio Preto.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-[#14508B]/10">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="agendamento" className="bg-[#14508B] py-16">
          <div className="mx-auto w-full max-w-4xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Agendar sua consulta é simples e rápido</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
              Fale com a equipe da Nogueira Cardiologia e solicite seu horário com praticidade para iniciar seu
              acompanhamento cardiovascular.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:bg-[#F8F8F9]"
            >
              Agendar pelo WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0F3760] py-10 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 text-sm lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-base font-semibold">Nogueira Cardiologia</p>
            <p className="mt-2 text-white/80">Cuidado cardiológico com foco em ética, segurança clínica e excelência médica.</p>
          </div>
          <div>
            <p className="font-semibold">Contato</p>
            <p className="mt-2 text-white/80">Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895</p>
            <p className="mt-2 text-white/80">Telefone: (17) 2139-8338</p>
            <p className="text-white/80">WhatsApp: (17) 99744-0223</p>
            <p className="text-white/80">contato@nogueiracardiologia.com.br</p>
          </div>
          <div className="lg:text-right">
            <p className="text-white/80">© {new Date().getFullYear()} Nogueira Cardiologia</p>
            <p className="mt-1 text-white/70">Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Fale conosco no WhatsApp"
        title="Fale conosco no WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.03]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
          <path d="M20.52 3.48A11.79 11.79 0 0 0 12.09 0C5.53 0 .2 5.33.2 11.9c0 2.1.55 4.16 1.6 5.98L0 24l6.27-1.65a11.84 11.84 0 0 0 5.82 1.48h.01c6.56 0 11.9-5.33 11.9-11.9 0-3.17-1.24-6.15-3.48-8.45Zm-8.43 18.3h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.24-.37a9.9 9.9 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89a9.8 9.8 0 0 1 7 2.9 9.81 9.81 0 0 1 2.9 7c0 5.45-4.44 9.88-9.9 9.88Zm5.43-7.42c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.18.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.04-1.06 2.53s1.09 2.92 1.24 3.12c.15.2 2.13 3.24 5.16 4.54.72.31 1.28.49 1.72.62.72.23 1.37.2 1.89.12.58-.09 1.8-.73 2.06-1.44.25-.71.25-1.32.18-1.44-.08-.12-.28-.2-.58-.35Z" />
        </svg>
      </a>
    </div>
  );
}
