import Image from 'next/image';

const authorityPillars = [
  {
    title: 'Autoridade médica consolidada',
    description:
      'Atendimento cardiológico com decisão clínica individualizada, foco em segurança assistencial e conduta baseada em experiência real de alta complexidade.',
  },
  {
    title: 'Tecnologia aplicada ao cuidado cardiovascular',
    description:
      'Portal digital para criar conta, fazer login, agendar consulta com cardiologista e acompanhar toda a jornada com praticidade e organização.',
  },
  {
    title: 'Cuidado humanizado com padrão premium',
    description:
      'Estrutura institucional para oferecer escuta qualificada, comunicação clara e acompanhamento contínuo em cada etapa da avaliação cardiovascular.',
  },
];

const pauloMilestones = [
  {
    title: 'Formação e titulação',
    points: [
      'Graduação em Medicina pela Faculdade de Ciências Médicas da Santa Casa de São Paulo.',
      'Residência médica em Cardiologia Clínica no Instituto de Moléstias Cardiovasculares.',
      'Doutorado em Cardiologia pela Faculdade de Medicina da Universidade de São Paulo (FMUSP).',
      'MBA Executivo em Administração: Gestão de Saúde pela FGV (2021).',
      'Título de especialista em Cardiologia (AMB/SBC) e em Terapia Intensiva (AMB/AMIB) desde 1993.',
    ],
  },
  {
    title: 'Atuação acadêmica e institucional',
    points: [
      'Professor adjunto da Faculdade de Medicina de São José do Rio Preto (FAMERP).',
      'Atua desde 1993 na FAMERP, no Departamento de Cardiologia e Cirurgia Cardiovascular.',
      'Exerceu funções de coordenação científica, chefia de disciplina e chefia de departamento.',
      'Foi diretor técnico do Hospital de Base entre 2013 e 2017.',
    ],
  },
  {
    title: 'Áreas de atuação e produção científica',
    points: [
      'Cardiologia clínica, infarto agudo do miocárdio, insuficiência coronariana e insuficiência cardíaca.',
      'Atuação em síndromes coronarianas agudas, tratamento fibrinolítico, disfunção ventricular e medicina intensiva.',
      'Revisor do periódico Arquivos Brasileiros de Cardiologia desde 2007.',
      'Produção científica em periódicos nacionais e internacionais.',
      'Membro da American Heart Association e American Stroke Association desde 2003.',
    ],
  },
];

const doctors = [
  {
    name: 'Dr. Paulo Roberto Nogueira',
    crm: 'CRM 53.790/SP',
    bio: 'Médico cardiologista com trajetória acadêmica, assistencial e institucional de referência em São José do Rio Preto, unindo precisão clínica, ciência e cuidado cardiovascular contínuo.',
  },
  {
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    crm: 'CRM 77.127/SP',
    bio: 'Atuação institucional com postura ética, atendimento humanizado e foco em condução clínica responsável em cardiologia.',
  },
];

const patientPortalHighlights = [
  'Criar conta do paciente com acesso seguro.',
  'Fazer login no portal para visualizar horários disponíveis.',
  'Realizar o agendamento digital da consulta com cardiologista.',
  'Acompanhar sua jornada e histórico de atendimento na plataforma.',
];

const whatsappLink = 'https://wa.me/5517997440223';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <Image
              src="/brand/LOGO ATUAL.png"
              alt="Logo oficial Nogueira Cardiologia"
              width={320}
              height={84}
              className="h-10 w-auto object-contain sm:h-12"
              priority
            />
          </a>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 xl:flex">
            {[
              ['Início', '#inicio'],
              ['Diferenciais', '#diferenciais'],
              ['Dr. Paulo Nogueira', '#dr-paulo'],
              ['Corpo clínico', '#corpo-clinico'],
              ['Portal do paciente', '#portal-paciente'],
              ['Contato', '#contato'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-[#14508B]">
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#portal-paciente"
            className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#11457B] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Entrar no portal
          </a>
        </div>
      </header>

      <main>
        <section id="inicio" className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center xl:gap-12">
            <div>
              <span className="inline-flex rounded-full border border-[#14508B]/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14508B] sm:text-xs">
                Cardiologista em São José do Rio Preto com jornada digital
              </span>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#103E6A] sm:text-4xl lg:text-5xl xl:text-6xl">
                Cardiologia de alta credibilidade para quem busca avaliação cardiovascular com precisão, tecnologia e confiança.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
                Na Nogueira Cardiologia, o cuidado cardiovascular é conduzido por corpo clínico experiente e plataforma digital segura.
                O paciente pode criar conta, fazer login e realizar o agendamento dentro do portal oficial da clínica.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#portal-paciente"
                  className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(20,80,139,0.8)] transition-colors hover:bg-[#11457B]"
                >
                  Entrar no portal do paciente
                </a>
                <a
                  href="#corpo-clinico"
                  className="inline-flex items-center justify-center rounded-full border border-[#14508B]/30 bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/60"
                >
                  Conhecer o corpo clínico
                </a>
              </div>
            </div>

            <aside className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white shadow-[0_28px_65px_-35px_rgba(17,69,123,0.55)]">
              <div className="bg-gradient-to-br from-[#11457B] via-[#14508B] to-[#15A7DD] p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/90 sm:text-sm">Portal institucional do paciente</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Agendamento digital é o fluxo principal da clínica</h2>
                <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">
                  O acesso é simples e seguro: cadastro do paciente, autenticação no portal e escolha de horários para consulta com cardiologista.
                </p>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {patientPortalHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-[#14508B]/10 bg-[#F4F8FD] p-4 text-sm leading-relaxed text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="diferenciais" className="bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-[#103E6A] sm:text-3xl lg:text-4xl">Autoridade em cardiologia, experiência humana e tecnologia clínica</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Nossa proposta institucional integra consulta com cardiologista, avaliação cardiovascular completa e acompanhamento de longo prazo com excelência técnica e fluxo digital organizado.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3 sm:gap-5">
              {authorityPillars.map((item) => (
                <article key={item.title} className="rounded-2xl border border-[#14508B]/10 bg-[#F7FAFE] p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-[#14508B]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dr-paulo" className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_55px_-35px_rgba(20,80,139,0.45)] sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#15A7DD] sm:text-sm">Trajetória de referência</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#103E6A] sm:text-3xl lg:text-4xl">
                Dr. Paulo Roberto Nogueira — cardiologista com sólida atuação acadêmica, institucional e assistencial
              </h2>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 sm:text-base">
                O Dr. Paulo Roberto Nogueira (CRM-SP 53.790) construiu uma trajetória reconhecida em cardiologia clínica, ensino médico e gestão hospitalar, fortalecendo a confiança de pacientes que buscam cardiologista em São José do Rio Preto com visão científica e cuidado humanizado.
              </p>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {pauloMilestones.map((block) => (
                  <article key={block.title} className="rounded-2xl border border-[#14508B]/10 bg-[#F8FBFF] p-5 sm:p-6">
                    <h3 className="text-base font-semibold text-[#11457B] sm:text-lg">{block.title}</h3>
                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                      {block.points.map((point) => (
                        <li key={point} className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#15A7DD]" aria-hidden="true" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-[#14508B]/15 bg-gradient-to-r from-[#103E6A] to-[#14508B] p-5 text-white sm:p-6">
                <p className="text-sm leading-relaxed sm:text-base">
                  Destaque institucional: atuação vinculada ao Instituto do Coração Rio Preto e ao Instituto de Moléstias Cardiovasculares de São José do Rio Preto, com revisão científica nos Arquivos Brasileiros de Cardiologia desde 2007 e reconhecimento da SOCESP em 2014.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="corpo-clinico" className="bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#14508B] sm:text-sm">Corpo clínico</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#103E6A] sm:text-3xl lg:text-4xl">Equipe médica da Nogueira Cardiologia</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-right sm:text-base">
                Profissionais com conduta ética e foco em cuidado cardiovascular de qualidade para consulta, prevenção e acompanhamento.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <article
                  key={doctor.name}
                  className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white shadow-[0_22px_48px_-34px_rgba(20,80,139,0.52)]"
                >
                  <div className="grid gap-0 sm:grid-cols-[170px_1fr]">
                    <div className="flex min-h-[170px] items-center justify-center border-b border-dashed border-[#14508B]/20 bg-gradient-to-b from-[#EAF3FC] to-[#F7FBFF] px-4 sm:min-h-full sm:border-b-0 sm:border-r">
                      <span className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#14508B]/85 sm:text-xs">Foto institucional</span>
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

        <section id="portal-paciente" className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <article className="rounded-3xl bg-gradient-to-br from-[#103E6A] via-[#14508B] to-[#15A7DD] p-7 text-white sm:p-9 lg:p-10">
              <h2 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
                Agende sua consulta com cardiologista diretamente pelo portal da clínica
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
                O fluxo principal da Nogueira Cardiologia é digital e seguro: criar conta, acessar o portal do paciente, escolher o melhor horário e concluir o agendamento de forma organizada.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#inicio"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:bg-[#F8F8F9]"
                >
                  Acessar agendamento
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  WhatsApp (suporte)
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0F3760] py-10 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 text-sm sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-base font-semibold">Nogueira Cardiologia</p>
            <p className="mt-2 text-white/80">
              Clínica de cardiologia voltada a consulta especializada, avaliação cardiovascular e cuidado clínico contínuo com confiança institucional.
            </p>
          </div>
          <div>
            <p className="font-semibold">Contato</p>
            <p className="mt-2 text-white/80">Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895</p>
            <p className="mt-2 text-white/80">Telefone: (17) 2139-8338</p>
            <p className="text-white/80">WhatsApp: (17) 99744-0223</p>
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
        aria-label="Falar com a clínica no WhatsApp"
        title="Suporte via WhatsApp"
        className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.03] sm:bottom-5 sm:right-5"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
          <path d="M20.52 3.48A11.79 11.79 0 0 0 12.09 0C5.53 0 .2 5.33.2 11.9c0 2.1.55 4.16 1.6 5.98L0 24l6.27-1.65a11.84 11.84 0 0 0 5.82 1.48h.01c6.56 0 11.9-5.33 11.9-11.9 0-3.17-1.24-6.15-3.48-8.45Zm-8.43 18.3h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.24-.37a9.9 9.9 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89a9.8 9.8 0 0 1 7 2.9 9.81 9.81 0 0 1 2.9 7c0 5.45-4.44 9.88-9.9 9.88Zm5.43-7.42c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.18.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.04-1.06 2.53s1.09 2.92 1.24 3.12c.15.2 2.13 3.24 5.16 4.54.72.31 1.28.49 1.72.62.72.23 1.37.2 1.89.12.58-.09 1.8-.73 2.06-1.44.25-.71.25-1.32.18-1.44-.08-.12-.28-.2-.58-.35Z" />
        </svg>
      </a>
    </div>
  );
}
