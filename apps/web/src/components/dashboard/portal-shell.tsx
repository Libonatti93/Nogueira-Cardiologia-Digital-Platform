import Image from 'next/image';
import Link from 'next/link';

const navItems = [
  ['Início', '/portal/paciente'],
  ['Agendar consulta', '/portal/paciente/agendar'],
  ['Meus exames', '/portal/paciente/exames'],
] as const;

export function PortalShell({ children, patientName }: { children: React.ReactNode; patientName?: string }) {
  const firstName = patientName?.trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#F6F8FB] text-slate-950">
      <header className="sticky top-8 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
          <nav className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto text-sm font-semibold text-slate-600">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-3 py-2 hover:bg-[#EAF4FF] hover:text-[#14508B]">
                {label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="post">
              <button className="whitespace-nowrap rounded-xl px-3 py-2 hover:bg-slate-100 hover:text-slate-950" type="submit">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      {firstName ? (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
            Olá, <strong className="text-[#0F3760]">{firstName}</strong>. O que você precisa hoje?
          </div>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
