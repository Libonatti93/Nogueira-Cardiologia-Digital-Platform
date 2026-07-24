import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SecurityTrustBadges } from '@/components/security/trust-badges';
import { HomeMobileMenu } from '@/components/site/home-mobile-menu';
import { getRecentPosts } from '@/data/blog-posts';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const navigationItems = [
  ['Clínica', '#clinica'],
  ['Telemedicina', '#telemedicina'],
  ['Paciente', '#portal-paciente'],
  ['Exames', '#exames'],
  ['Corpo clínico', '#corpo-clinico'],
  ['Especialidades', '#especialidades'],
  ['Educativo', '#blog'],
  ['Contato', '#contato'],
] as const;

const curriculumHighlights = [
  {
    title: 'Formação acadêmica',
    description: 'Faculdade de Ciências Médicas da Santa Casa de São Paulo.',
    logo: '/curriculo-logos/santa-casa-sp-transparent.png',
    logoAlt: 'Logo da Faculdade de Ciências Médicas da Santa Casa de São Paulo',
  },
  {
    title: 'Professor e palestrante',
    description: 'SOCESP - Sociedade de Cardiologia do Estado de São Paulo.',
    logo: '/curriculo-logos/socesp-transparent.png',
    logoAlt: 'Logo da SOCESP',
  },
  {
    title: 'Residência Médica',
    description: 'Instituto de Moléstias Cardiovasculares - IMC (1988-1990).',
    logo: '/curriculo-logos/imc-transparent.png',
    logoAlt: 'Selo do Instituto de Moléstias Cardiovasculares',
  },
  {
    title: 'Doutorado em Cardiologia',
    description: 'Faculdade de Medicina da Universidade de São Paulo - FMUSP (2000-2002).',
    logo: '/curriculo-logos/fmusp-transparent.png',
    logoAlt: 'Logo da Faculdade de Medicina da Universidade de São Paulo',
  },
  {
    title: 'Professor Adjunto Doutor',
    description: 'Departamento de Cardiologia e Cirurgia Cardiovascular da FAMERP.',
    logo: '/curriculo-logos/famerp-transparent.png',
    logoAlt: 'Logo da FAMERP',
  },
  {
    title: 'Médico Cardiologista',
    description: 'INCOR - Instituto do Coração Rio Preto, Instituto do Cor, Brasil.',
    logo: '/curriculo-logos/incor-rio-preto-transparent.png',
    logoAlt: 'Logo do INCOR Rio Preto',
  },
] as const;

const patientSteps = [
  'Clique em Marcar Consulta',
  'Faça seu cadastro gratuito',
  'Escolha atendimento presencial ou telemedicina',
  'Acesse a agenda e os conteúdos da clínica',
] as const;

const portalBenefits = [
  'Dicas diárias e semanais dos Drs. Paulo e Cristiani para prevenção e rotina cardiovascular.',
  'Contato direto com a agenda do Dr. Paulo e da Dra. Cris para solicitar consulta presencial ou atendimento virtual com mais praticidade.',
  'Acesso ao conteúdo do Prof. Dr. Paulo Roberto Nogueira, com materiais didáticos e orientações em linguagem clara.',
  'Telemedicina em cardiologia para retornos, acompanhamento, orientação de exames e avaliação clínica quando o atendimento virtual for adequado.',
  'Portal gratuito para acompanhar novidades, receber conteúdos educativos e manter o cuidado do coração mais próximo.',
] as const;

const socespHighlights = [
  {
    image: '/uploads-imagens-nogueira/paulo-socesp4.jpeg',
    title: 'Aula no Congresso SOCESP 2026',
    description: 'Dr. Paulo Nogueira apresentando conteúdo científico em cardiologia.',
  },
  {
    image: '/uploads-imagens-nogueira/paulo-socesp27.jpeg',
    title: 'Discussão científica com dados clínicos',
    description: 'Aula com apresentação de evidências e condução de raciocínio cardiovascular.',
  },
  {
    image: '/uploads-imagens-nogueira/paulo-socesp13.jpeg',
    title: 'Banca e mesa de discussão',
    description: 'Participação em painel com especialistas da cardiologia.',
  },
  {
    image: '/uploads-imagens-nogueira/paulo-socesp21.jpeg',
    title: 'Banca científica coordenada',
    description: 'Registro da composição da banca médica em sessão da SOCESP.',
  },
  {
    image: '/uploads-imagens-nogueira/paulo-socesp33.jpeg',
    title: 'Debate entre especialistas',
    description: 'Troca técnica em mesa redonda sobre temas de cardiologia.',
  },
  {
    image: '/uploads-imagens-nogueira/paulo-socesp36.jpeg',
    title: 'Presença na sociedade médica',
    description: 'Registro institucional com colegas cardiologistas no congresso.',
  },
] as const;

const specialties = [
  {
    title: 'Consulta com cardiologista em São José do Rio Preto',
    description: 'Avaliação clínica para dor no peito, falta de ar, palpitações, cansaço, histórico familiar e fatores de risco cardiovascular.',
    icon: 'stethoscope',
  },
  {
    title: 'Telemedicina cardiológica e atendimento virtual',
    description: 'Consulta online com cardiologista para acompanhamento, retornos, orientação de exames e cuidado cardiovascular com segurança quando indicado.',
    icon: 'videoHeart',
  },
  {
    title: 'Check-up cardiológico preventivo',
    description: 'Rotina de prevenção para quem tem hipertensão, colesterol alto, diabetes, tabagismo ou deseja iniciar atividade física com segurança.',
    icon: 'clipboard',
  },
  {
    title: 'Prevenção de infarto e AVC',
    description: 'Estratégias médicas para reduzir risco cardiovascular, acompanhar exames e orientar hábitos que protegem o coração.',
    icon: 'shieldHeart',
  },
  {
    title: 'Acompanhamento de hipertensão arterial',
    description: 'Seguimento contínuo para controle da pressão alta, ajuste de tratamento e prevenção de complicações cardiovasculares.',
    icon: 'activity',
  },
  {
    title: 'Investigação de sintomas cardíacos',
    description: 'Condução clínica para entender palpitações, tontura, dor torácica e falta de ar, indicando exames quando necessário.',
    icon: 'searchPulse',
  },
  {
    title: 'Cardiologia humanizada e acompanhamento contínuo',
    description: 'Atendimento com escuta, clareza e plano individualizado para pacientes que buscam segurança no cuidado do coração.',
    icon: 'handsHeart',
  },
] as const;

const doctors = [
  {
    name: 'Dr. Paulo Roberto Nogueira',
    crm: 'CRM 53.790/SP',
    image: '/uploads-imagens-nogueira/nogueira-cardiologia-paulo1.png',
    bio: 'Cardiologista intensivista, referência em cardiologia clínica, com foco de atuação em coronariopatias e cardiomiopatias.',
  },
  {
    name: 'Dra. Cristiani Monteiro de Oliveira Nogueira',
    crm: 'CRM 77.127/SP',
    image: '/uploads-imagens-nogueira/nogueira-cardiologia-cris1.png',
    bio: 'Médica cardiologista clínica, com atendimento humanizado de alto padrão voltado para o cuidado da saúde global.',
  },
] as const;

const whatsappLink = 'https://wa.me/5517997440223';
const portalLink = '/portal';
const assetPath = '/uploads-imagens-nogueira';
const socialLinks = [
  ['Instagram', 'https://www.instagram.com/drpaulonogueiracardiologista/', 'instagram'],
  ['LinkedIn', 'https://www.linkedin.com/in/paulo-roberto-nogueira-b704282a/', 'linkedin'],
] as const;
const developerLink = 'https://github.com/Libonatti93';

type SpecialtyIconName = (typeof specialties)[number]['icon'];
type SocialIconName = (typeof socialLinks)[number][2];

function SpecialtyIcon({ name }: { name: SpecialtyIconName }) {
  const iconProps = {
    className: 'h-6 w-6',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'stethoscope':
      return (
        <svg {...iconProps}>
          <path d="M6 4v5a4 4 0 0 0 8 0V4" />
          <path d="M4 4h4" />
          <path d="M12 4h4" />
          <path d="M10 13v2.5A4.5 4.5 0 0 0 14.5 20h1A4.5 4.5 0 0 0 20 15.5V14" />
          <circle cx="20" cy="12" r="2" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg {...iconProps}>
          <path d="M9 4h6l1 2h2v14H6V6h2l1-2Z" />
          <path d="M9 10h6" />
          <path d="M9 14h3" />
          <path d="m14 15 1.4 1.4L19 12.8" />
        </svg>
      );
    case 'shieldHeart':
      return (
        <svg {...iconProps}>
          <path d="M12 3 19 6v5.2c0 4.2-2.7 7.8-7 9.8-4.3-2-7-5.6-7-9.8V6l7-3Z" />
          <path d="M12 15s-3.5-2-3.5-4.2A2 2 0 0 1 12 9.5a2 2 0 0 1 3.5 1.3C15.5 13 12 15 12 15Z" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...iconProps}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
          <path d="M7 19a9 9 0 1 1 10 0" />
        </svg>
      );
    case 'searchPulse':
      return (
        <svg {...iconProps}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4 4" />
          <path d="M6.5 11h2l1-2.5 2 5 1-2.5h2" />
        </svg>
      );
    case 'handsHeart':
      return (
        <svg {...iconProps}>
          <path d="M7 12.5 4.5 15a2 2 0 0 0 0 2.8L8 21h4.5l3-3" />
          <path d="m17 12.5 2.5 2.5a2 2 0 0 1 0 2.8L16 21" />
          <path d="M12 13s-3.2-1.9-3.2-4A2 2 0 0 1 12 7.4 2 2 0 0 1 15.2 9c0 2.1-3.2 4-3.2 4Z" />
          <path d="M5 14V9" />
          <path d="M19 14V9" />
        </svg>
      );
    case 'videoHeart':
      return (
        <svg {...iconProps}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9Z" />
          <path d="m16 10 4-2.4v8.8L16 14" />
          <path d="M10 14s-2.2-1.3-2.2-2.8A1.4 1.4 0 0 1 10 10a1.4 1.4 0 0 1 2.2 1.2C12.2 12.7 10 14 10 14Z" />
        </svg>
      );
  }
}

function SocialIcon({ name }: { name: SocialIconName }) {
  const iconProps = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'instagram':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.4" />
          <path d="M17.2 6.8h.01" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M8 11v5" />
          <path d="M8 8.5h.01" />
          <path d="M12 16v-5" />
          <path d="M12 13.1c0-1.3.9-2.1 2.1-2.1 1.3 0 1.9.8 1.9 2.4V16" />
        </svg>
      );
  }
}

export default function Home() {
  const educationalPosts = getRecentPosts().slice(0, 6);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white text-slate-950">
      <header className="sticky top-8 z-50 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3" aria-label="Ir para o início">
            <Image
              src={`${assetPath}/nogueira-cardio4-transparent.png`}
              alt="Nogueira Cardiologia"
              width={360}
              height={90}
              className="h-8 w-auto object-contain sm:h-11"
              priority
            />
          </a>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 xl:flex">
            {navigationItems.map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-[#14508B]">
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto xl:hidden">
            <HomeMobileMenu />
          </div>

          <Link
            href={portalLink}
            className="cta-pulse inline-flex shrink-0 rounded-full bg-[#14508B] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_16px_34px_-18px_rgba(20,80,139,0.95)] transition-colors hover:bg-[#0F3760] sm:px-6 sm:text-sm"
          >
            Marcar consulta
          </Link>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative min-h-[760px] overflow-hidden bg-[#0A2C4D]">
          <Image
            src={`${assetPath}/nogueira-cardiologia-pauloecris1.png`}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover object-center opacity-55 blur-xl sm:hidden"
            aria-hidden="true"
            priority
          />
          <Image
            src={`${assetPath}/nogueira-cardiologia-pauloecris1.png`}
            alt="Dr. Paulo Roberto Nogueira e Dra. Cristiani Nogueira na Nogueira Cardiologia"
            fill
            sizes="100vw"
            className="object-contain object-top sm:hidden"
            priority
          />
          <Image
            src={`${assetPath}/nogueira-cardiologia-pauloecris3.png`}
            alt="Dr. Paulo Roberto Nogueira e Dra. Cristiani Nogueira na Nogueira Cardiologia"
            fill
            sizes="100vw"
            className="hidden object-cover object-[64%_center] sm:block"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,44,77,0.98)_0%,rgba(10,44,77,0.88)_34%,rgba(20,80,139,0.32)_68%,rgba(10,44,77,0.06)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(10,44,77,0)_0%,rgba(10,44,77,0.86)_100%)]" />

          <div className="relative mx-auto flex min-h-[760px] w-full max-w-7xl flex-col justify-center px-4 pb-12 pt-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="w-fit rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                Experiência em cardiologia desde 1998
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Nogueira Cardiologia: tradição médica, estrutura moderna e acesso digital ao cuidado do coração.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
                Dr. Paulo Roberto Nogueira e Dra. Cristiani Nogueira unem experiência clínica, escuta próxima e uma jornada digital preparada para agendamento, telemedicina e acompanhamento humanizado.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={portalLink}
                  className="cta-pulse inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] shadow-[0_18px_36px_-20px_rgba(255,255,255,0.65)] transition-colors hover:bg-[#EAF6FF]"
                >
                  Marcar consulta
                </Link>
                <a
                  href="#blog"
                  className="inline-flex justify-center rounded-full border border-white/35 bg-white/8 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/14"
                >
                  Acessar Conteúdo Educativo
                </a>
              </div>

            </div>

            <div className="mt-12 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {curriculumHighlights.map((item) => (
                <article key={item.title} className="min-h-[172px] border-l-2 border-[#9FE6FF] bg-white/14 p-4 text-center text-white shadow-[0_18px_45px_-34px_rgba(0,0,0,0.55)] backdrop-blur">
                  <div className="flex h-12 w-full items-center justify-center">
                    <span className="inline-flex h-12 w-28 items-center justify-center rounded-xl border border-white/25 bg-white/92 px-3 py-2 shadow-[0_10px_24px_-18px_rgba(255,255,255,0.75)] ring-1 ring-[#14508B]/8">
                      <Image
                        src={item.logo}
                        alt={item.logoAlt}
                        width={128}
                        height={64}
                        className="max-h-9 w-auto object-contain"
                      />
                    </span>
                  </div>
                  <h2 className="mt-4 text-sm font-bold text-white">{item.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-white/80">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="portal-paciente" className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
            <div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#14508B]/10 bg-[#F4F9FF] p-3">
                <Image
                  src={`${assetPath}/nogueira-cardio2-transparent.png`}
                  alt="Símbolo da Nogueira Cardiologia"
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Portal gratuito do paciente</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Marcar sua consulta é simples: clique, cadastre-se gratuitamente e acesse a Nogueira por dentro.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                O cadastro gratuito libera uma experiência mais próxima da clínica, com acesso à agenda dos médicos, solicitação de consulta presencial ou telemedicina, dicas de cuidado cardiovascular e conteúdos educativos preparados para pacientes.
              </p>
              <div className="mt-7 grid gap-3">
                {patientSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 border-l-2 border-[#14508B] bg-[#F4F9FF] px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14508B] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#0F3760]">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={portalLink}
                  className="cta-pulse inline-flex justify-center rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_36px_-20px_rgba(20,80,139,0.85)] transition-colors hover:bg-[#0F3760]"
                >
                  Marcar consulta
                </Link>
                <a
                  href="#blog"
                  className="inline-flex justify-center rounded-full border border-[#14508B]/25 bg-white px-6 py-3 text-sm font-bold text-[#14508B] transition-colors hover:border-[#14508B]/55"
                >
                  Ver dicas gratuitas
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <article className="rounded-2xl border border-[#14508B]/12 bg-[#F8FBFF] p-5 shadow-[0_22px_56px_-42px_rgba(20,80,139,0.7)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Aplicativo Nogueira</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#0F3760]">Leve o portal no celular</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Baixe a versão mobile pela Apple Store ou Google Play e mantenha sua rotina de cuidado sempre por perto.</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-xl bg-[#0F172A] px-4 py-3 text-left text-white transition-colors hover:bg-[#0F3760]">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 shrink-0 fill-current">
                        <path d="M17.2 12.5c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.2-2.5 1.3-2.6 0 0-2.5-.9-2.5-3.6ZM15 6c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.2Z" />
                      </svg>
                      <span className="grid text-[11px] leading-tight">
                        <span>Baixar na</span>
                        <strong className="text-sm">Apple Store</strong>
                      </span>
                    </a>
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-xl bg-[#0F172A] px-4 py-3 text-left text-white transition-colors hover:bg-[#0F3760]">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 shrink-0">
                        <path fill="#19C37D" d="M4.5 3.2c-.3.3-.5.8-.5 1.4v14.8c0 .6.2 1.1.5 1.4l8.4-8.8-8.4-8.8Z" />
                        <path fill="#FFCC33" d="m13.8 11.1 2.7-2.8L6.4 2.6c-.4-.2-.8-.1-1.2.1l8.6 8.4Z" />
                        <path fill="#FF5A5F" d="m13.8 12.9-8.6 8.4c.4.2.8.3 1.2.1l10.1-5.7-2.7-2.8Z" />
                        <path fill="#31A8FF" d="m20.1 10.6-3.6-2.1-2.9 3.5 2.9 3.5 3.6-2.1c1.2-.7 1.2-2.1 0-2.8Z" />
                      </svg>
                      <span className="grid text-[11px] leading-tight">
                        <span>Disponível no</span>
                        <strong className="text-sm">Google Play</strong>
                      </span>
                    </a>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                {portalBenefits.map((benefit) => (
                  <article key={benefit} className="rounded-2xl border border-[#14508B]/10 bg-white p-5 shadow-[0_22px_50px_-44px_rgba(20,80,139,0.72)]">
                    <div className="mb-4 h-1.5 w-12 rounded-full bg-[#15A7DD]" />
                    <p className="text-sm leading-6 text-slate-700">{benefit}</p>
                  </article>
                ))}
              </div>

            </div>
          </div>
        </section>

        <section id="telemedicina" className="bg-[#0F3760] py-14 text-white sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">Telemedicina em cardiologia</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                Atendimento virtual para cuidar do coração com orientação médica, segurança e praticidade.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/82">
                A Nogueira Cardiologia também realiza consulta online com cardiologista para pacientes que precisam de retorno, acompanhamento clínico, orientação sobre exames, revisão de tratamento e prevenção cardiovascular sem perder o vínculo com a equipe médica.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/74">
                Quando a avaliação exige exame físico imediato, urgência ou investigação presencial, a equipe orienta o melhor caminho. A telemedicina entra como uma extensão segura da clínica, especialmente para manter continuidade de cuidado e facilitar acesso a quem está fora de São José do Rio Preto.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={portalLink} className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] transition-colors hover:bg-[#EAF6FF]">
                  Solicitar telemedicina
                </Link>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                  Tirar dúvidas no WhatsApp
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Retornos e acompanhamento', 'Continuidade para hipertensão, colesterol alto, sintomas controlados e prevenção cardiovascular.'],
                ['Orientação de exames', 'Envie laudos pelo portal e discuta resultados em consulta virtual quando for clinicamente adequado.'],
                ['Acesso para outras cidades', 'Atendimento online para pacientes que buscam cardiologista da Nogueira sem deslocamento inicial.'],
                ['Segurança assistencial', 'Dados, exames e pagamento organizados pelo portal, com triagem para indicar presencial quando necessário.'],
              ].map(([title, description]) => (
                <article key={title} className="border-l-2 border-[#9FE6FF] bg-white/8 p-5 shadow-[0_24px_54px_-44px_rgba(0,0,0,0.65)]">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/78">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="exames" className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-stretch lg:px-8">
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14508B]">Envio digital de exames</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Anexe exames cardiológicos antes da consulta e ajude a equipe a preparar seu atendimento.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Pelo Portal do Paciente, você envia PDFs e imagens de eletrocardiograma, ecocardiograma, Holter, MAPA, teste ergométrico, laudos e relatórios. Os documentos ficam associados ao seu cadastro e ajudam a equipe a organizar melhor sua consulta.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/exames" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
                  Conhecer envio de exames
                </Link>
                <Link href="/portal" className="inline-flex w-fit rounded-full border border-[#14508B]/25 bg-white px-6 py-3 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
                  Enviar pelo portal
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-col rounded-2xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Simples e organizado</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#0F3760]">Prepare sua consulta em poucos minutos</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Não precisa separar papéis no dia do atendimento. Envie seus documentos antecipadamente e mantenha tudo reunido no portal.
              </p>

              <ol className="mt-6 grid gap-3">
                {[
                  ['1', 'Acesse ou crie seu cadastro gratuito.'],
                  ['2', 'Anexe seus exames em PDF ou imagem.'],
                  ['3', 'Marque a consulta com o médico escolhido.'],
                ].map(([number, item]) => (
                  <li key={number} className="flex min-w-0 items-center gap-3 rounded-xl bg-[#F4F9FF] px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14508B] text-xs font-bold text-white">{number}</span>
                    <span className="text-sm font-semibold leading-6 text-[#0F3760]">{item}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-xl bg-[#0F3760] p-5 text-white">
                <p className="text-sm font-bold">Ainda não marcou sua consulta?</p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  Escolha o médico e veja os horários disponíveis. Seus exames poderão ser enviados pelo mesmo portal.
                </p>
                <Link href={portalLink} className="cta-pulse mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#14508B] hover:bg-[#EAF6FF]">
                  Ver agenda e marcar consulta
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="presenca-socesp" className="overflow-hidden bg-[#0F3760] py-14 text-white sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">SOCESP 2026 • São Paulo</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                  Presença ativa do Dr. Paulo Nogueira na sociedade médica de cardiologia.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/80">
                  Além da prática clínica, o Prof. Dr. Paulo participa de aulas, bancas e discussões científicas em congressos de cardiologia, mantendo atualização contínua e contribuindo para a formação e o debate entre médicos cardiologistas.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Aula científica', 'Apresentação de conteúdo técnico para cardiologistas.'],
                    ['Banca médica', 'Condução e discussão de casos com especialistas.'],
                    ['Atualização contínua', 'Presença em ambiente de evidência e educação médica.'],
                  ].map(([title, description]) => (
                    <article key={title} className="border-l-2 border-[#9FE6FF] bg-white/8 p-4">
                      <h3 className="text-sm font-bold">{title}</h3>
                      <p className="mt-2 text-xs leading-5 text-white/75">{description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/14 bg-white/8 p-4 shadow-[0_30px_70px_-46px_rgba(0,0,0,0.65)]">
                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                  <video
                    className="h-full w-full object-cover"
                    controls
                    preload="metadata"
                    poster="/uploads-imagens-nogueira/paulo-socesp27.jpeg"
                  >
                    <source src="/uploads-imagens-nogueira/paulo-socesp42.mp4" type="video/mp4" />
                  </video>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  Registro em vídeo da participação do Dr. Paulo em ambiente científico, reforçando sua atuação como médico, professor e educador em cardiologia.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <div className="socesp-carousel overflow-hidden">
                <div className="socesp-carousel-track flex gap-4">
                  {[...socespHighlights, ...socespHighlights].map((item, index) => (
                    <article key={`${item.image}-${index}`} className="relative h-[430px] w-[300px] shrink-0 overflow-hidden rounded-2xl bg-[#08243F] shadow-[0_24px_54px_-40px_rgba(0,0,0,0.82)] sm:w-[340px]">
                      <Image
                        src={item.image}
                        alt={`${item.title} - ${item.description}`}
                        fill
                        sizes="(max-width: 640px) 300px, 340px"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(8,36,63,0)_0%,rgba(8,36,63,0.92)_100%)] p-5">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-xs leading-5 text-white/80">{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="clinica" className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] bg-[#F4F9FF] shadow-[0_26px_70px_-48px_rgba(20,80,139,0.85)]">
              <Image
                src={`${assetPath}/nogueira-cardiologia-pauloecris1.png`}
                alt="Dr. Paulo Roberto Nogueira e Dra. Cristiani Nogueira na clínica Nogueira Cardiologia"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-[50%_18%]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,55,96,0)_0%,rgba(15,55,96,0.84)_100%)] p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Corpo clínico aprovado</p>
                <h3 className="mt-2 text-2xl font-semibold">Dr. Paulo Nogueira e Dra. Cristiani Nogueira</h3>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Nogueira Cardiologia</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Cardiologia em São José do Rio Preto com experiência, prevenção e acompanhamento humanizado.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                A Nogueira Cardiologia reúne o Prof. Dr. Paulo Roberto Nogueira e a Dra. Cristiani Nogueira em uma rotina de cuidado voltada à saúde do coração, check-up cardiológico, prevenção cardiovascular, investigação de sintomas, telemedicina e seguimento clínico contínuo.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="border-l-2 border-[#14508B] bg-[#F4F9FF] p-4">
                  <h3 className="font-semibold text-[#0F3760]">Professor, cardiologista e educador</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Conteúdo médico, aulas e experiência clínica do Prof. Dr. Paulo aproximam o paciente de informação cardiovascular confiável.</p>
                </div>
                <div className="border-l-2 border-[#15A7DD] bg-[#F4F9FF] p-4">
                  <h3 className="font-semibold text-[#0F3760]">Cuidado próximo com a Dra. Cristiani</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Escuta qualificada, orientação clara e acompanhamento para hipertensão, sintomas cardíacos e prevenção de risco cardiovascular.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="especialidades" className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14508B]">Especialidades</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Especialidades em cardiologia para prevenção, diagnóstico e acompanhamento do coração.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Da consulta cardiológica ao check-up preventivo, da telemedicina ao acompanhamento presencial, a Nogueira Cardiologia orienta pacientes de São José do Rio Preto e de outras cidades com foco em segurança cardiovascular.
              </p>
            </div>
            <div className="specialties-carousel mt-8 overflow-hidden" aria-label="Especialidades da Nogueira Cardiologia">
              <div className="specialties-carousel-track">
                {[...specialties, ...specialties].map((specialty, index) => (
                  <article
                    key={`${specialty.title}-${index}`}
                    className="min-h-[252px] w-[286px] shrink-0 rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)] sm:w-[350px]"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#14508B] ring-1 ring-[#14508B]/10">
                        <SpecialtyIcon name={specialty.icon} />
                      </span>
                      <span className="h-1.5 w-12 rounded-full bg-[#15A7DD]" />
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-[#14508B]">{specialty.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{specialty.description}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={portalLink}
                  className="cta-pulse inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760]"
                >
                  Marcar consulta
                </Link>
              <span className="text-sm leading-6 text-slate-600">
                Atendimento em cardiologia clínica, telemedicina, prevenção cardiovascular e acompanhamento cardiológico contínuo.
              </span>
            </div>
          </div>
        </section>

        <section id="corpo-clinico" className="bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Corpo clínico</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">Corpo clínico para consulta cardiológica, prevenção e seguimento do coração.</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {doctors.map((doctor) => (
                <article key={doctor.name} className="overflow-hidden rounded-2xl border border-[#14508B]/12 bg-white shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
                  <div className="grid sm:grid-cols-[260px_1fr]">
                    <div className="relative min-h-[360px] bg-[#F4F9FF] sm:min-h-full">
                      <Image src={doctor.image} alt={`Foto oficial de ${doctor.name}`} fill sizes="(max-width: 639px) 100vw, 260px" className="object-cover object-[50%_16%]" />
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Cardiologia</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#0F3760]">
                        <Link href={doctor.name.startsWith('Dr. Paulo') ? '/medicos/dr-paulo-roberto-nogueira' : '/medicos/dra-cristiani-nogueira'}>
                          {doctor.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm font-bold text-[#14508B]">{doctor.crm}</p>
                      <p className="mt-4 text-sm leading-7 text-slate-600">{doctor.bio}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="blog" className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14508B]">Educativo</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                  Conteúdo educativo em cardiologia para orientar pacientes, famílias e a comunidade.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Este espaço reúne aulas, materiais e orientações sobre prevenção cardiovascular, hipertensão, sintomas cardíacos, check-up cardiológico, coronariopatias e cardiomiopatias. A proposta é transformar conhecimento médico em linguagem clara para ajudar a comunidade a tomar decisões melhores sobre a saúde do coração.
                </p>
                <div className="mt-6 rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_56px_-44px_rgba(20,80,139,0.72)]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Professor e educador</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    O Prof. Dr. Paulo Roberto Nogueira atua como cardiologista intensivista e professor, com foco em cardiologia clínica, coronariopatias e cardiomiopatias. O Educativo da Nogueira nasce para publicar conteúdos frequentes, úteis e responsáveis.
                  </p>
                </div>
                <Link href="/blog" className="mt-7 inline-flex rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760]">
                  Acessar todos os conteúdos educativos
                </Link>
              </div>

              <div className="grid gap-4">
                <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-[#0F3760] shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
                  <Image
                    src={`${assetPath}/paulo-socesp4.jpeg`}
                    alt="Prof. Dr. Paulo Roberto Nogueira em aula de cardiologia"
                    fill
                    sizes="(max-width: 1023px) 100vw, 55vw"
                    className="object-cover object-[50%_18%]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,55,96,0)_0%,rgba(15,55,96,0.84)_100%)]" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Aulas, prevenção e cardiologia clínica</p>
                    <h3 className="mt-2 text-xl font-semibold">Educação médica para aproximar ciência, prevenção e cuidado humanizado.</h3>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {educationalPosts.map((post) => (
                    <article key={post.slug} className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">{post.category}</p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug text-[#0F3760]">
                        <Link href={`/blog/${post.slug}`} className="hover:text-[#14508B]">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                      <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
                        Ler conteúdo educativo
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] bg-[#14508B] p-7 text-white sm:p-10">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Pronto para cuidar do coração com uma jornada mais simples?</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90 sm:text-base">
                Acesse o portal do paciente para solicitar consulta presencial, atendimento virtual por telemedicina ou fale diretamente com a clínica pelo WhatsApp.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={portalLink} className="cta-pulse inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] transition-colors hover:bg-[#EAF6FF]">
                  Marcar consulta
                </Link>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0A2C4D] pb-10 pt-12 text-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:px-8">
          <div>
            <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white p-2 shadow-[0_18px_40px_-28px_rgba(255,255,255,0.9)] ring-1 ring-white/60">
              <Image
                src={`${assetPath}/nogueira-cardio2-transparent.png`}
                alt="Símbolo da Nogueira Cardiologia"
                width={72}
                height={72}
                className="h-[58px] w-[58px] object-contain"
              />
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
              Experiência em cardiologia desde 1998. A Nogueira Cardiologia, com a trajetória do Prof. Dr. Paulo Roberto Nogueira e da Dra. Cristiani Nogueira, une cuidado médico, prevenção cardiovascular, telemedicina e uma frente digital para facilitar consulta, exames e acesso à informação em saúde do coração.
            </p>
            <p className="mt-4 text-sm font-semibold text-white/88">Nos acompanhe nas redes sociais.</p>
            <div className="mt-5 flex items-center gap-3" aria-label="Redes sociais da Nogueira Cardiologia">
              {socialLinks.map(([label, href, icon]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Acessar ${label} da Nogueira Cardiologia`}
                  title={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 text-white/78 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white"
                >
                  <SocialIcon name={icon} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Contato</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895</p>
            <p className="mt-2 text-sm text-white/80">Telefone: (17) 2139-8338</p>
            <p className="mt-1 text-sm text-white/80">WhatsApp: (17) 99744-0223</p>
            <p className="mt-1 text-sm text-white/80">
              E-mail:{' '}
              <a href="mailto:contato@nogueiracardiologia.com.br" className="hover:text-white">
                contato@nogueiracardiologia.com.br
              </a>
            </p>
          </div>
          <div>
            <h2 className="font-semibold">Acessos rápidos</h2>
            <div className="mt-3 grid gap-2 text-sm text-white/80">
              <a href="#portal-paciente" className="hover:text-white">Portal do paciente</a>
              <a href="#telemedicina" className="hover:text-white">Telemedicina cardiológica</a>
              <Link href="/exames" className="hover:text-white">Envio digital de exames</Link>
              <a href="#presenca-socesp" className="hover:text-white">Presença médica na SOCESP</a>
              <Link href="/blog" className="hover:text-white">Educativo de cardiologia</Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp da clínica</a>
              <Link href="/privacidade" className="hover:text-white">Privacidade, LGPD e termos</Link>
            </div>
          </div>
        </div>
        <SecurityTrustBadges />
        <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col items-center gap-2 px-4 text-center text-xs leading-5 text-white/55 sm:px-6 lg:px-8">
          <p>CNPJ 12.388.371/0001-71 - Nogueira Cardiologia LTDA. © 2026 Todos os direitos reservados.</p>
          <p>
            Software e App desenvolvido por{' '}
            <a href={developerLink} target="_blank" rel="noreferrer" className="font-semibold text-white/78 hover:text-white">
              Matheus Libonatti
            </a>
            . Versão 1.001.001.
          </p>
        </div>
      </footer>

    </div>
  );
}
