import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { InternalLogin } from '@/components/internal/internal-login';
import { AuthorityBackdrop } from '@/components/site/authority-backdrop';
import { noIndexRobots } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Acesso Interno | Nogueira Cardiologia',
  description: 'Entrada restrita da equipe interna da Nogueira Cardiologia.',
  robots: noIndexRobots,
};

export default function InternalPage() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Image
            src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png"
            alt="Nogueira Cardiologia"
            width={320}
            height={80}
            className="h-10 w-auto object-contain"
            priority
          />
          <Link href="/" className="rounded-lg border border-[#14508B]/20 px-4 py-2 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
            Site público
          </Link>
        </div>
      </header>

      <AuthorityBackdrop
        eyebrow="Acesso interno"
        title="Gestão médica e administrativa da plataforma digital Nogueira Cardiologia."
        description="Área reservada para acompanhar pacientes, leads, consultas, pagamentos, exames enviados e evolução tecnológica da operação."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Acesso restrito</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
            Dashboard da equipe Nogueira Cardiologia.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Entrada separada do portal do paciente para acompanhar cadastros, leads, consultas, pagamentos e indicadores operacionais sem confundir quem chega pelo botão Marcar consulta.
          </p>
        </div>

        <section className="rounded-lg border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
          <h2 className="text-2xl font-semibold text-[#0F3760]">Entrar como médico/admin</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use um usuário com permissão de médico ou administrador.
          </p>
          <div className="mt-6">
            <InternalLogin />
          </div>
        </section>
      </section>
    </main>
  );
}
