import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PortalAccess } from '@/components/portal/portal-access';
import { AuthorityBackdrop } from '@/components/site/authority-backdrop';
import { PublicFooter } from '@/components/site/public-footer';

export const metadata: Metadata = {
  title: 'Portal do Paciente | Nogueira Cardiologia',
  description:
    'Acesse o portal da Nogueira Cardiologia para marcar consulta com cardiologista, enviar exames e acompanhar conteúdos de saúde cardiovascular.',
};

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; confirm?: string }>;
}) {
  const params = await searchParams;
  const initialNotice =
    params.verified === '1'
      ? 'E-mail confirmado com sucesso. Você já pode entrar no portal do paciente.'
      : params.verified === 'invalid'
        ? 'Este link de confirmação expirou ou já foi usado. Solicite um novo link.'
        : params.confirm === '1'
          ? 'Confirme seu e-mail para liberar o acesso completo ao portal.'
          : undefined;

  return (
    <div className="min-h-screen bg-[#F4F9FF] text-slate-950">
      <header className="border-b border-[#14508B]/10 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Voltar para a Nogueira Cardiologia">
            <Image
              src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png"
              alt="Nogueira Cardiologia"
              width={320}
              height={80}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <Link href="/" className="rounded-full border border-[#14508B]/20 px-5 py-2.5 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
            Voltar ao site
          </Link>
        </div>
      </header>

      <AuthorityBackdrop
        eyebrow="Portal do paciente"
        title="Acesso digital para marcar consulta, enviar exames e cuidar melhor da sua saúde cardiovascular."
        description="A Nogueira Cardiologia conecta agendamento médico, portal do paciente, central de exames, prevenção cardiológica e conteúdo educativo em uma jornada simples, segura e moderna."
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Portal Nogueira Cardiologia</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
            Marque sua consulta cardiológica e acesse orientações confiáveis sobre saúde do coração.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            O portal reúne cadastro rápido, confirmação por e-mail, agendamento online, envio de exames e materiais educativos para quem busca cardiologista, check-up cardiológico, prevenção e acompanhamento especializado.
          </p>
        </div>

        <div className="mt-8">
          <PortalAccess initialNotice={initialNotice} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Cadastro gratuito', '/portal', 'Crie seu acesso com nome, e-mail, WhatsApp e senha para iniciar sua jornada.'],
            ['Consulta cardiológica', '/portal/paciente', 'Solicite atendimento, organize seus dados e prepare informações importantes antes da consulta.'],
            ['Educação cardiovascular', '/blog', 'Leia conteúdos sobre pressão alta, check-up, dor no peito, exames cardiológicos e prevenção.'],
          ].map(([title, href, description]) => (
            <Link key={href} href={href} className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)] hover:border-[#14508B]/35">
              <h2 className="text-lg font-semibold text-[#0F3760]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
