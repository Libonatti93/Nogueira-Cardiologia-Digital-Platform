import Link from 'next/link';

const message = 'CONSULTAS ONLINE COM 24% DE DESCONTO · CADASTRE-SE E APROVEITE';

export function PromotionTicker({ placement = 'top' }: { placement?: 'top' | 'footer' }) {
  return (
    <Link
      href="/portal"
      aria-label="Cadastrar-se para aproveitar o desconto da consulta online"
      className={`group block h-8 shrink-0 overflow-hidden bg-black text-white ${
        placement === 'top' ? 'sticky top-0 z-[80]' : 'mt-auto'
      }`}
    >
      <span className="promotion-ticker-track flex h-8 w-max items-center whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="flex items-center">
            <span className="px-7">{message}</span>
            <span className="text-emerald-400" aria-hidden="true">●</span>
          </span>
        ))}
      </span>
    </Link>
  );
}
