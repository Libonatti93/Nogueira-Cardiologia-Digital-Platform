import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const steps = [
  ['1. Entre no portal', 'O paciente acessa o portal com seu cadastro para manter o envio vinculado aos seus dados.'],
  ['2. Anexe o exame', 'Envie PDF, JPG, PNG ou WEBP de laudos, eletrocardiogramas, ecocardiogramas, Holter, MAPA ou outros documentos.'],
  ['3. A equipe acompanha', 'Secretaria e medico visualizam os arquivos na dashboard interna para organizar a documentacao antes da consulta.'],
  ['4. Evolucao tecnologica', 'A plataforma foi preparada para crescer com automacoes, organizacao de dados e futuras analises assistidas por tecnologia.'],
] as const;

const examExamples = [
  'Eletrocardiograma',
  'Ecocardiograma',
  'Holter',
  'MAPA',
  'Teste ergometrico',
  'Exames laboratoriais',
  'Tomografia',
  'Ressonancia',
  'Relatorios medicos',
] as const;

export const metadata: Metadata = {
  title: 'Envio Digital de Exames Cardiologicos | Nogueira Cardiologia',
  description:
    'Envie exames cardiologicos e documentos pelo portal do paciente da Nogueira Cardiologia para adiantar a organizacao da consulta medica em Sao Jose do Rio Preto.',
  keywords: [
    'envio de exames cardiologicos',
    'portal do paciente cardiologia',
    'exames para cardiologista',
    'Nogueira Cardiologia',
    'cardiologista Sao Jose do Rio Preto',
    'upload de exames medicos',
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
                Envio digital de exames para adiantar sua documentacao cardiologica.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600">
                A Nogueira Cardiologia agora conta com uma central para o paciente anexar exames e documentos antes da consulta. O objetivo e organizar melhor a jornada, facilitar o acesso da equipe medica aos arquivos e preparar a plataforma para evoluir com tecnologia, automacoes e analises assistidas.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/portal" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
                  Enviar exame pelo portal
                </Link>
                <Link href="/blog" className="inline-flex w-fit rounded-full border border-[#14508B]/20 px-6 py-3 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
                  Ler conteudos educativos
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
                Nesta primeira fase, aceitamos arquivos simples como PDF e imagens. A evolucao natural da plataforma podera incluir organizacao avancada, automacoes via n8n e visualizacao especializada para formatos medicos.
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
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {steps.map(([title, text]) => (
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
              Tecnologia a favor da cardiologia, com revisao medica no centro da decisao.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/82 sm:text-base">
              A plataforma esta em constante evolucao para apoiar a equipe com dados mais organizados, automacoes e futuras analises assistidas. A tecnologia entra como apoio para melhorar fluxo, documentacao e preparo da consulta, sempre preservando a avaliacao medica responsavel.
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
