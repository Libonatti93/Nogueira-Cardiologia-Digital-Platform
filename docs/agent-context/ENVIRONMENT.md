# Configuração sem valores secretos

Web: `apps/web/.env.local`. LIOS: `services/lios/.env`. Ambos são ignorados pelo
Git e protegidos com 0600. Nunca copiar seus valores para tickets, logs ou docs.

| Variável | Uso |
|---|---|
| DATABASE_URL | PostgreSQL da aplicação, obrigatório; runtime sem superuser |
| AUTH_SECRET | Assinatura independente das sessões; presente em produção |
| NEXT_PUBLIC_SITE_URL | Origem pública canônica; permanece no domínio público para preservar SEO/links |
| AUTH_ALLOWED_ORIGINS | Domínios oficiais adicionais autorizados para mutações |
| NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL | Provedor de autenticação existente |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_PUBLISHABLE_KEY | Chave pública do provedor; aliases ANON_KEY também aceitos |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY | Proteção do formulário de pacientes, quando configurada |
| ASAAS_API_KEY / ASAAS_ENVIRONMENT / ASAAS_WEBHOOK_TOKEN | Cobrança e autenticação do webhook existentes |
| ASAAS_APPOINTMENT_AMOUNT_CENTS | Valor operacional de consulta, quando configurado |
| EMAIL_FROM / RESEND_API_KEY | Envio de e-mail no fallback existente |
| DASHBOARD_MONTHLY_REVENUE_GOAL_CENTS | Meta exibida no dashboard |
| LIOS_INTERNAL_URL | Backend editorial privado, http://127.0.0.1:8081 |
| LIOS_OPERATOR_TOKEN | Credencial de serviço compartilhada apenas entre web e LIOS |
| LIOS_ENV | production |
| LIOS_DATABASE_URL | Conta nogueira_lios e schema editorial no PostgreSQL existente |
| LIOS_DOCKER_NETWORK | Rede Docker existente easypanel |
| LIOS_PUBLIC_URL | Site canônico para contexto editorial |
| LIOS_AI_PROVIDER | demo por padrão; openai exige configuração própria |
| LIOS_OPENAI_API_KEY | Ausente: bloqueio externo para geração real |
| LIOS_TEXT_MODEL / LIOS_IMAGE_MODEL | Modelos do provedor quando ativado |
| LIOS_RSS_FEEDS | URLs de feeds públicos aprovados, separados por vírgulas |
| NEXT_DIST_DIR / RELEASE_SHA / GIT_SHA | Identificação do artefato no build/deploy; não são segredos |

Não há configuração de IA paga ou feeds reais nesta entrega. O modo demonstração
exercita o pipeline e a revisão, mas seus artigos são impedidos de entrar no blog.
Dados clínicos e credenciais não devem ser inseridos nos RAGs.

## Bloqueio externo confirmado em 20/09/2026

`nwqkwuxewbtyaisjiucy.supabase.co`, configurado antes desta entrega, retorna
NXDOMAIN (DNS Status 3) em Google DNS e Cloudflare DNS; o Node retorna ENOTFOUND.
Consequentemente `/auth/v1/settings` e o login por senha remoto estão indisponíveis.
Supabase.com responde normalmente; não é indisponibilidade geral de internet da VPS.
Não há SUPABASE_ACCESS_TOKEN ou credencial de gestão encontrada no ambiente/arquivos
de configuração operacionais. Ação externa necessária: proprietário restaurar o
projeto Supabase ou disponibilizar configuração válida preservando os vínculos de
identidade. Não substituir subjects nem criar identidades duplicadas. O painel agora usa senha local na mesma conta, independentemente do provedor.

O backend retorna 503 (`auth_unavailable`) e registra `auth.login` com resultado
failure / código provider_unavailable. A recusa não emite cookie e não contorna a
validação. Todos os logins internos e autorização por sessões válidas independem
da disponibilidade do provedor. O smoke registra esse bloqueio separadamente dos
testes de permissões que consegue concluir.

`apps/web/.env.test` aponta exclusivamente para `nogueira_integration_test`, usa
segredos fictícios, LIOS em 8082 e Supabase simulado em 8090. Os testes HTTP recusam
nomes de banco diferentes. A presença de variáveis de um serviço externo não
comprova sua operação: cobranças, envio de e-mail e geração paga não são smoke tests.

## Host interno e TLS

panelHost/panelOrigin estão em src/lib/panel-policy.ts; a origem HTTPS do painel é explicitamente autorizada em access-policy.ts. Não trocar NEXT_PUBLIC_SITE_URL pelo painel: ele continua sendo a origem pública.
Nenhum segredo novo é necessário. AUTH_ALLOWED_ORIGINS continua reservado aos hosts oficiais; não incluir curingas. Os testes de navegador usam origem loopback adicional somente no processo de teste.
DNS externo pendente: A `painel` → `2.24.215.163`. Roteadores Traefik http-nogueira-panel/https-nogueira-panel reutilizam nogueira-web. Certificado automático habilitado pelo cron apenas após resolver o IP real; marcador `/etc/easypanel/traefik/nogueira-panel-tls-ready` evita oscilações após ativação. Sem DNS externo alterado.
Matheus necessita habilitação manual de senha local pelo IAM. Isso não exige restaurar Supabase nem criar outra identidade; o agente não define senhas reais.
