# Operação e deploy

Diretório de comandos web: `/root/Nogueira-Cardiologia-Digital-Platform/apps/web`.
Serviço existente: `nogueira-web.service`, npm start na porta 3002. Proxy e TLS permanecem no Traefik/EasyPanel.

## Pré-deploy

1. `git status -sb`, `git diff`, `git fetch --all --prune`, comparar HEAD e origin/agent/portal-seo-home-ux.
2. Preservar alterações; nunca reset hard/force push. Instalar versões do lock com `npm ci` quando necessário.
3. `npm run lint`, `npm run typecheck`, `npm test`, build e testes de integração abaixo.
4. Backup: `/opt/nogueira-postgres/backup.sh`. Não imprimir arquivos de segredos.
5. Migrations: `node scripts/migrate.mjs`. 007/008/009 são aditivas e aplicadas por transação/checksum; bancos existentes precisam das migrations históricas.
6. Primeira configuração LIOS: `node scripts/configure-lios.mjs`. Usa manutenção local do PostgreSQL para criar conta restrita, arquivos .env ignorados e contexto editorial geral. Reexecução preserva credenciais existentes.
7. Revisar diff, segredos e documentos; commit com autoria Git já configurada; `git push origin agent/portal-seo-home-ux`.

## Publicação

`node scripts/deploy.mjs` faz fetch e requer árvore limpa e HEAD igual ao upstream.
Adquire `.deploy.lock` para impedir publicações simultâneas. Se uma execução for
interrompida por SIGKILL, confirme que o PID do arquivo não está executando antes
de remover esse lock ignorado pelo Git.
Constrói o web em `.next-releases/<SHA>` enquanto a versão anterior atende;
valida BUILD_ID e reutiliza artefato concluído sem reescrever o build ativo.
Constrói a imagem LIOS por SHA, confere a label OCI de revisão, executa pytest/ruff,
faz backup e aplica migrations pendentes antes de atualizar o container.
Configura o drop-in `release.conf` no serviço existente para ler `apps/web/.runtime.env`. Reinicia `nogueira-web` somente após o build e a LIOS estarem prontos.
O runner preserva o tsconfig original quando o Next adiciona caminhos temporários de tipos ao build.
Valida web local e domínio público comparando o SHA do artefato. Em falha,
restaura a configuração web e a imagem LIOS que estavam ativas antes da tentativa.
Executa `node scripts/smoke-production.mjs`: rotas públicas, banco, MASTER nas
três contas existentes, páginas Governança/LIOS, APIs, recusa para usuário comum,
CSRF, auditoria e isolamento do usuário PostgreSQL LIOS. As sessões de teste duram
três minutos, ficam em memória e não mudam senhas, último login ou perfis.
O teste produz eventos `access.denied` e `access.origin_denied` esperados.
Evidência sanitizada: `/var/log/nogueira-deploy-<SHA>.json` (0600).
Novo fetch ao final deve confirmar checkout/upstream inalterados e árvore limpa.

## Testes isolados

Banco dedicado `nogueira_integration_test` com esquema histórico e migrations novas, nunca dados de pacientes. `.env.test` define DATABASE_URL para esse banco, AUTH_SECRET fictício, LIOS em 8082 e Supabase simulado em 8090.

```sh
node --env-file=.env.test scripts/migrate.mjs
node --env-file=.env.test --import tsx tests/governance.integration.ts
NEXT_DIST_DIR=.next-verification RELEASE_SHA=verification npm run build
node --env-file=.env.test --import tsx tests/http.integration.ts
```

O teste HTTP inicia Next em 127.0.0.1:3003 e servidor Supabase simulado; exige LIOS de teste em 8082 com o mesmo banco e token. Scripts recusam outro nome de banco. A validação não executa logins com as senhas reais de Dr. Paulo/Matheus nem chama geração de IA paga.
Python: em `services/lios`, `docker compose build`, depois `docker run --rm nogueira-lios:local pytest -q -p no:cacheprovider` e `docker run --rm nogueira-lios:local ruff check --no-cache src tests`.
Reconstruir antes de testar: a imagem `:local` encontrada em 20/09 estava antiga,
embora o checkout já tivesse os testes corrigidos. Uma falha dessa imagem não deve
ser atribuída ao código atual sem verificar a procedência do artefato.

## Conferência final

```sh
git fetch --all --prune
git status -sb
git rev-parse HEAD origin/agent/portal-seo-home-ux
curl -fsS https://www.nogueiracardiologia.com.br/api/health
curl -fsS http://127.0.0.1:8081/healthz
systemctl is-active nogueira-web
docker ps --format '{{.Names}} {{.Status}}'
```

Conferir página pública/blog, redirecionamento de páginas administrativas sem sessão, 401 nas APIs sem cookie, permissões MASTER carregadas do banco e saúde do PostgreSQL.
O SHA de `/api/health` é embutido no build; `BUILD_ID` e imagem LIOS devem coincidir. Não basta comparar apenas o checkout Git.

## Rollback

Builds anteriores não são apagados. Restaurar `.runtime.env.previous` e reiniciar o serviço retorna o web anterior. A versão inicial pré-integração está em `.next`; mudança de dependências pode exigir `npm ci` da revisão anterior em checkout separado antes de usá-la.
Para LIOS, selecionar a imagem anterior usando GIT_SHA e executar docker compose up; não apagar dados.
O cron global Docker pode remover imagens antigas não usadas após 24 horas.
Se a imagem não existir, reconstruir o SHA anterior em worktree separado usando
o Dockerfile daquele commit. Não apontar uma tag antiga para código novo.
As migrations são aditivas: manter schema/colunas durante rollback de código. Não reverter dados nem restaurar backup sobre produção sem análise específica.
Banco temporário e containers de teste podem ser removidos após a validação; nunca confundir seus nomes com `nogueira_app`/`nogueira-postgres`.

## Segredos e manutenção

Arquivos `.env.local`, `.env.test`, `services/lios/.env` e runtime usam 0600.
`configure-lios.mjs` preserva segredos existentes e cria AUTH_SECRET independente
quando ausente; não executar com variáveis de teste em produção.
Em 20/09 a credencial administrativa PostgreSQL foi rotacionada; o backup usa
o arquivo root-only `/opt/nogueira-postgres/secrets/postgres_admin_password`,
sem senha embutida no script. Backups de `nogueira_app` e `n8n` foram conferidos.
O script sanitizado está versionado em `apps/web/deploy/postgres-n8n/backup.sh`;
para reinstalá-lo, usar `install -m 700 deploy/postgres-n8n/backup.sh /opt/nogueira-postgres/backup.sh`
a partir de `apps/web`. O arquivo do segredo já existente não faz parte do Git.
Não imprimir scripts operacionais ou credenciais sem sanitização prévia.

## Dependência externa indisponível

O smoke de implantação registra `passed_with_external_blocker` quando a API
Supabase configurada está indisponível; não trata sessões assinadas de diagnóstico
como prova de login por senha nesse provedor. Em 20/09 o DNS do projeto retorna
NXDOMAIN e não há permissão de gestão Supabase na VPS. A API Nogueira retorna 503
para essa falha, sem enfraquecer autenticação. Após restauração externa, executar
o smoke novamente e validar login Supabase com o titular da conta. Ver ENVIRONMENT.

## Painel, DNS e smoke atualizado

Deploy também executa ensure-traefik-nogueira-route.js para preparar o Host painel no Traefik existente. Smoke verifica as três identidades MASTER, todas as permissões, perfil CRM_OPERATOR restrito, páginas/APIs canônicas e aliases, separação de audience paciente e auditoria sem secrets.
Com DNS pendente, smoke usa HTTPS/SNI/Host painel através de **127.0.0.1:443**, aceitando somente nesse diagnóstico o certificado padrão. Confere login na raiz, redirect pós-sessão, IAM, portal público e SHA de /api/health. Não altera DNS nem gera senha real. Se não houver usuário comum ativo na base real, testa audience paciente e identidade inativa existentes; os testes de CRM/DOCTOR permanecem completos no banco isolado.

```sh
curl -ksS --resolve painel.nogueiracardiologia.com.br:443:127.0.0.1 https://painel.nogueiracardiologia.com.br/api/health
curl -ksS -o /dev/null -w '%{http_code}\n' --resolve painel.nogueiracardiologia.com.br:443:127.0.0.1 https://painel.nogueiracardiologia.com.br/
```

O proprietário cria A painel → 2.24.215.163. O cron de um minuto verifica DNS e habilita letsencrypt após propagação. Depois, conferir HTTPS **sem -k**, /api/health e certificado válido. Não tentar ACME repetidamente antes do apontamento. HSTS existente exige certificado válido para uso normal no browser.

A migration 009 invalida sessões internas prévias, mas mantém senhas e vínculos. Matheus deve receber senha temporária pelo IAM de outro MASTER antes do primeiro login local; o deploy não inventa essa credencial.
Rollback de código mantém as colunas e concessões aditivas. Para suspender apenas o novo Host, ajuste de forma versionada o guard antes de remover os dois routers; caso contrário, o cron os recria. Preserve os routers públicos, banco e aliases. Não reverta senhas/identidades por restore cego.

Teste de interface opcional: `PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs node --env-file=.env.test tests/browser.integration.mjs`. Requer Chromium instalado para esse Playwright. Usa somente identidades e senhas fictícias no banco isolado, inicia Next :3003 e gera screenshots sem dados reais em /tmp/nogueira-panel-browser. Pare o container de teste nogueira-lios-test após a validação; preserve o banco de testes existente para reexecução.
