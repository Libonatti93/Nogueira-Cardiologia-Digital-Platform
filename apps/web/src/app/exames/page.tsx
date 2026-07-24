import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const steps = [
  ['Acesse sua conta', 'Entre no Portal do Paciente para que cada arquivo fique associado corretamente ao seu cadastro.'],
  ['Envie seus exames', 'Anexe laudos e imagens em PDF, JPG, PNG ou WEBP. Você pode enviar mais de um documento.'],
  ['Confirme o envio', 'Após concluir, os arquivos ficam organizados em sua área para acompanhamento da equipe da clínica.'],
  ['Prepare sua consulta', 'Com os documentos reunidos antecipadamente, a equipe pode organizar melhor o atendimento e o histórico apresentado ao médico.'],
] as const;

const examExamples = [
  'Eletrocardiograma',
  'Ecocardiograma',
  'Holter',
  'MAPA',
  'Teste ergométrico',
  'Exames laboratoriais',
  'Tomografia',
  'Ressonância',
  'Relatórios médicos',
] as const;

export const metadata: Metadata = {
  title: 'Envio Digital de Exames Cardiológicos | Nogueira Cardiologia',
  description:
    'Envie laudos e exames cardiológicos pelo Portal do Paciente da Nogueira Cardiologia. Entenda como funcionam PACS, DICOM e o apoio responsável da inteligência artificial.',
  keywords: [
    'envio de exames cardiológicos',
    'central de exames cardiológicos',
    'PACS cardiologia',
    'DICOM cardiologia',
    'PACS para clínica cardiológica',
    'exames digitais cardiologia',
    'portal do paciente cardiologia',
    'exames para cardiologista',
    'Nogueira Cardiologia',
    'cardiologista São José do Rio Preto',
    'upload de exames médicos',
  ],
  alternates: { canonical: '/exames' },
};

export default function ExamsPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white text-slate-950">
      <PublicHeader />

      <main>
        <section className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Central de exames</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
                Seus exames cardiológicos organizados em um só lugar.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Envie laudos, imagens e documentos pelo Portal do Paciente antes da consulta. Assim, suas informações ficam reunidas no seu cadastro e disponíveis para a equipe organizar o atendimento com mais agilidade, segurança e continuidade.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/portal" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
                  Enviar exame pelo portal
                </Link>
                <Link href="/blog" className="inline-flex w-fit rounded-full border border-[#14508B]/20 px-6 py-3 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
                  Ler conteúdos educativos
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
              <h2 className="text-2xl font-semibold text-[#0F3760]">Exames e documentos aceitos</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {examExamples.map((example) => (
                  <span key={example} className="rounded-full bg-[#EAF6FF] px-4 py-2 text-sm font-semibold text-[#14508B]">
                    {example}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Você pode enviar laudos em PDF e imagens nos formatos JPG, PNG ou WEBP. Caso tenha arquivos em outro formato ou um exame completo fornecido por um laboratório, fale com nossa equipe para receber orientação.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Como funciona</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Envie seus documentos em quatro passos simples.
              </h2>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {steps.map(([title, text], index) => (
                <div key={title} className="relative">
                  {index < steps.length - 1 ? (
                    <div className="absolute left-[calc(100%-0.75rem)] top-10 z-10 hidden h-px w-8 bg-[#15A7DD] lg:block">
                      <span className="absolute -right-1 -top-[5px] h-3 w-3 rotate-45 border-r-2 border-t-2 border-[#15A7DD]" />
                    </div>
                  ) : null}
                  <article className="min-h-[245px] rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#14508B] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#0F3760]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14508B]">Tecnologia aplicada à saúde</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                O que são PACS e DICOM — e por que isso importa?
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                PACS é a sigla para um sistema que armazena, organiza e permite a visualização de imagens médicas. Em vez de depender apenas de filmes, CDs ou documentos separados, esse tipo de tecnologia ajuda a reunir exames e seus respectivos dados em um ambiente digital.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                DICOM é o padrão internacional utilizado para estruturar e compartilhar muitas dessas imagens, preservando informações importantes sobre o exame. A plataforma da Nogueira Cardiologia foi planejada para acompanhar essa evolução tecnológica de forma gradual, responsável e integrada ao cuidado médico.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Tudo associado ao paciente', 'Laudos e imagens enviados pelo portal permanecem vinculados ao cadastro correto.'],
                ['Informação mais organizada', 'A central reduz documentos dispersos e facilita a localização dos arquivos recebidos.'],
                ['Evolução para imagens médicas', 'A arquitetura considera a futura organização de estudos e séries no padrão DICOM.'],
                ['Inteligência artificial responsável', 'A IA poderá apoiar classificação, resumo e conferência de informações, sempre com supervisão humana e médica.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
                  <h3 className="text-lg font-semibold text-[#0F3760]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0A2C4D] py-14 text-white sm:py-16">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Tecnologia a favor da cardiologia, com revisão médica no centro da decisão.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/82 sm:text-base">
              Tecnologia e inteligência artificial podem ajudar a organizar documentos, destacar informações e tornar o fluxo mais eficiente. Elas não substituem consulta, diagnóstico ou decisão médica. Na Nogueira Cardiologia, qualquer recurso digital é pensado como apoio ao cuidado, mantendo o cardiologista responsável pela interpretação clínica.
            </p>
            <Link href="/portal" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] hover:bg-[#EAF6FF]">
              Acessar portal do paciente
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
