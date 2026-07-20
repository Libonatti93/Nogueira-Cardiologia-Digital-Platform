import Image from 'next/image';
import Link from 'next/link';
import { AuthorityBackdrop } from '@/components/site/authority-backdrop';

const navItems = [
  ['Paciente', '/portal/paciente'],
  ['Agendar', '/portal/paciente/agendar'],
  ['Exames', '/portal/paciente/exames'],
  ['Conteúdos', '/blog'],
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F4F9FF] text-slate-950">
      <header className="border-b border-[#14508B]/10 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
          <nav className="flex flex-wrap gap-2 text-sm font-bold text-[#14508B]">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-full border border-[#14508B]/18 px-4 py-2 hover:border-[#14508B]/55">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <AuthorityBackdrop
        eyebrow="Portal do paciente"
        title="Uma jornada digital para cadastro, agendamento e envio de exames cardiologicos."
        description="O paciente acessa dados, solicita consulta, envia documentacao medica e acompanha a experiencia com mais clareza antes do atendimento."
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
