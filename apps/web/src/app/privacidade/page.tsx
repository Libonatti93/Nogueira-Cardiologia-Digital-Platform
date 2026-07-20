import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const lastUpdated = '20 de julho de 2026';

const sections = [
  {
    title: '1. Quem somos',
    paragraphs: [
      'Esta Politica de Privacidade, LGPD e Termos de Uso se aplica ao site, portal do paciente, area interna e canais digitais da Nogueira Cardiologia LTDA, CNPJ 12.388.371/0001-71.',
      'A Nogueira Cardiologia atua na prestacao de servicos medicos em cardiologia e utiliza este ambiente digital para apresentar informacoes institucionais, receber contatos, organizar solicitacoes de consulta e disponibilizar conteudos educativos.',
    ],
  },
  {
    title: '2. Quais dados podemos coletar',
    paragraphs: [
      'Podemos coletar dados fornecidos diretamente pelo usuario, como nome completo, e-mail, telefone/WhatsApp, CPF, data de nascimento, altura, peso, preferencia de medico, informacoes de saude declaradas pelo proprio paciente e consentimento LGPD.',
      'Tambem podemos coletar dados tecnicos necessarios ao funcionamento e seguranca do site, como endereco IP, data e hora de acesso, navegador, dispositivo, paginas acessadas e registros de auditoria.',
    ],
  },
  {
    title: '3. Dados sensiveis de saude',
    paragraphs: [
      'Informacoes relacionadas a saude, como hipertensao, diabetes, colesterol alto, tabagismo, altura, peso e historico informado pelo paciente, podem ser consideradas dados pessoais sensiveis pela LGPD.',
      'Esses dados sao tratados com finalidade assistencial, administrativa, preventiva, de organizacao do atendimento e de cumprimento de obrigacoes legais ou regulatorias aplicaveis aos servicos de saude.',
    ],
  },
  {
    title: '4. Para que usamos os dados',
    paragraphs: [
      'Utilizamos dados pessoais para criar cadastro, permitir acesso ao portal, responder solicitacoes, organizar agenda, encaminhar contato da secretaria, registrar interesse em conteudos educativos, processar pagamentos, manter seguranca do sistema e melhorar a experiencia do usuario.',
      'Tambem podemos utilizar informacoes agregadas ou estatisticas para entender o desempenho do site, melhorar conteudos e apoiar a gestao da clinica, sem expor indevidamente dados pessoais.',
    ],
  },
  {
    title: '5. Cookies, analytics e ferramentas de terceiros',
    paragraphs: [
      'O site pode utilizar cookies, tecnologias semelhantes e ferramentas de mensuracao para funcionamento, seguranca, analise de desempenho, melhoria de navegacao e eventual mensuracao de campanhas.',
      'Caso sejam ativados recursos como Google Analytics, Google Ads ou tecnologias semelhantes, a Nogueira Cardiologia devera informar o uso dessas ferramentas e disponibilizar opcoes de controle quando aplicavel.',
    ],
  },
  {
    title: '6. Base legal e LGPD',
    paragraphs: [
      'O tratamento de dados pode ocorrer com base no consentimento do titular, execucao de contrato ou procedimentos preliminares, cumprimento de obrigacao legal ou regulatoria, tutela da saude, legitimo interesse e exercicio regular de direitos.',
      'O titular pode solicitar informacoes sobre seus dados, correcao, atualizacao, exclusao quando aplicavel, portabilidade, revisao de consentimentos e demais direitos previstos na Lei Geral de Protecao de Dados.',
    ],
  },
  {
    title: '7. Compartilhamento de dados',
    paragraphs: [
      'Dados podem ser compartilhados com profissionais autorizados da clinica, prestadores de tecnologia, hospedagem, banco de dados, automacao, meios de pagamento, ferramentas de comunicacao, contabilidade, assessoria juridica ou autoridades competentes quando necessario.',
      'O compartilhamento deve ocorrer apenas na medida necessaria para funcionamento do servico, atendimento ao paciente, seguranca, cumprimento legal ou operacao administrativa.',
    ],
  },
  {
    title: '8. Seguranca da informacao',
    paragraphs: [
      'Adotamos medidas tecnicas e administrativas para proteger dados pessoais contra acessos nao autorizados, perda, alteracao, divulgacao indevida ou uso inadequado.',
      'Entre as medidas estao uso de HTTPS, controle de acesso, banco de dados protegido, senhas criptografadas, registros de auditoria e separacao entre area publica, portal do paciente e area interna.',
    ],
  },
  {
    title: '9. Retencao e exclusao',
    paragraphs: [
      'Os dados podem ser mantidos pelo tempo necessario para cumprir as finalidades informadas, obrigações legais, regulatórias, fiscais, contabeis, assistenciais, defesa em processos e auditoria.',
      'Quando nao houver necessidade de manutencao, os dados poderao ser eliminados, anonimizados ou bloqueados conforme criterios tecnicos e legais aplicaveis.',
    ],
  },
  {
    title: '10. Termos de uso do site',
    paragraphs: [
      'O conteudo deste site tem finalidade informativa, educativa e institucional. Ele nao substitui consulta medica, diagnostico individualizado, prescricao ou atendimento de urgencia.',
      'Ao utilizar o site, o usuario se compromete a fornecer informacoes verdadeiras, nao tentar acessar areas restritas sem autorizacao e nao usar o ambiente digital para fins ilicitos ou prejudiciais.',
    ],
  },
  {
    title: '11. Alteracoes desta politica',
    paragraphs: [
      'Esta pagina pode ser atualizada para refletir mudancas legais, tecnicas, operacionais ou de ferramentas utilizadas pela Nogueira Cardiologia.',
      'A data da ultima atualizacao sera mantida no topo desta pagina para facilitar a consulta pelo usuario.',
    ],
  },
  {
    title: '12. Contato',
    paragraphs: [
      'Para duvidas sobre privacidade, dados pessoais, LGPD ou solicitacoes relacionadas aos seus direitos, entre em contato pelos canais oficiais da Nogueira Cardiologia.',
      'Telefone: (17) 2139-8338. WhatsApp: (17) 99744-0223. Endereco: Av. Jose Munia, 7301 - Jardim Redentor, Sao Jose do Rio Preto - SP, 15085-895.',
    ],
  },
] as const;

export const metadata: Metadata = {
  title: 'Politica de Privacidade, LGPD e Termos | Nogueira Cardiologia',
  description:
    'Politica de privacidade, LGPD, cookies, dados pessoais, dados de saude e termos de uso da Nogueira Cardiologia.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Privacidade e LGPD</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760] sm:text-5xl">
            Politica de Privacidade, LGPD e Termos de Uso.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Esta pagina explica, em linguagem clara, como os dados podem ser coletados, usados, protegidos e compartilhados nos canais digitais da Nogueira Cardiologia.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#14508B]">Ultima atualizacao: {lastUpdated}</p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Tenho uma duvida', '#contato-privacidade', 'Veja os canais oficiais para falar com a clinica.'],
            ['Quero marcar consulta', '/portal', 'Acesse o portal do paciente e continue sua jornada.'],
            ['Quero ler conteudos', '/blog', 'Volte para o educativo e continue aprendendo sobre cardiologia.'],
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
          <h2 className="text-2xl font-semibold">Continue sua navegacao</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/88 sm:text-base">
            Acesse a pagina inicial, leia conteudos educativos ou siga para o portal do paciente para solicitar sua consulta.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/" className="inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] hover:bg-[#EAF6FF]">
              Voltar para a home
            </Link>
            <Link href="/blog" className="inline-flex w-fit rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Ler educativo
            </Link>
            <Link href="/portal" className="inline-flex w-fit rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Marcar consulta
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
