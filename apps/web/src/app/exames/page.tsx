import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const steps = [
  ['Entre no portal', 'O paciente acessa sua área segura para manter o envio vinculado ao cadastro e ao histórico da jornada.'],
  ['Anexe o exame', 'Envie PDF, JPG, PNG ou WEBP de laudos, ECG, ecocardiograma, Holter, MAPA e outros documentos cardiológicos.'],
  ['Equipe acompanha', 'Secretaria e médico visualizam os arquivos na dashboard interna para organizar a documentação antes da consulta.'],
  ['Evolução PACS', 'A base foi desenhada para evoluir com conceito de PACS, DICOM, automações via n8n e análises assistidas.'],
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
    'Envie exames cardiológicos e documentos pelo portal do paciente da Nogueira Cardiologia. Central de exames com arquitetura preparada para evoluir com PACS, DICOM e análises assistidas.',
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
};

export default function ExamsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PublicHeader />

      <main>
        <section className="bg-[#F4F9FF] py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Central de exames</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
                Central de exames cardiológicos com base tecnológica para evoluir em PACS.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600">
                A Nogueira Cardiologia agora conta com uma central para o paciente anexar exames e documentos antes da consulta. O objetivo é organizar melhor a jornada, facilitar o acesso da equipe médica aos arquivos e preparar a plataforma para evoluir com tecnologia, conceito de PACS, padrão DICOM, automações e análises assistidas.
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
                Nesta primeira fase, aceitamos arquivos simples como PDF e imagens. A evolução natural da plataforma poderá incluir organização avançada de exames, automações via n8n, visualização especializada e integração com padrões de imagem médica como DICOM.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Como funciona</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Uma jornada mais organizada antes da consulta.
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#14508B]">PACS, DICOM e futuro da plataforma</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
                Uma central de exames simples hoje, preparada para evoluir para um fluxo inspirado em PACS.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                PACS significa Picture Archiving and Communication System, uma estrutura usada para arquivar, organizar e comunicar imagens médicas. DICOM é o padrão técnico utilizado em muitos exames de imagem. A primeira entrega da Nogueira Cardiologia é o upload seguro de documentos, mas a arquitetura já considera a evolução para uma gestão mais avançada de exames cardiológicos digitais.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Central de exames', 'Organização de PDFs, imagens, laudos e documentos enviados pelo paciente.'],
                ['Dashboard médico/admin', 'Secretaria e médico enxergam os arquivos vinculados ao paciente antes da consulta.'],
                ['Base para PACS', 'Estrutura preparada para futura organização de estudos, séries e imagens médicas.'],
                ['IA e n8n no roadmap', 'Possibilidade de resumo auxiliar, classificação e alerta operacional com revisão médica.'],
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
              A plataforma está em constante evolução para apoiar a equipe com dados mais organizados, automações e futuras análises assistidas. A tecnologia entra como apoio para melhorar fluxo, documentação, gestão de exames cardiológicos e preparo da consulta, sempre preservando a avaliação médica responsável.
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
