import Image from 'next/image';

type TrustBadgeVariant = 'footer' | 'floating';

const footerBadges = [
  {
    title: 'Asaas API',
    description: 'Gateway de pagamento',
    image: '/security-logos/asaas-logo.svg',
    imageClassName: 'h-5 w-auto',
    width: 100,
    height: 17,
    href: 'https://www.asaas.com/',
  },
  {
    title: 'PCI-DSS',
    description: 'Certificação do gateway',
    image: '/security-logos/pci-dss-logo.svg',
    imageClassName: 'h-8 w-auto',
    width: 90,
    height: 42,
    href: 'https://docs.asaas.com/docs/pci-dss-1',
  },
  {
    title: 'LGPD',
    description: 'Privacidade e dados pessoais',
    image: '/security-logos/lgpd-govbr.png',
    imageClassName: 'h-10 w-auto',
    width: 453,
    height: 190,
    href: '/privacidade',
  },
  {
    title: 'SSL/TLS',
    description: 'Certificado Let\'s Encrypt',
    image: '/security-logos/lets-encrypt-wide-white.svg',
    imageClassName: 'h-8 w-auto',
    width: 367,
    height: 108,
    href: 'https://letsencrypt.org/pt-br/about/',
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
      <div className="flex flex-col items-center gap-4 border-y border-white/10 py-5">
        <p className="text-center text-xs font-semibold uppercase text-white/58">
          Ambiente protegido para cadastro, agendamento e pagamento
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          {footerBadges.map((item) => {
            const isInternal = item.href.startsWith('/');

            return (
              <a
                key={item.title}
                href={item.href}
                target={isInternal ? undefined : '_blank'}
                rel={isInternal ? undefined : 'noreferrer'}
                aria-label={`${item.title}: ${item.description}`}
                title={`${item.title}: ${item.description}`}
                className="inline-flex h-14 min-w-[8.5rem] items-center justify-center rounded-md border border-white/12 bg-white/10 px-4 transition-colors hover:border-white/28 hover:bg-white/14"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  className={`max-w-[118px] object-contain ${item.imageClassName}`}
                  unoptimized
                />
              </a>
            );
          })}
        </div>
        <p className="max-w-3xl text-center text-xs leading-5 text-white/52">
          Conexão HTTPS com certificado ativo, política de privacidade/LGPD e pagamentos integrados ao Asaas.
        </p>
      </div>
    </section>
  );
}
