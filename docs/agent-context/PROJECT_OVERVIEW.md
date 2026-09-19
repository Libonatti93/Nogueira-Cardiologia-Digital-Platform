# Projeto e infraestrutura

## Arquitetura

Monorepositório com aplicação principal em `apps/web`; diretórios históricos `packages`, `docs` e `infra` não substituem o runtime existente.
Next.js App Router serve páginas React, Route Handlers e Server Actions. Tailwind 4 provê estilos. Não há Prisma: `src/lib/db.ts` usa `pg`, consultas parametrizadas e transações.

Módulos públicos: página inicial, médicos, exames, blog educativo, política de privacidade e agendamento.
Área de pacientes: cadastro, confirmação de e-mail, login, consultas e arquivos de exames.
Administração: `/acesso/dashboard` reutiliza `src/app/interno/dashboard/page.tsx`; relatórios, conteúdo e operação clínica. `/acesso/governanca` administra acessos; `/acesso/lios` opera conhecimento e produção editorial.

## Autenticação

Contas canônicas em `app_users`. Médicos existentes usam senha local com pgcrypto/bcrypt; pacientes e Matheus podem autenticar pelo Supabase. O login interno aceita Supabase somente quando seu subject já corresponde ao vínculo no banco. E-mail isolado não concede acesso administrativo.
Cookie HTTP-only, SameSite Lax, Secure em produção, assinatura HMAC e validade de oito horas. `session_version`, usuário ativo e permissões são consultados no banco a cada acesso. A assinatura utiliza AUTH_SECRET quando configurado, com fallback legado DATABASE_URL preservado para compatibilidade.
Turnstile do portal de pacientes e confirmação de e-mail permanecem. Login possui limitação persistida por IP/e-mail e validação de origem.

## Integrações

Supabase Auth; Asaas para cobrança e webhook; notícias/feed e Open-Meteo para o dashboard; IndexNow; PostgreSQL local; LIOS privada. Variáveis presentes não equivalem à validação ponta a ponta de serviços de terceiros.
Não foram efetuadas cobranças nem enviados e-mails reais durante os testes.

## Produção

Ubuntu/systemd. `nogueira-web.service` executa npm start na porta 3002.
Containers existentes: `nogueira-postgres` (PostgreSQL 16), EasyPanel e Traefik. A LIOS adiciona somente `nogueira-lios`, sem segundo banco ou login de usuários.
Traefik encaminha os domínios com e sem www à porta 3002. O script histórico `apps/web/scripts/ensure-traefik-nogueira-route.js` mantém essa rota.
O cron de backup PostgreSQL executa `/opt/nogueira-postgres/backup.sh` às 03:15 UTC. O backup do banco completo também cobre o schema `lios`.
Arquivos de exames e uploads existentes continuam nas localizações configuradas pelo código da aplicação.

## Histórico recuperado

SHA da auditoria original: `ad8eea4` (antes da integração).
Na retomada: `b3135bf`, merge de `origin/main` já concluído; quatro arquivos alterados e a governança ainda não versionada. Essas alterações foram preservadas e concluídas.
O upstream LIOS foi conferido com `git ls-remote`: `b32d1cc8086541fcb5eeeb6e734e9601676cf5a8`.
Dependências Next.js foram corrigidas de 16.2.4 para 16.3.5 após relatório do npm audit.
