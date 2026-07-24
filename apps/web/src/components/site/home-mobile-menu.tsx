'use client';

const items = [
  ['Clínica', '#clinica'],
  ['Telemedicina', '#telemedicina'],
  ['Portal do paciente', '#portal-paciente'],
  ['Envio de exames', '#exames'],
  ['Corpo clínico', '#corpo-clinico'],
  ['Especialidades', '#especialidades'],
  ['Conteúdo educativo', '#blog'],
  ['Contato', '#contato'],
] as const;

export function HomeMobileMenu() {
  return (
    <details className="group relative shrink-0 xl:hidden">
      <summary
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#14508B]/15 bg-white text-[#14508B] transition-colors hover:bg-[#F4F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14508B] [&::-webkit-details-marker]:hidden"
        aria-label="Abrir menu de navegação"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg viewBox="0 0 24 24" className="hidden h-5 w-5 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </summary>

      <nav
        className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#14508B]/12 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(15,55,96,0.48)]"
        aria-label="Navegação mobile"
      >
        {items.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#F4F9FF] hover:text-[#14508B]"
            onClick={(event) => {
              event.currentTarget.closest('details')?.removeAttribute('open');
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </details>
  );
}
