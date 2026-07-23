import Image from 'next/image';
import Link from 'next/link';
import { AuthorityBackdrop } from '@/components/site/authority-backdrop';

const navigationItems = [
  ['Clínica', '/#clínica'],
  ['Paciente', '/#portal-paciente'],
  ['Corpo clinico', '/#corpo-clinico'],
  ['Especialidades', '/#especialidades'],
  ['Exames', '/exames'],
  ['Educativo', '/blog'],
  ['Contato', '/#contato'],
] as const;

export function PublicHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#14508B]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ir para o início">
            <Image
              src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png"
              alt="Nogueira Cardiologia"
              width={360}
              height={90}
              className="h-9 w-auto object-contain sm:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 xl:flex">
            {navigationItems.map(([label, href]) => (
              <Link key={href} href={href} className="transition-colors hover:text-[#14508B]">
                {label}
              </Link>
            ))}
          </nav>

          <Link
            href="/portal"
            className="cta-pulse inline-flex rounded-full bg-[#14508B] px-5 py-2.5 text-xs font-bold text-white shadow-[0_16px_34px_-18px_rgba(20,80,139,0.95)] transition-colors hover:bg-[#0F3760] sm:px-6 sm:text-sm"
          >
            Marcar consulta
          </Link>
        </div>
      </header>
      <AuthorityBackdrop />
    </>
  );
}
