export default function Home() {
  const trustSignals = [
    "Atendimento especializado",
    "Estrutura moderna",
    "Cuidado individualizado",
    "Experiência clínica",
  ];

  const especialidades = [
    "Cardiologia clínica",
    "Check-up cardiológico",
    "Exames cardiológicos",
    "Acompanhamento preventivo",
  ];

  const diferenciais = [
    "Agendamento facilitado",
    "Atendimento com excelência",
    "Estrutura moderna",
    "Jornada digital do paciente",
  ];

  const credibilidade = [
    "Participação em congressos e atualização contínua",
    "Atendimento focado em precisão clínica",
    "Estrutura voltada à experiência do paciente",
    "Conduta ética e acompanhamento cuidadoso",
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14508B] text-sm font-bold text-white">
              NC
            </div>
            <div>
              <p className="text-sm leading-none text-slate-500">Clínica cardiológica</p>
              <p className="text-base font-semibold tracking-tight text-[#14508B]">Nogueira Cardiologia</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 lg:flex">
            <a href="#inicio" className="transition-colors hover:text-[#14508B]">
              Início
            </a>
            <a href="#corpo-clinico" className="transition-colors hover:text-[#14508B]">
              Corpo clínico
            </a>
            <a href="#clinica" className="transition-colors hover:text-[#14508B]">
              Clínica
            </a>
            <a href="#especialidades" className="transition-colors hover:text-[#14508B]">
              Especialidades
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
        <section id="inicio" className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 lg:px-8 lg:pb-12 lg:pt-16">
          <div className="grid gap-8 overflow-hidden rounded-[2rem] border border-[#14508B]/10 bg-white shadow-sm lg:grid-cols-2 lg:items-stretch">
            <div className="p-8 lg:p-12">
              <span className="inline-flex rounded-full bg-[#15A7DD]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#14508B]">
                Referência em cardiologia
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#14508B] md:text-5xl">
                Cardiologia com excelência, tecnologia e cuidado individualizado.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                A Nogueira Cardiologia oferece atendimento com foco em confiança, organização clínica e
                acompanhamento centrado no paciente em cada etapa do cuidado cardiovascular.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#agendamento"
                  className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11457B]"
                >
                  Agendar consulta
                </a>
                <a
                  href="#clinica"
                  className="inline-flex items-center justify-center rounded-full border border-[#14508B]/25 bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/40"
                >
                  Conhecer a clínica
                </a>
              </div>
            </div>

            <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-[#14508B] via-[#11457B] to-[#15A7DD] p-8 lg:min-h-full">
              <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Imagem institucional</p>
                <h2 className="mt-3 text-2xl font-semibold">Espaço reservado para foto da clínica ou corpo médico</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Bloco visual preparado para receber imagem oficial em alta qualidade, reforçando autoridade e presença institucional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-14 lg:px-8">
          <div className="grid gap-3 rounded-2xl border border-[#14508B]/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
            {trustSignals.map((item) => (
              <div key={item} className="rounded-xl bg-[#F8F8F9] px-4 py-3 text-sm font-semibold text-[#14508B]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="corpo-clinico" className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B] md:text-4xl">Corpo clínico</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Equipe médica apresentada com dados institucionais essenciais. Informações curriculares detalhadas podem ser adicionadas conforme disponibilidade.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {[
                {
                  nome: "Dr. Paulo Nogueira",
                  titulo: "Cardiologista",
                  crm: "CRM 53.790/SP",
                },
                {
                  nome: "Dra. Cristiani Monteiro de Oliveira Nogueira",
                  titulo: "Médica",
                  crm: "CRM 77.127/SP",
                },
              ].map((medico) => (
                <article key={medico.nome} className="overflow-hidden rounded-3xl border border-[#14508B]/10 bg-[#F8F8F9]">
                  <div className="grid md:grid-cols-[1fr_180px]">
                    <div className="p-7">
                      <h3 className="text-xl font-semibold text-[#14508B]">{medico.nome}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-700">{medico.titulo}</p>
                      <p className="mt-1 text-sm text-slate-500">{medico.crm}</p>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        Perfil institucional em desenvolvimento. Este espaço está preparado para incluir apresentação profissional completa,
                        áreas de atuação e informações adicionais validadas.
                      </p>
                    </div>
                    <div className="flex min-h-[180px] items-center justify-center border-t border-[#14508B]/10 bg-white text-center text-xs font-medium text-slate-500 md:min-h-full md:border-l md:border-t-0">
                      Área para foto
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="clinica" className="py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-semibold text-[#14508B] md:text-4xl">Sobre a Nogueira Cardiologia</h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 md:text-base">
                A clínica foi planejada para oferecer uma experiência premium em cardiologia, com fluxos organizados,
                atenção humanizada e apoio tecnológico voltado à segurança do paciente.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                Do primeiro contato ao acompanhamento, a proposta institucional prioriza clareza na comunicação,
                conduta ética e cuidado individualizado em um ambiente profissional e confiável.
              </p>
            </div>

            <div className="rounded-3xl border border-[#14508B]/10 bg-white p-8 shadow-sm">
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#6CC6E7]/30 to-[#15A7DD]/10 text-center">
                <p className="max-w-xs text-sm font-medium text-[#14508B]">
                  Bloco visual institucional para logo, fachada da clínica ou imagem de ambiente interno.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="especialidades" className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B] md:text-4xl">Especialidades</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {especialidades.map((item) => (
                <article key={item} className="rounded-2xl border border-[#14508B]/10 bg-[#F8F8F9] p-6">
                  <h3 className="text-lg font-semibold text-[#14508B]">{item}</h3>
                  <p className="mt-2 text-sm text-slate-600">Conteúdo institucional detalhado pode ser inserido nesta área.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B] md:text-4xl">Diferenciais</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {diferenciais.map((item) => (
                <article key={item} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#14508B]/10">
                  <h3 className="text-base font-semibold text-[#14508B]">{item}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Soluções estruturadas para uma jornada assistencial organizada e alinhada a um atendimento de alto padrão.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-[#14508B] md:text-4xl">Credibilidade e autoridade</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {credibilidade.map((item) => (
                <article key={item} className="rounded-2xl border border-[#14508B]/10 bg-[#F8F8F9] p-6">
                  <p className="text-sm font-semibold leading-relaxed text-[#14508B]">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="agendamento" className="bg-gradient-to-r from-[#14508B] via-[#11457B] to-[#14508B] py-16">
          <div className="mx-auto w-full max-w-4xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Agende sua consulta e priorize sua saúde cardiovascular com confiança.</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
              Nossa equipe está preparada para oferecer um atendimento cardiológico organizado, humano e focado em qualidade assistencial.
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
            <p className="mt-2 text-white/80">Clínica cardiológica com atendimento institucional e foco no paciente.</p>
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
