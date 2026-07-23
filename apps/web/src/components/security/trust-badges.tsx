type TrustBadgeVariant = 'footer' | 'floating';

const trustItems = [
  {
    title: 'SSL/TLS ativo',
    description: 'Conexão protegida por HTTPS',
  },
  {
    title: 'LGPD',
    description: 'Dados tratados com política de privacidade',
  },
  {
    title: 'Asaas API',
    description: 'Pagamentos processados por gateway certificado',
  },
] as const;

function ShieldIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-none stroke-current stroke-2`}>
      <path d="M12 3 5.5 5.6v5.7c0 4.3 2.7 7.7 6.5 9.7 3.8-2 6.5-5.4 6.5-9.7V5.6L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.8 12.1 2.1 2.1 4.5-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SecurityTrustBadges({ variant = 'footer' }: { variant?: TrustBadgeVariant }) {
  if (variant === 'floating') {
    return (
      <aside
        aria-label="Indicadores de segurança do ambiente digital"
        className="fixed bottom-5 left-4 z-40 max-w-[calc(100vw-6.5rem)] rounded-full border border-[#B9E6F8]/80 bg-white/88 px-3 py-2 text-[#0F3760] shadow-[0_16px_34px_-24px_rgba(15,55,96,0.75)] backdrop-blur-md sm:left-6 sm:max-w-none sm:px-4"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF6FF] text-[#14508B]">
            <ShieldIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold leading-4">Ambiente seguro</p>
            <p className="truncate text-[11px] leading-4 text-slate-600">SSL, LGPD e Asaas API</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section aria-label="Segurança e proteção de dados" className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-3 rounded-2xl border border-white/14 bg-white/8 p-4 sm:grid-cols-3">
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/7 p-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#14508B]">
              <ShieldIcon />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/72">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs leading-5 text-white/58">
        O ambiente digital utiliza conexão criptografada, controles de privacidade e integração de pagamento com o Asaas.
      </p>
    </section>
  );
}
