# Operação e deploy

Diretório de comandos web: `/root/Nogueira-Cardiologia-Digital-Platform/apps/web`.
Serviço existente: `nogueira-web.service`, npm start na porta 3002. Proxy e TLS permanecem no Traefik/EasyPanel.

## Pré-deploy

1. `git status -sb`, `git diff`, `git fetch --all --prune`, comparar HEAD e origin/agent/portal-seo-home-ux.
2. Preservar alterações; nunca reset hard/force push. Instalar versões do lock com `npm ci` quando necessário.
3. `npm run lint`, `npm run typecheck`, `npm test`, build e testes de integração abaixo.
4. Backup: `/opt/nogueira-postgres/backup.sh`. Não imprimir arquivos de segredos.
5. Migrations: `node scripts/migrate.mjs`. 007/008 são aditivas e aplicadas por transação/checksum; bancos existentes precisam das migrations históricas.
6. Primeira configuração LIOS: `node scripts/configure-lios.mjs`. Usa manutenção local do PostgreSQL para criar conta restrita, arquivos .env ignorados e contexto editorial geral. Reexecução preserva credenciais existentes.
7. Revisar diff, segredos e documentos; commit com autoria Git já configurada; `git push origin agent/portal-seo-home-ux`.

## Publicação

`node scripts/deploy.mjs` requer árvore limpa e HEAD igual ao upstream.
Constrói o web em `.next-releases/<SHA>` enquanto a versão anterior atende; valida BUILD_ID; aplica migrations pendentes; constrói/testa a imagem LIOS com tag SHA; atualiza o container e verifica saúde.
Configura o drop-in `release.conf` no serviço existente para ler `apps/web/.runtime.env`. Reinicia `nogueira-web` somente após o build e a LIOS estarem prontos.
O runner preserva o tsconfig original quando o Next adiciona caminhos temporários de tipos ao build.
Valida web local e domínio público comparando o SHA do artefato. Em falha do web, restaura `.runtime.env.previous` e reinicia o serviço.

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
As migrations são aditivas: manter schema/colunas durante rollback de código. Não reverter dados nem restaurar backup sobre produção sem análise específica.
Banco temporário e containers de teste podem ser removidos após a validação; nunca confundir seus nomes com `nogueira_app`/`nogueira-postgres`.
