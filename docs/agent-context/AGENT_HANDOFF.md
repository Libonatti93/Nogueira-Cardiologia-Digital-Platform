# Leia primeiro

Nogueira Cardiologia: site público, blog, portal de pacientes e painel administrativo.
Raiz de produção: `/root/Nogueira-Cardiologia-Digital-Platform`.
Branch de produção: `agent/portal-seo-home-ux`. Remote:
`git@github.com:Libonatti93/Nogueira-Cardiologia-Digital-Platform.git`.

1. Inspecione status/diff, fetch e SHAs antes de editar. Não use reset hard ou force push.
2. Web: `apps/web`, Next.js 16.3.5/React 19/TypeScript. Leia seu AGENTS.md e os guias locais do Next.
3. Produção: `nogueira-web.service`, porta 3002, Traefik/EasyPanel e PostgreSQL 16 existentes.
4. Governança: `/acesso/governanca`. RBAC no PostgreSQL, permissões conferidas no backend e sessões revogáveis. Dr. Paulo e Matheus reutilizam suas identidades com MASTER.
5. LIOS: `/acesso/lios`, código versionado em `services/lios`, container privado na porta **local** 8081 e schema `lios` no banco existente. Não expor essa porta publicamente.
6. IA inicia em demonstração enquanto não houver credencial própria. Fontes sintéticas nunca chegam ao blog. Toda publicação passa por rascunho/revisão humana.
7. Migrations aditivas 007/008 têm registro/checksum em `schema_migrations`. Nunca editar uma migration já aplicada.
8. Segredos ficam em arquivos ignorados; não imprimir `.env`, cookies ou credenciais. Há backup do trabalho recuperado em `/root/nogueira-resume-20260919.tar.gz`.
9. Reauditoria de 20/09/2026 começou em `b16b640947348a4b3809650b929a15925473e4e8`. O build então servido estava antigo, apesar do checkout sincronizado. Sempre conferir também os healthchecks e BUILD_ID.
10. `node scripts/deploy.mjs` faz backup, build por SHA, teste LIOS, migrations, atualização systemd/Compose e smoke autenticado. A evidência pós-deploy fica em `/var/log/nogueira-deploy-<SHA>.json`, sem credenciais. Smoke cria apenas eventos de acesso/auditoria e sessões em memória de três minutos.

Leia PROJECT_OVERVIEW, DATABASE_MAP, GOVERNANCE_ACCESS, LIOS_INTEGRATION e DEPLOY_RUNBOOK neste diretório.
`/api/health` e `/healthz` privado da LIOS informam o SHA do **artefato**, não o HEAD lido no momento da requisição.
O deploy mantém builds anteriores; o runbook explica a reversão.
Leia também VALIDATION e ENVIRONMENT. IA real continua dependendo de credencial externa;
o modo demo opera, mas nunca publica conteúdo sintético.

**Bloqueio externo identificado em 20/09:** o domínio Supabase configurado
`nwqkwuxewbtyaisjiucy.supabase.co` retorna NXDOMAIN. Matheus possui MASTER, mas seu
login depende desse provedor. Não criar conta duplicada, senha alternativa ou
contornar a checagem de identidade. É necessário restaurar o projeto no painel
Supabase ou obter URL/chave válidas do mesmo provedor com identidade preservada;
não há credencial de gestão Supabase nesta VPS. O login local de Dr. Paulo é independente.
