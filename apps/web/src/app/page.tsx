const authorityPillars = [
  {
    title: 'Autoridade clínica',
    description: 'Condução médica com rigor técnico, decisões individualizadas e clareza terapêutica.',
  },
  {
    title: 'Tecnologia em diagnóstico',
    description: 'Apoio de recursos diagnósticos modernos para precisão e segurança na investigação cardiológica.',
  },
  {
    title: 'Experiência premium',
    description: 'Fluxo assistencial organizado, ambiente acolhedor e acompanhamento próximo em toda a jornada.',
  },
];

const doctors = [
  {
    name: 'Dr. Paulo Nogueira',
    crm: 'CRM 53.790/SP',
    role: 'Diretor clínico · Cardiologia',
    bio: 'Atuação focada em avaliação clínica detalhada, prevenção cardiovascular e acompanhamento contínuo de alta complexidade.',
  },
  {
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    crm: 'CRM 77.127/SP',
    role: 'Corpo clínico · Cardiologia',
    bio: 'Condução médica com abordagem humanizada, atenção aos fatores de risco e plano terapêutico personalizado.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7FB] via-[#F8FAFC] to-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-[#14508B]/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#14508B]/15 bg-[#14508B] text-xs font-bold tracking-[0.2em] text-white">
              LOGO
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
            href="#agendamento"
            className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11457B]"
          >
            Agendar consulta
          </a>
        </div>
      </header>

      <main>
        <section id="inicio" className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex rounded-full border border-[#14508B]/15 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#14508B]">
              Medicina cardiovascular de alto padrão
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-[#103E6A] md:text-5xl lg:text-6xl">
              Excelência cardiológica com confiança médica, tecnologia e cuidado individualizado.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              A Nogueira Cardiologia combina autoridade clínica, estrutura moderna e atendimento humano para oferecer
              uma experiência segura e premium em cada etapa da jornada do paciente.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#agendamento"
                className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11457B]"
              >
                Solicitar agendamento
              </a>
              <a
                href="#corpo-clinico"
                className="inline-flex items-center justify-center rounded-full border border-[#14508B]/20 bg-white px-7 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/40"
              >
                Conhecer médicos
              </a>
            </div>
          </div>

          <aside className="overflow-hidden rounded-3xl border border-[#14508B]/10 bg-white shadow-[0_20px_60px_-30px_rgba(20,80,139,0.35)]">
            <div className="border-b border-[#14508B]/10 bg-gradient-to-r from-[#0F3760] via-[#14508B] to-[#1A73AF] p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">Identidade oficial</p>
                <span className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/85">
                  logo institucional
                </span>
              </div>
              <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/35 bg-white/10 text-sm font-medium text-white/85">
                Espaço reservado para logo oficial da clínica
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#14508B]">Indicadores institucionais</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Equipe médica', 'Corpo clínico especializado'],
                  ['Diagnóstico', 'Tecnologia e precisão'],
                  ['Relacionamento', 'Confiança e acolhimento'],
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-2xl bg-[#F5F8FC] p-4">
                    <p className="text-sm font-semibold text-[#14508B]">{title}</p>
                    <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
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
              Estruturamos a clínica para unir excelência assistencial, segurança diagnóstica e percepção premium em
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
                Profissionais com atuação em cardiologia, compromisso ético e foco em atendimento personalizado.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <article
                  key={doctor.name}
                  className="overflow-hidden rounded-3xl border border-[#14508B]/12 bg-white shadow-[0_16px_40px_-28px_rgba(20,80,139,0.5)]"
                >
                  <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
                    <div className="flex min-h-[220px] items-center justify-center border-b border-dashed border-[#14508B]/20 bg-gradient-to-b from-[#EDF4FB] to-[#F8FBFF] sm:min-h-full sm:border-b-0 sm:border-r">
                      <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#14508B]/80">
                        Placeholder foto médica
                      </span>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#15A7DD]">Médico especialista</p>
                      <h3 className="mt-2 text-xl font-semibold text-[#103E6A]">{doctor.name}</h3>
                      <p className="mt-1 text-sm font-medium text-[#14508B]">{doctor.crm}</p>
                      <p className="mt-1 text-sm text-slate-500">{doctor.role}</p>
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
            <div className="rounded-3xl bg-gradient-to-br from-[#103E6A] via-[#14508B] to-[#1A73AF] p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/85">Ambiente clínico premium</p>
              <h2 className="mt-3 text-3xl font-semibold">Estrutura pensada para cuidado cardiovascular completo</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                Consultas com abordagem individualizada, organização assistencial e experiência institucional alinhada aos
                mais altos padrões de qualidade em cardiologia.
              </p>
            </div>

            <div className="rounded-3xl border border-[#14508B]/12 bg-[#F7FAFE] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#14508B]">Diferenciais</p>
              <div className="mt-5 space-y-4">
                {[
                  'Condução médica ética e baseada em evidências.',
                  'Jornada do paciente com comunicação clara e acolhimento.',
                  'Posicionamento institucional de confiança e credibilidade.',
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
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Pronto para cuidar da sua saúde cardiovascular?</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
              Solicite seu agendamento e conte com uma equipe médica especializada para acompanhar sua saúde com
              precisão e confiança.
            </p>
            <a
              href="#contato"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:bg-[#F8F8F9]"
            >
              Solicitar agendamento
            </a>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0F3760] py-10 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 text-sm lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-base font-semibold">Nogueira Cardiologia</p>
            <p className="mt-2 text-white/80">Cuidado cardiológico com foco em autoridade médica, ética e excelência clínica.</p>
          </div>
          <div>
            <p className="font-semibold">Contato</p>
            <p className="mt-2 text-white/80">(00) 0000-0000</p>
            <p className="text-white/80">contato@nogueiracardiologia.com.br</p>
          </div>
          <div className="lg:text-right">
            <p className="text-white/80">© {new Date().getFullYear()} Nogueira Cardiologia</p>
            <p className="mt-1 text-white/70">Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
