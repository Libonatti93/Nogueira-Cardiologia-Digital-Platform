import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PortalAccess } from '@/components/portal/portal-access';

export const metadata: Metadata = {
  title: 'Portal do Paciente e Médico | Nogueira Cardiologia',
  description:
    'Acesse o portal da Nogueira Cardiologia para marcar consulta, entrar como paciente ou acessar a área médico/admin.',
};

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#F4F9FF] text-slate-950">
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

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Portal Nogueira Cardiologia</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
            Marque sua consulta, acesse conteúdos educativos e entre na área médica.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Pacientes podem criar cadastro gratuito para solicitar consulta e acessar materiais da clínica. Médicos e administradores acessam a área restrita para gestão da agenda e publicação de conteúdos educativos.
          </p>
        </div>

        <div className="mt-8">
          <PortalAccess />
        </div>
      </section>
    </main>
  );
}
