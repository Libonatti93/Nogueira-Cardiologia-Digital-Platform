import Image from 'next/image';
import Link from 'next/link';
import { SecurityTrustBadges } from '@/components/security/trust-badges';

const whatsappLink = 'https://wa.me/5517997440223';
const developerLink = 'https://github.com/Libonatti93';
const socialLinks = [
  ['Instagram', 'https://www.instagram.com/drpaulonogueiracardiologista/', 'instagram'],
  ['LinkedIn', 'https://www.linkedin.com/in/paulo-roberto-nogueira-b704282a/', 'linkedin'],
] as const;

type SocialIconName = (typeof socialLinks)[number][2];

function SocialIcon({ name }: { name: SocialIconName }) {
  const iconProps = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'instagram':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.4" />
          <path d="M17.2 6.8h.01" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M8 11v5" />
          <path d="M8 8.5h.01" />
          <path d="M12 16v-5" />
          <path d="M12 13.1c0-1.3.9-2.1 2.1-2.1 1.3 0 1.9.8 1.9 2.4V16" />
        </svg>
      );
  }
}

export function PublicFooter() {
  return (
    <footer id="contato" className="bg-[#0A2C4D] pb-10 pt-12 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white p-2 shadow-[0_18px_40px_-28px_rgba(255,255,255,0.9)] ring-1 ring-white/60">
            <Image
              src="/uploads-imagens-nogueira/nogueira-cardio2-transparent.png"
              alt="Símbolo da Nogueira Cardiologia"
              width={72}
              height={72}
              className="h-[58px] w-[58px] object-contain"
            />
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            Experiência em cardiologia desde 1998. A Nogueira Cardiologia, com a trajetória do Prof. Dr. Paulo Roberto Nogueira e da Dra. Cristiani Nogueira, une cuidado médico, prevenção cardiovascular, telemedicina e uma frente digital para facilitar consulta, exames e acesso à informação em saúde do coração.
          </p>
          <p className="mt-4 text-sm font-semibold text-white/88">Nos acompanhe nas redes sociais.</p>
          <div className="mt-5 flex items-center gap-3" aria-label="Redes sociais da Nogueira Cardiologia">
            {socialLinks.map(([label, href, icon]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Acessar ${label} da Nogueira Cardiologia`}
                title={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 text-white/78 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white"
              >
                <SocialIcon name={icon} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold">Contato</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895</p>
          <p className="mt-2 text-sm text-white/80">Telefone: (17) 2139-8338</p>
          <p className="mt-1 text-sm text-white/80">WhatsApp: (17) 99744-0223</p>
          <p className="mt-1 text-sm text-white/80">
            E-mail:{' '}
            <a href="mailto:contato@nogueiracardiologia.com.br" className="hover:text-white">
              contato@nogueiracardiologia.com.br
            </a>
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Acessos rápidos</h2>
          <div className="mt-3 grid gap-2 text-sm text-white/80">
            <Link href="/portal" className="hover:text-white">Portal do paciente</Link>
            <Link href="/#telemedicina" className="hover:text-white">Telemedicina cardiológica</Link>
            <Link href="/exames" className="hover:text-white">Envio digital de exames</Link>
            <Link href="/#presenca-socesp" className="hover:text-white">Presença médica na SOCESP</Link>
            <Link href="/blog" className="hover:text-white">Educativo de cardiologia</Link>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp da clínica</a>
            <Link href="/privacidade" className="hover:text-white">Privacidade, LGPD e termos</Link>
          </div>
        </div>
      </div>
      <SecurityTrustBadges />
      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col items-center gap-2 px-4 text-center text-xs leading-5 text-white/55 sm:px-6 lg:px-8">
        <p>CNPJ 12.388.371/0001-71 - Nogueira Cardiologia LTDA. © 2026 Todos os direitos reservados.</p>
        <p>
          Software e App desenvolvido por{' '}
          <a href={developerLink} target="_blank" rel="noreferrer" className="font-semibold text-white/78 hover:text-white">
            Matheus Libonatti
          </a>
          . Versão 1.001.001.
        </p>
      </div>
    </footer>
  );
}
