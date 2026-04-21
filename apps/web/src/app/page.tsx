export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <header className="border-b border-[#14508B]/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="#" className="text-lg font-semibold tracking-tight text-[#14508B] md:text-xl">
            Nogueira Cardiologia
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex">
            <a href="#inicio" className="transition-colors hover:text-[#14508B]">
              Início
            </a>
            <a href="#clinica" className="transition-colors hover:text-[#14508B]">
              Clínica
            </a>
            <a href="#especialidades" className="transition-colors hover:text-[#14508B]">
              Especialidades
            </a>
            <a href="#medico" className="transition-colors hover:text-[#14508B]">
              Médico
            </a>
            <a href="#contato" className="transition-colors hover:text-[#14508B]">
              Contato
            </a>
          </nav>

          <a
            href="#agendamento"
            className="rounded-full bg-[#14508B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11457B]"
          >
            Agendar consulta
          </a>
        </div>
      </header>

      <main>
        <section id="inicio" className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex rounded-full bg-[#15A7DD]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#14508B]">
              Cardiologia premium
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#14508B] md:text-5xl">
              Cuidado cardiológico com excelência, precisão clínica e confiança.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              A Nogueira Cardiologia oferece atendimento especializado com foco em segurança, acolhimento
              e acompanhamento individualizado para cada paciente.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#agendamento"
                className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11457B]"
              >
                Agendar consulta
              </a>
              <a
                href="#especialidades"
                className="inline-flex items-center justify-center rounded-full border border-[#14508B]/20 bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/40"
              >
                Conhecer especialidades
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#14508B]/10 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#15A7DD]">Destaques da clínica</p>
            <div className="mt-6 space-y-5">
              {[
                ["Atendimento", "Foco total em cuidado individual e escuta ativa"],
                ["Tecnologia", "Suporte diagnóstico com estrutura moderna"],
                ["Confiança", "Relação médico-paciente com transparência e clareza"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl bg-[#F8F8F9] p-4">
                  <p className="font-semibold text-[#14508B]">{title}</p>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B]">Compromisso com confiança e excelência</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["Atendimento humanizado", "Cuidado próximo e respeitoso em cada etapa da jornada."],
                ["Excelência em cardiologia", "Conduta clínica responsável e atenção aos detalhes."],
                ["Experiência e confiança", "Ambiente institucional seguro para decisões com tranquilidade."],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-[#14508B]/10 bg-[#F8F8F9] p-6">
                  <h3 className="text-lg font-semibold text-[#14508B]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="medico" className="py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-[#14508B] to-[#15A7DD] p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Sobre a clínica</p>
              <h2 className="mt-3 text-3xl font-semibold">Dr. Paulo Nogueira e Nogueira Cardiologia</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                A Nogueira Cardiologia foi estruturada para oferecer uma experiência clínica de alto padrão,
                unindo acolhimento, organização e cuidado centrado no paciente.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                Nesta página institucional inicial, apresentamos uma visão geral da proposta médica da clínica,
                sem extrapolar informações além das disponibilizadas.
              </p>
            </div>

            <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-[#14508B]/25 bg-white">
              <span className="text-sm font-medium text-slate-500">Espaço reservado para imagem institucional</span>
            </div>
          </div>
        </section>

        <section id="especialidades" className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B]">Especialidades</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Atuação em frentes essenciais da cardiologia para prevenção, diagnóstico e acompanhamento contínuo.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Cardiologia clínica",
                "Check-up cardiológico",
                "Exames cardíacos",
                "Acompanhamento preventivo",
              ].map((item) => (
                <article key={item} className="rounded-2xl border border-[#14508B]/10 bg-[#F8F8F9] p-5">
                  <h3 className="text-base font-semibold text-[#14508B]">{item}</h3>
                  <p className="mt-2 text-sm text-slate-600">Conteúdo institucional em desenvolvimento.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="clinica" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B]">Diferenciais da Nogueira Cardiologia</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Agendamento facilitado",
                "Atendimento com excelência",
                "Estrutura moderna",
                "Jornada digital do paciente",
              ].map((item) => (
                <article key={item} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#14508B]/10">
                  <h3 className="text-base font-semibold text-[#14508B]">{item}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Solução pensada para oferecer experiência premium em cada interação com a clínica.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="agendamento" className="bg-[#14508B] py-16">
          <div className="mx-auto w-full max-w-4xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Pronto para cuidar da sua saúde cardiovascular?</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
              Solicite seu agendamento e receba um atendimento cardiológico com atenção, clareza e excelência.
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
            <p className="mt-2 text-white/80">Cuidado cardiológico com foco em confiança, ética e qualidade clínica.</p>
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
