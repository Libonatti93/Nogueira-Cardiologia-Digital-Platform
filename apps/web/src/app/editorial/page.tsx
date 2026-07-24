import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

export const metadata: Metadata = {
  title: 'Política Editorial Médica | Nogueira Cardiologia',
  description: 'Conheça os critérios de autoria, revisão médica, atualização e correção dos conteúdos da Nogueira Cardiologia.',
  alternates: { canonical: '/editorial' },
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Transparência editorial</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">Política editorial médica</h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          O educativo da Nogueira Cardiologia tem finalidade informativa e busca traduzir temas cardiovasculares em linguagem clara, responsável e útil para pacientes e famílias.
        </p>

        <div className="mt-8 grid gap-5">
          {[
            ['Autoria e revisão', 'Os conteúdos são publicados pela Nogueira Cardiologia e passam por revisão editorial médica do Dr. Paulo Roberto Nogueira, CRM 53.790/SP, e da Dra. Cristiani Monteiro de Oliveira Nogueira, CRM 77.127/SP.'],
            ['Fontes', 'A elaboração considera diretrizes de sociedades médicas, literatura científica e orientações de órgãos públicos de saúde. As referências gerais são indicadas nos artigos e fontes específicas podem ser incorporadas nas revisões.'],
            ['Atualizações', 'Cada artigo informa datas de publicação e atualização. O conteúdo é revisto quando novas evidências, diretrizes ou necessidades de esclarecimento justificam mudança substancial.'],
            ['Correções', 'Erros factuais ou de redação identificados pela equipe ou comunicados pelos leitores são avaliados e corrigidos. Alterações relevantes devem atualizar a data de revisão.'],
            ['Limites', 'O conteúdo não substitui consulta, diagnóstico, prescrição ou atendimento de urgência. Recomendações dependem do histórico, exame clínico e contexto de cada paciente.'],
          ].map(([title, text]) => (
            <section key={title} className="rounded-3xl border border-[#14508B]/12 bg-white p-6">
              <h2 className="text-xl font-semibold text-[#103E6A]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{text}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/medicos/dr-paulo-roberto-nogueira" className="rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white">Conhecer Dr. Paulo</Link>
          <Link href="/medicos/dra-cristiani-nogueira" className="rounded-full border border-[#14508B]/25 px-6 py-3 text-sm font-bold text-[#14508B]">Conhecer Dra. Cristiani</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
