import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const lastUpdated = '20 de julho de 2026';

const sections = [
  {
    title: '1. Quem somos',
    paragraphs: [
      'Esta Política de Privacidade, LGPD e Termos de Uso se aplica ao site, portal do paciente, área interna e canais digitais da Nogueira Cardiologia LTDA, CNPJ 12.388.371/0001-71.',
      'A Nogueira Cardiologia atua na prestação de serviços médicos em cardiologia e utiliza este ambiente digital para apresentar informações institucionais, receber contatos, organizar solicitações de consulta e disponibilizar conteúdos educativos.',
    ],
  },
  {
    title: '2. Quais dados podemos coletar',
    paragraphs: [
      'Podemos coletar dados fornecidos diretamente pelo usuário, como nome completo, e-mail, telefone/WhatsApp, CPF, data de nascimento, altura, peso, preferência de médico, informações de saúde declaradas pelo próprio paciente e consentimento LGPD.',
      'Também podemos coletar dados técnicos necessários ao funcionamento e segurança do site, como endereço IP, data e hora de acesso, navegador, dispositivo, páginas acessadas e registros de auditoria.',
    ],
  },
  {
    title: '3. Dados sensíveis de saúde',
    paragraphs: [
      'Informações relacionadas a saúde, como hipertensão, diabetes, colesterol alto, tabagismo, altura, peso e histórico informado pelo paciente, podem ser consideradas dados pessoais sensíveis pela LGPD.',
      'Esses dados são tratados com finalidade assistencial, administrativa, preventiva, de organização do atendimento e de cumprimento de obrigações legais ou regulatórias aplicáveis aos serviços de saúde.',
    ],
  },
  {
    title: '4. Para que usamos os dados',
    paragraphs: [
      'Utilizamos dados pessoais para criar cadastro, permitir acesso ao portal, responder solicitações, organizar agenda, encaminhar contato da secretaria, registrar interesse em conteúdos educativos, processar pagamentos, manter segurança do sistema e melhorar a experiência do usuário.',
      'Também podemos utilizar informações agregadas ou estatísticas para entender o desempenho do site, melhorar conteúdos e apoiar a gestão da clínica, sem expor indevidamente dados pessoais.',
    ],
  },
  {
    title: '5. Cookies, analytics e ferramentas de terceiros',
    paragraphs: [
      'O site pode utilizar cookies, tecnologias semelhantes e ferramentas de mensuração para funcionamento, segurança, análise de desempenho, melhoria de navegação e eventual mensuração de campanhas.',
      'Caso sejam ativados recursos como Google Analytics, Google Ads ou tecnologias semelhantes, a Nogueira Cardiologia devera informar o uso dessas ferramentas e disponibilizar opcoes de controle quando aplicavel.',
    ],
  },
  {
    title: '6. Base legal e LGPD',
    paragraphs: [
      'O tratamento de dados pode ocorrer com base no consentimento do titular, execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal ou regulatoria, tutela da saúde, legítimo interesse e exercício regular de direitos.',
      'O titular pode solicitar informações sobre seus dados, correção, atualização, exclusão quando aplicavel, portabilidade, revisão de consentimentos e demais direitos previstos na Lei Geral de Proteção de Dados.',
    ],
  },
  {
    title: '7. Compartilhamento de dados',
    paragraphs: [
      'Dados podem ser compartilhados com profissionais autorizados da clínica, prestadores de tecnologia, hospedagem, banco de dados, automação, meios de pagamento, ferramentas de comunicação, contabilidade, assessoria jurídica ou autoridades competentes quando necessário.',
      'O compartilhamento deve ocorrer apenas na medida necessaria para funcionamento do serviço, atendimento ao paciente, segurança, cumprimento legal ou operação administrativa.',
    ],
  },
  {
    title: '8. Seguranca da informacao',
    paragraphs: [
      'Adotamos medidas técnicas e administrativas para proteger dados pessoais contra acessos não autorizados, perda, alteração, divulgação indevida ou uso inadequado.',
      'Entre as medidas estão uso de HTTPS, controle de acesso, banco de dados protegido, senhas criptografadas, registros de auditoria e separação entre área pública, portal do paciente e área interna.',
    ],
  },
  {
    title: '9. Retenção e exclusão',
    paragraphs: [
      'Os dados podem ser mantidos pelo tempo necessário para cumprir as finalidades informadas, obrigações legais, regulatórias, fiscais, contábeis, assistenciais, defesa em processos e auditoria.',
      'Quando não houver necessidade de manutenção, os dados poderão ser eliminados, anonimizados ou bloqueados conforme critérios técnicos e legais aplicáveis.',
    ],
  },
  {
    title: '10. Termos de uso do site',
    paragraphs: [
      'O conteúdo deste site tem finalidade informativa, educativa e institucional. Ele não substitui consulta médica, diagnóstico individualizado, prescrição ou atendimento de urgência.',
      'Ao utilizar o site, o usuário se compromete a fornecer informações verdadeiras, não tentar acessar áreas restritas sem autorização e não usar o ambiente digital para fins ilícitos ou prejudiciais.',
    ],
  },
  {
    title: '11. Alterações desta política',
    paragraphs: [
      'Esta página pode ser atualizada para refletir mudanças legais, técnicas, operacionais ou de ferramentas utilizadas pela Nogueira Cardiologia.',
      'A data da última atualização será mantida no topo desta página para facilitar a consulta pelo usuário.',
    ],
  },
  {
    title: '12. Contato',
    paragraphs: [
      'Para dúvidas sobre privacidade, dados pessoais, LGPD ou solicitações relacionadas aos seus direitos, entre em contato pelos canais oficiais da Nogueira Cardiologia.',
      'Telefone: (17) 2139-8338. WhatsApp: (17) 99744-0223. Endereço: Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895.',
    ],
  },
] as const;

export const metadata: Metadata = {
  title: 'Política de Privacidade, LGPD e Termos | Nogueira Cardiologia',
  description:
    'Política de privacidade, LGPD, cookies, dados pessoais, dados de saúde e termos de uso da Nogueira Cardiologia.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Privacidade e LGPD</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
            Política de Privacidade, LGPD e Termos de Uso.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Esta página explica, em linguagem clara, como os dados podem ser coletados, usados, protegidos e compartilhados nos canais digitais da Nogueira Cardiologia.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#14508B]">Última atualização: {lastUpdated}</p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Tenho uma dúvida', '#contato-privacidade', 'Veja os canais oficiais para falar com a clínica.'],
            ['Quero marcar consulta', '/portal', 'Acesse o portal do paciente e continue sua jornada.'],
            ['Quero ler conteúdos', '/blog', 'Volte para o educativo e continue aprendendo sobre cardiologia.'],
          ].map(([title, href, text]) => (
            <Link key={title} href={href} className="rounded-lg border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-44px_rgba(20,80,139,0.6)] hover:border-[#14508B]/35">
              <h2 className="text-lg font-semibold text-[#0F3760]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </section>

        <div className="mt-8 grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              id={section.title === '12. Contato' ? 'contato-privacidade' : undefined}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-44px_rgba(20,80,139,0.6)] sm:p-6"
            >
              <h2 className="text-xl font-semibold text-[#0F3760]">{section.title}</h2>
              <div className="mt-3 grid gap-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-slate-600 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-lg bg-[#14508B] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-semibold">Continue sua navegação</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/88 sm:text-base">
            Acesse a página inicial, leia conteúdos educativos ou siga para o portal do paciente para solicitar sua consulta.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/" className="inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] hover:bg-[#EAF6FF]">
              Voltar para a home
            </Link>
            <Link href="/blog" className="inline-flex w-fit rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Ler educativo
            </Link>
            <Link href="/portal" className="cta-pulse inline-flex w-fit rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Marcar consulta
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
