import Image from 'next/image';

const navigationItems = [
  ['Início', '#inicio'],
  ['Conheça a Nogueira Cardiologia', '#sobre-nogueira-cardiologia'],
  ['Corpo clínico', '#corpo-clinico'],
  ['Blog', '/blog'],
  ['Contato', '#contato'],
] as const;

const heroSlides = [
  {
    title: 'Nogueira Cardiologia em São José do Rio Preto desde 1998',
    description:
      'Há 28 anos, cuidando da saúde cardiovascular com tradição médica, credibilidade e compromisso com cada paciente.',
  },
  {
    title: 'Estrutura moderna e tecnologia para cardiologia',
    description:
      'Ambiente clínico organizado, recursos diagnósticos e processos assistenciais que apoiam condutas com precisão e segurança.',
  },
  {
    title: 'Corpo clínico com Dr. Paulo Nogueira e Dra. Cristiani Nogueira',
    description:
      'Equipe experiente, atuação ética e acompanhamento próximo para decisões cardiológicas bem fundamentadas.',
  },
  {
    title: 'Especialidades e seguimento cardiovascular contínuo',
    description:
      'Prevenção, diagnóstico e acompanhamento para diferentes perfis de risco, com cuidado individualizado em todas as fases.',
  },
];

const specialties = [
  {
    title: 'Cardiologia clínica',
    description:
      'Consulta cardiológica completa para avaliação de sintomas, histórico, fatores de risco e plano terapêutico personalizado.',
  },
  {
    title: 'Prevenção cardiovascular',
    description:
      'Estratégias para reduzir risco de infarto, AVC e progressão de doenças cardiovasculares com orientação médica contínua.',
  },
  {
    title: 'Estratificação de risco',
    description:
      'Avaliação criteriosa do risco cardiovascular para apoiar decisões preventivas e intervenções mais assertivas.',
  },
  {
    title: 'Investigação diagnóstica',
    description:
      'Condução clínica para diagnóstico de coronariopatias, insuficiência cardíaca e outras condições com rigor técnico.',
  },
  {
    title: 'Acompanhamento cardiológico',
    description:
      'Seguimento longitudinal de pacientes com metas claras de controle, segurança e qualidade de vida.',
  },
  {
    title: 'Cuidado em condições complexas',
    description:
      'Assistência a pacientes com doença coronariana, insuficiência cardíaca e cenários de maior demanda clínica.',
  },
];

const doctors = [
  {
    name: 'Dr. Paulo Roberto Nogueira',
    crm: 'CRM 53.790/SP',
    bio: 'Cardiologista com sólida atuação assistencial, acadêmica e institucional, referência em conduta clínica precisa e acompanhamento cardiovascular responsável.',
    image: '/brand/dr-paulo-roberto-nogueira.jpeg',
  },
  {
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    crm: 'CRM 77.127/SP',
    bio: 'Médica cardiologista com enfoque humanizado, escuta qualificada e atenção ao cuidado contínuo, integrando excelência técnica à prática clínica diária.',
    image: '/brand/dra-cristiani-monteiro-de-oliveira-nogueira.jpeg',
  },
];

const blogHighlights = [
  'Como prevenir eventos cardiovasculares com acompanhamento especializado.',
  'Sinais de alerta cardíaco e quando buscar avaliação com cardiologista.',
  'Hábitos de vida e controle de fatores de risco para um coração mais saudável.',
];

const whatsappLink = 'https://wa.me/5517997440223';

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth bg-[#F8F8F9] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <Image
              src="/brand/nogueira-cardiologia-logo.svg"
              alt="Logo oficial Nogueira Cardiologia"
              width={320}
              height={84}
              className="h-10 w-auto object-contain sm:h-12"
              priority
            />
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 xl:flex">
            {navigationItems.map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-[#14508B]">
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#contato"
            className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-4 py-2 text-[11px] font-bold tracking-[0.04em] text-white shadow-[0_14px_30px_-18px_rgba(20,80,139,0.85)] transition-all hover:bg-[#11457B] sm:px-6 sm:py-3 sm:text-sm"
          >
            Agende sua consulta AGORA!
          </a>
        </div>
      </header>

      <main>
        <section id="inicio" className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center xl:gap-12">
            <div>
              <span className="inline-flex rounded-full border border-[#14508B]/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#14508B] sm:text-xs">
                Referência em cardiologia em São José do Rio Preto
              </span>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#103E6A] sm:text-4xl lg:text-5xl xl:text-6xl">
                Referência em cardiologia em São José do Rio Preto desde 1998, com excelência médica para cuidar do seu coração em cada fase da vida.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
                Na Nogueira Cardiologia, tradição, precisão diagnóstica e acompanhamento especializado caminham com escuta humana e estrutura moderna.
                Aqui, cada consulta é conduzida com seriedade, confiança e foco real na sua segurança cardiovascular.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#contato"
                  className="inline-flex items-center justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(20,80,139,0.8)] transition-colors hover:bg-[#11457B]"
                >
                  Agende sua consulta
                </a>
                <a
                  href="#sobre-nogueira-cardiologia"
                  className="inline-flex items-center justify-center rounded-full border border-[#14508B]/30 bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/60"
                >
                  Conheça a Nogueira Cardiologia
                </a>
              </div>
            </div>

            <aside className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white shadow-[0_28px_65px_-35px_rgba(17,69,123,0.55)]">
              <div className="bg-gradient-to-br from-[#11457B] via-[#14508B] to-[#15A7DD] p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/90 sm:text-sm">Nogueira Cardiologia • Desde 1998</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Desde 1998, tradição local com cardiologia de alta credibilidade</h2>
                <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">
                  Uma clínica construída sobre credibilidade médica, experiência clínica e compromisso contínuo com prevenção, diagnóstico e seguimento cardiovascular.
                </p>
              </div>
              <div className="grid gap-3 p-5 sm:p-6">
                {heroSlides.map((slide) => (
                  <article key={slide.title} className="rounded-2xl border border-[#14508B]/10 bg-[#F4F8FD] p-4">
                    <h3 className="text-sm font-semibold text-[#11457B] sm:text-base">{slide.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{slide.description}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="sobre-nogueira-cardiologia" className="bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#14508B]/12 bg-[#F8FBFF] p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#15A7DD] sm:text-sm">Sobre a Nogueira Cardiologia</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#103E6A] sm:text-3xl lg:text-4xl">
                Conheça a Nogueira Cardiologia: tradição médica, confiança e visão moderna de cuidado cardiovascular
              </h2>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Atuamos em São José do Rio Preto desde 1998, oferecendo cardiologia com alto padrão técnico e relação próxima com cada paciente.
                Nossa equipe reúne experiência, tecnologia e responsabilidade clínica para orientar prevenção, investigar com precisão e acompanhar
                cada caso com consistência e atenção ao longo do tempo.
              </p>
            </div>
          </div>
        </section>

        <section id="especialidades" className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#14508B] sm:text-sm">Especialidades</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#103E6A] sm:text-3xl lg:text-4xl">Cuidado cardiovascular completo e especializado</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-right sm:text-base">
                Atuação clínica orientada por prevenção, precisão diagnóstica e seguimento contínuo para diferentes necessidades cardiovasculares.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-5">
              {specialties.map((item) => (
                <article key={item.title} className="rounded-2xl border border-[#14508B]/10 bg-white p-5 shadow-[0_20px_45px_-36px_rgba(20,80,139,0.62)] sm:p-6">
                  <h3 className="text-lg font-semibold text-[#14508B]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              ))}
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
                Autoridade médica construída com experiência, conduta ética e acompanhamento próximo para decisões cardiovasculares seguras.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <article key={doctor.name} className="overflow-hidden rounded-3xl border border-[#14508B]/15 bg-white shadow-[0_22px_48px_-34px_rgba(20,80,139,0.52)]">
                  <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
                    <div className="relative aspect-[4/5] overflow-hidden border-b border-[#14508B]/10 sm:aspect-[4/5] sm:border-b-0 sm:border-r">
                      <Image
                        src={doctor.image}
                        alt={`Foto de ${doctor.name}`}
                        fill
                        sizes="(max-width: 639px) 100vw, 220px"
                        className="object-cover object-center"
                      />
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

        <section id="blog" className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_26px_60px_-40px_rgba(20,80,139,0.55)] sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#15A7DD] sm:text-sm">Blog Nogueira Cardiologia</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#103E6A] sm:text-3xl">Conteúdo médico para orientar decisões e proteger sua saúde cardiovascular</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Acompanhe orientações do nosso corpo clínico sobre prevenção cardiovascular, sinais de alerta e cuidados contínuos para manter a saúde do coração em dia.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {blogHighlights.map((item) => (
                  <article key={item} className="rounded-2xl border border-[#14508B]/10 bg-[#F8FBFF] p-4 text-sm leading-relaxed text-slate-700">
                    {item}
                  </article>
                ))}
              </div>
              <a
                href="/blog"
                className="mt-7 inline-flex items-center justify-center rounded-full border border-[#14508B]/30 bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:border-[#14508B]/60"
              >
                Acessar o Blog da Nogueira Cardiologia
              </a>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-16">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <article className="rounded-3xl bg-gradient-to-br from-[#103E6A] via-[#14508B] to-[#15A7DD] p-7 text-white sm:p-9 lg:p-10">
              <h2 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">Seu coração merece acompanhamento especializado com confiança e excelência clínica</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
                Agende sua consulta na Nogueira Cardiologia e tenha ao seu lado um corpo clínico experiente, estrutura moderna e cuidado humano para
                prevenção, diagnóstico e seguimento cardiovascular com segurança.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#contato"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14508B] transition-colors hover:bg-[#F8F8F9]"
                >
                  Marcar consulta
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Falar com a clínica no WhatsApp
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0F3760] pb-10 pt-12 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 lg:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-sm">Newsletter Nogueira Cardiologia + NogIA</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">Receba orientações semanais para cuidar melhor do seu coração</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
              Cadastre-se para receber conteúdos úteis sobre coração, sono, alimentação, hidratação, rotina, prevenção cardiovascular e hábitos saudáveis.
              A NogIA, assistente da Nogueira Cardiologia, ajuda você com lembretes e dicas semanais com linguagem clara e foco no seu bem-estar.
            </p>
            <form className="mt-6 grid gap-3 sm:grid-cols-2" action="#" method="post">
              <label htmlFor="newsletter-name" className="sr-only">
                Nome completo
              </label>
              <input
                id="newsletter-name"
                name="name"
                type="text"
                placeholder="Nome completo"
                className="w-full rounded-full border border-white/25 bg-white px-5 py-3 text-sm text-slate-900 outline-none ring-[#15A7DD] placeholder:text-slate-500 focus:ring-2"
                required
              />
              <label htmlFor="newsletter-cpf" className="sr-only">
                CPF
              </label>
              <input
                id="newsletter-cpf"
                name="cpf"
                type="text"
                placeholder="CPF"
                className="w-full rounded-full border border-white/25 bg-white px-5 py-3 text-sm text-slate-900 outline-none ring-[#15A7DD] placeholder:text-slate-500 focus:ring-2"
                required
              />
              <label htmlFor="newsletter-email" className="sr-only">
                E-mail
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="E-mail"
                className="w-full rounded-full border border-white/25 bg-white px-5 py-3 text-sm text-slate-900 outline-none ring-[#15A7DD] placeholder:text-slate-500 focus:ring-2"
                required
              />
              <label htmlFor="newsletter-phone" className="sr-only">
                Telefone
              </label>
              <input
                id="newsletter-phone"
                name="phone"
                type="tel"
                placeholder="Telefone"
                className="w-full rounded-full border border-white/25 bg-white px-5 py-3 text-sm text-slate-900 outline-none ring-[#15A7DD] placeholder:text-slate-500 focus:ring-2"
                required
              />
              <label className="sm:col-span-2 mt-1 inline-flex items-start gap-2 text-xs text-white/85 sm:text-sm">
                <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded border-white/40 text-[#14508B] accent-[#14508B]" />
                <span>Autorizo o uso dos meus dados para receber orientações semanais da Nogueira Cardiologia, conforme a política de privacidade.</span>
              </label>
              <button
                type="submit"
                className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11457B]"
              >
                Quero receber dicas semanais
              </button>
            </form>
          </div>

          <div className="mt-8 grid gap-7 text-sm lg:grid-cols-3">
            <div>
              <p className="text-base font-semibold">Nogueira Cardiologia</p>
              <p className="mt-2 text-white/80">
                Referência em cardiologia em São José do Rio Preto desde 1998, unindo tradição médica, precisão diagnóstica e cuidado humano.
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                {[
                  { label: 'LinkedIn', href: '#', hover: 'hover:text-[#0A66C2]' },
                  { label: 'Facebook', href: '#', hover: 'hover:text-[#1877F2]' },
                  { label: 'Instagram', href: '#', hover: 'hover:text-[#E4405F]' },
                  { label: 'YouTube', href: '#', hover: 'hover:text-[#FF0000]' },
                  { label: 'WhatsApp', href: whatsappLink, hover: 'hover:text-[#25D366]' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.label === 'WhatsApp' ? '_blank' : undefined}
                    rel={social.label === 'WhatsApp' ? 'noreferrer' : undefined}
                    aria-label={`${social.label} da Nogueira Cardiologia`}
                    title={social.label}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white/85 transition-colors ${social.hover}`}
                  >
                    <span className="text-[11px] font-semibold">{social.label.slice(0, 2)}</span>
                  </a>
                ))}
              </div>
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
