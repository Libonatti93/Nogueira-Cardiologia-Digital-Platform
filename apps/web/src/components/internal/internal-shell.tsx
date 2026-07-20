import Image from 'next/image';
import Link from 'next/link';

const navItems = [
  ['Dashboard', '/interno/dashboard'],
  ['Pacientes', '#pacientes'],
  ['Leads', '#leads'],
  ['Consultas', '#consultas'],
  ['Exames', '#exames'],
  ['Pagamentos', '#pagamentos'],
] as const;

export function InternalShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/interno/dashboard" className="flex items-center gap-3" aria-label="Dashboard interna Nogueira Cardiologia">
            <Image
              src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png"
              alt="Nogueira Cardiologia"
              width={320}
              height={80}
              className="h-10 w-auto object-contain"
              priority
            />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-bold text-[#0F3760] sm:inline">
              Equipe interna
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold text-[#14508B]">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg border border-[#14508B]/18 px-3 py-2 hover:border-[#14508B]/55">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
