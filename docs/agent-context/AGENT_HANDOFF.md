# Leia primeiro

Nogueira Cardiologia reúne site público, blog, portal de pacientes e painel da equipe.
Produção: `/root/Nogueira-Cardiologia-Digital-Platform`, branch `agent/portal-seo-home-ux`.
Remote: `git@github.com:Libonatti93/Nogueira-Cardiologia-Digital-Platform.git`.

1. Faça fetch, confira status/diff e compare checkout, upstream e SHA servido antes de editar. Não use reset hard ou force push.
2. Leia `apps/web/AGENTS.md` e a documentação Next instalada. Web: Next.js 16.3.5, React 19, TypeScript, Tailwind 4, pg; não há Prisma.
3. Painel canônico: **https://painel.nogueiracardiologia.com.br**. DNS depende do proprietário. Rota Traefik preparada na mesma aplicação; veja PANEL_IAM_CRM e DEPLOY_RUNBOOK.
4. Login interno usa exclusivamente `app_users.password_hash`, sem Supabase. Cookie assinado distingue sessões internas de pacientes; RBAC e session_version são conferidos no backend.
5. Dr. Paulo, Matheus e Dra. Cris têm MASTER nas mesmas identidades. Cris mantém DOCTOR. Nenhuma senha real foi criada/alterada nesta entrega. Matheus não possuía hash local: outro MASTER deve habilitá-lo no IAM com senha temporária; o titular troca no primeiro acesso.
6. `/dashboard` mantém o dashboard completo existente. `/crm` usa projeções operacionais e APIs próprias sobre as mesmas tabelas, sem financeiro, documentos clínicos, IAM ou LIOS para CRM_OPERATOR.
7. `/governanca` administra usuários/perfis/permissões, credenciais e sessões. `/auditoria` lista eventos. `/lios` preserva o serviço privado em `services/lios`, porta local 8081, schema `lios` no PostgreSQL existente.
8. Novas migrations são aditivas. 007/008 estão preservadas; 009 acrescenta IAM/CRM e promove Cris. Nunca edite migration aplicada.
9. Produção: systemd `nogueira-web` na porta 3002; Docker `nogueira-postgres`, `nogueira-lios`, EasyPanel/Traefik. Deploy oficial, a partir de `apps/web`: `node scripts/deploy.mjs`.
10. Deploy exige commit enviado/árvore limpa, faz backup, build por SHA, migrations, reinício controlado, smoke real e comparação do artefato. Evidência sanitizada: `/var/log/nogueira-deploy-<SHA>.json`.
11. SHA inicial desta implementação: `7314d9937fcfe2d181153990912854a68acfc731`, igual ao upstream, sem alterações locais ou divergência. Confira o SHA atual pelo Git e `/api/health`; não confunda checkout com build servido.
12. Não imprimir arquivos .env, cookies, hashes ou credenciais. Não criar usuários/bancos/autenticações paralelos. Testes usam o banco isolado já existente `nogueira_integration_test`.

Leia PROJECT_OVERVIEW, DATABASE_MAP, GOVERNANCE_ACCESS, PANEL_IAM_CRM, LIOS_INTEGRATION,
DEPLOY_RUNBOOK, ENVIRONMENT e VALIDATION antes de continuar.

Dependências externas anteriores: Supabase dos pacientes retorna NXDOMAIN; sua restauração exige acesso externo ao provedor. Isso não afeta mais o login interno. LIOS opera em demo sem chave de IA real; publicação sintética continua bloqueada. DNS do painel é ação do proprietário, com TLS automático após propagação.
