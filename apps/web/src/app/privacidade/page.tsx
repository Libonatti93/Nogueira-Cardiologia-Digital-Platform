import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/site/public-footer';
import { PublicHeader } from '@/components/site/public-header';

const lastUpdated = '25 de julho de 2026';

const sections = [
  {
    title: '1. Quem somos',
    paragraphs: [
      'Esta Política de Privacidade, LGPD e Termos de Uso se aplica ao site, portal do paciente, área interna e canais digitais da Nogueira Cardiologia LTDA, CNPJ 12.388.371/0001-71.',
      'A Nogueira Cardiologia é a controladora dos dados usados para prestar seus serviços. Prestadores de hospedagem, banco de dados, comunicação e pagamento atuam como operadores ou suboperadores conforme instruções e contratos aplicáveis.',
    ],
  },
  {
    title: '2. Quais dados podemos coletar',
    paragraphs: [
      'Podemos coletar dados fornecidos diretamente pelo usuário, como nome completo, e-mail, telefone/WhatsApp, CPF, data de nascimento, altura, peso, preferência de médico, informações de saúde declaradas pelo próprio paciente e consentimento LGPD.',
      'Também coletamos dados técnicos proporcionais à segurança do serviço, como endereço IP, data e hora, navegador, sistema ou plataforma do dispositivo, idioma e registros de auditoria. A geolocalização precisa somente é coletada após uma ação específica e opcional do usuário no navegador.',
    ],
  },
  {
    title: '3. Dados sensíveis de saúde',
    paragraphs: [
      'Informações relacionadas a saúde, como hipertensão, diabetes, colesterol alto, tabagismo, altura, peso e histórico informado pelo paciente, podem ser consideradas dados pessoais sensíveis pela LGPD.',
      'Laudos, imagens, histórico clínico e demais informações de saúde são dados pessoais sensíveis. O acesso é restrito a pessoas autorizadas e o tratamento ocorre para tutela da saúde, assistência, organização do atendimento, cumprimento de obrigações e exercício regular de direitos, conforme o caso.',
    ],
  },
  {
    title: '4. Para que usamos os dados',
    paragraphs: [
      'Utilizamos dados para autenticar o paciente, organizar agenda e consultas, receber exames, prestar assistência, processar pagamentos, responder contatos, prevenir fraude, manter a segurança e cumprir deveres legais, regulatórios e éticos da atividade médica.',
      'Dados de auditoria de uploads, como IP e dispositivo, servem para integridade, segurança e comprovação do envio. Geolocalização precisa, quando autorizada, é usada apenas como registro adicional daquele envio e não é requisito para atendimento.',
    ],
  },
  {
    title: '5. Cookies, analytics e ferramentas de terceiros',
    id: 'cookies',
    paragraphs: [
      'O site pode utilizar cookies, tecnologias semelhantes e ferramentas de mensuração para funcionamento, segurança, análise de desempenho, melhoria de navegação e eventual mensuração de campanhas.',
      'Cookies não essenciais e ferramentas de mensuração dependem das escolhas apresentadas no aviso de cookies. Cookies estritamente necessários podem funcionar para autenticação, segurança e manutenção da sessão.',
    ],
  },
  {
    title: '6. Base legal e LGPD',
    paragraphs: [
      'Conforme a operação, as bases legais incluem consentimento, execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal ou regulatória, tutela da saúde, exercício regular de direitos e legítimo interesse, com avaliação de necessidade e proporcionalidade.',
      'A autorização para geolocalização e o consentimento específico para transferência internacional, quando utilizados como base, são apresentados separadamente e podem ser revogados, sem afetar tratamentos anteriores legítimos ou dados cuja retenção seja obrigatória.',
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
    title: '8. Transferência internacional e armazenamento nos Estados Unidos',
    id: 'transferencia-internacional',
    paragraphs: [
      'A infraestrutura principal desta plataforma está atualmente localizada em Boston, Massachusetts, Estados Unidos. Por isso, cadastros, registros técnicos e arquivos de exames enviados ao portal podem ser armazenados e tratados fora do Brasil, caracterizando transferência internacional de dados.',
      'A transferência deve observar a LGPD e a Resolução CD/ANPD nº 19/2024, com transparência, controles de acesso, dever de confidencialidade e mecanismo jurídico válido, como cláusulas-padrão contratuais da ANPD ou outra hipótese prevista no art. 33 da LGPD. No formulário de exames, a operação internacional é informada em destaque.',
      'A localização da infraestrutura não retira do titular os direitos assegurados pela legislação brasileira nem afasta a responsabilidade da Nogueira Cardiologia como controladora.',
    ],
  },
  {
    title: '9. Segurança da informação e exames',
    paragraphs: [
      'Adotamos medidas técnicas e administrativas para proteger dados pessoais contra acessos não autorizados, perda, alteração, divulgação indevida ou uso inadequado.',
      'Entre as medidas estão HTTPS, autenticação, controle de acesso por perfil, arquivos fora da área pública, respostas sem cache, senhas protegidas por hash, registros de auditoria e verificação de integridade do arquivo. Nenhum sistema, porém, elimina integralmente os riscos.',
      'O paciente deve enviar apenas documentos próprios ou para os quais tenha autorização e deve proteger sua senha. Suspeitas de acesso indevido devem ser comunicadas imediatamente pelos canais oficiais.',
    ],
  },
  {
    title: '10. Retenção, prontuário e exclusão',
    paragraphs: [
      'Os dados podem ser mantidos pelo tempo necessário para cumprir as finalidades informadas, obrigações legais, regulatórias, fiscais, contábeis, assistenciais, defesa em processos e auditoria.',
      'Documentos que integrem o prontuário ou sejam necessários à assistência podem observar prazos específicos da legislação e das normas médicas. Um pedido de exclusão não resulta em eliminação quando houver dever de guarda, exercício regular de direitos ou outra hipótese legal de conservação.',
      'Encerradas as finalidades e os prazos obrigatórios, os dados serão eliminados, anonimizados ou bloqueados de forma segura, conforme aplicável.',
    ],
  },
  {
    title: '11. Direitos do titular',
    paragraphs: [
      'O titular pode solicitar confirmação e acesso, correção, informação sobre compartilhamentos, anonimização, bloqueio ou eliminação quando cabível, portabilidade conforme regulamentação, revisão de consentimentos e oposição a tratamento irregular.',
      'Para proteger o sigilo médico e evitar fraude, poderemos pedir confirmação de identidade antes de responder. O titular também pode peticionar à ANPD depois de buscar atendimento pelo canal da controladora.',
    ],
  },
  {
    title: '12. Incidentes de segurança',
    paragraphs: [
      'Eventos de segurança são avaliados e tratados conforme o plano interno e a regulamentação da ANPD. Quando um incidente puder causar risco ou dano relevante, as comunicações legalmente exigidas serão realizadas à ANPD e aos titulares afetados.',
    ],
  },
  {
    title: '13. Termos de uso do site',
    paragraphs: [
      'O conteúdo deste site tem finalidade informativa, educativa e institucional. Ele não substitui consulta médica, diagnóstico individualizado, prescrição ou atendimento de urgência.',
      'Ao utilizar o site, o usuário se compromete a fornecer informações verdadeiras, não tentar acessar áreas restritas sem autorização e não usar o ambiente digital para fins ilícitos ou prejudiciais.',
    ],
  },
  {
    title: '14. Alterações desta política',
    paragraphs: [
      'Esta página pode ser atualizada para refletir mudanças legais, técnicas, operacionais ou de ferramentas utilizadas pela Nogueira Cardiologia.',
      'A data da última atualização será mantida no topo desta página para facilitar a consulta pelo usuário.',
    ],
  },
  {
    title: '15. Canal de privacidade e contato',
    paragraphs: [
      'Para exercer direitos ou tratar de privacidade, contate a Nogueira Cardiologia pelo e-mail contato@nogueiracardiologia.com.br, telefone (17) 2139-8338 ou WhatsApp (17) 99744-0223. Identifique no assunto: “Privacidade/LGPD”.',
      'Endereço: Av. José Munia, 7301 - Jardim Redentor, São José do Rio Preto - SP, 15085-895. O canal recebe solicitações dos titulares e comunicações relacionadas à proteção de dados.',
    ],
  },
] as const;

export const metadata: Metadata = {
  title: 'Política de Privacidade, LGPD e Termos | Nogueira Cardiologia',
  description:
    'Política de privacidade, LGPD, cookies, dados pessoais, dados de saúde e termos de uso da Nogueira Cardiologia.',
  alternates: { canonical: '/privacidade' },
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
              id={'id' in section ? section.id : section.title === '15. Canal de privacidade e contato' ? 'contato-privacidade' : undefined}
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
