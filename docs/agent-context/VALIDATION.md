# Validação do painel/IAM/CRM — 20/09/2026

## Estado inicial auditado

Branch operacional agent/portal-seo-home-ux. SHA inicial:
`7314d9937fcfe2d181153990912854a68acfc731`.
Fetch inicial: HEAD igual ao upstream, working tree limpo, sem commits ahead/behind.
007/008 já aplicadas e preservadas; Next/systemd :3002, LIOS :8081 e PostgreSQL existentes.

## Testes antes do deploy

- Lint e typecheck: PASS.
- Build otimizado Next.js 16.3.5: PASS, 136 páginas e proxy por Host.
- Unidade: 9 testes PASS — tokens, audience assinada, roteamento/permissões, senha, Origin/CSRF, auditoria, proxy LIOS e bloqueio de publicação sintética.
- PostgreSQL/IAM: PASS — criação interna, recusa de escalada, revogação por usuário/perfil, inativo sem sessão, MASTER protegido, último MASTER protegido também contra gestor delegado, auto-lockout, restrição CRM_OPERATOR, validação transacional e ausência de senha na auditoria.
- HTTP integrado: 15 grupos PASS. App/frontend/backend/banco, páginas e APIs, identidade existente ativada sem duplicação, senha temporária/troca obrigatória, criação de operador pelo MASTER, três MASTER, médico/paciente/CRM sem IAM, CSRF, Supabase paciente indisponível sem afetar login interno, CRUD operacional, projeções sem CPF/notas/financeiro, agenda privada excluída, sessões revogadas, Host painel, Server Actions de conteúdo/agenda preservadas, LIOS RAG/fila/auditoria, publicação demo bloqueada, rascunho idempotente, logout e logs sem credenciais.
- Chromium desktop 1440px/mobile 390px: PASS — login real de fixture, dashboard/IAM, matriz/perfis, menu recolhível, logout, operador direcionado ao CRM, navegação por query, criação de lead, rota proibida, ausência de erros JavaScript e de overflow horizontal da página.
- LIOS: 7 pytest PASS; ruff PASS, usando imagem SHA da mesma fonte LIOS preservada. Deploy repete sobre a imagem final.
- Migration 009: aplicação e reexecução por checksum PASS no banco isolado já existente. 007/008 sem alterações. Não foi criado banco novo.
- npm audit --omit=dev: zero vulnerabilidades reportadas.
- Revisão do diff e verificação de credenciais antes do commit; arquivos .env/runtime/testes e uploads privados permanecem ignorados.

Screenshots locais com dados fictícios: /tmp/nogueira-panel-browser. Resultados HTTP: /tmp/nogueira-http-test-results.json. Ferramenta Chromium e bibliotecas auxiliares foram instaladas apenas em cache/tmp para teste; não houve upgrade/reinício de serviços do sistema para isso.

## Validação de produção incorporada ao deploy

Backup obrigatório antes da migration. Smoke verifica migrations 007/008/009, três MASTER com todas as permissões, sessão audience paciente recusada mesmo para identidade privilegiada, páginas canônicas/aliases, APIs protegidas, Origin, eventos reais de auditoria e privilégios restritos da conta PostgreSQL LIOS.
Host painel é exercitado pelo Traefik real em loopback, com SNI/Host corretos: login na raiz, redirect pós-sessão, IAM e /api/health. Somente esse teste pré-DNS aceita certificado padrão. TLS público do site continua validado normalmente.
Se a base real não possuir operador comum ativo, não se fabricam usuários reais para teste: a restrição CRM é exercitada integralmente na base isolada, enquanto produção valida perfis/permissões, audience paciente e conta inativa existente.

O deploy só conclui quando HEAD, upstream, BUILD_ID web, /api/health local/público/painel e /healthz/label LIOS coincidem. Evidência pós-publicação: `/var/log/nogueira-deploy-<SHA>.json`. Working tree deve estar limpo após fetch final. O próprio SHA final não é gravado no documento contido por esse commit.

## Limites explícitos

Nenhuma senha pessoal foi conhecida, criada ou alterada pelo agente. UUIDs, senhas e vínculos Supabase são comparados antes/depois por fingerprint sem expor credenciais. Smoke real usa sessões de diagnóstico assinadas de três minutos em memória; isso valida autorização/sessão, não senha pessoal.
Matheus mantém MASTER, mas requer habilitação manual de credencial local por outro MASTER no novo IAM. O fluxo completo foi testado com senhas fictícias e a mesma estrutura de identidade, sem alterar a conta real.
DNS painel é ação futura do proprietário: A painel → 2.24.215.163. TLS automático preparado para habilitar após propagação; ausência do DNS não é falha de deploy.
Supabase dos pacientes estava indisponível por NXDOMAIN antes desta entrega; o portal e seu mecanismo foram preservados. Restauração depende da gestão externa do provedor e não interfere no painel local.
LIOS permanece em demonstração por falta da chave de IA real. Publicação sintética é bloqueada. Não foram executados pagamentos, e-mails reais nem geração paga.
