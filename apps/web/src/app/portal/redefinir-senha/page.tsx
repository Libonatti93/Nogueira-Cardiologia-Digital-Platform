import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PasswordResetForm } from '@/components/portal/password-reset-form';
import { AuthorityBackdrop } from '@/components/site/authority-backdrop';
import { PublicFooter } from '@/components/site/public-footer';

export const metadata: Metadata = {
  title: 'Redefinir Senha | Portal do Paciente',
  description: 'Crie uma nova senha para acessar o portal do paciente da Nogueira Cardiologia.',
};

export default function ResetPasswordPage() {
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
          <Link href="/portal" className="rounded-full border border-[#14508B]/20 px-5 py-2.5 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
            Voltar ao portal
          </Link>
        </div>
      </header>

      <AuthorityBackdrop
        eyebrow="Portal do paciente"
        title="Recupere seu acesso de forma segura."
        description="A redefinição de senha acontece por link enviado ao e-mail cadastrado, mantendo o acesso do paciente protegido."
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <PasswordResetForm />
      </main>

      <PublicFooter />
    </div>
  );
}
