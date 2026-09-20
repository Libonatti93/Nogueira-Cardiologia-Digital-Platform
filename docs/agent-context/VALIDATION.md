# Validação da integração — reexecutada em 20/09/2026

## Evidência pré-deploy

- `npm run lint`: passou.
- `npm run typecheck`: passou; TypeScript também passou no build.
- `npm test`: 6 testes passaram (sessões, RBAC, origens, auditoria, proxy e publicação).
- Build otimizado Next.js 16.3.5: passou; 134 páginas processadas.
- `ruff check --no-cache src tests`: passou.
- `pytest -q -p no:cacheprovider`: 7 testes passaram (RAG isolado/deduplicação, cache, auditoria, bloqueio demo, revisão humana).
- Governança integrada em PostgreSQL temporário: passou (negação de privilégio, proteção MASTER, desativação, revogação de sessões de usuário/perfil, auditoria sem senha, validação transacional).
- Testes HTTP: 12 grupos passaram. Inicialização, páginas e APIs, login local, Supabase simulado/vínculo de identidade, confirmação de e-mail, MASTER, bloqueio paciente/médico, CSRF, indisponibilidade Supabase retornando 503 sem sessão, ações reais de agenda/conteúdo com auditoria transacional, fila/RAG/auditoria LIOS, publicação sintética bloqueada, um único rascunho, logout e histórico sem credenciais.
- Migrations 001–008: esquema histórico aplicado em banco vazio descartável, seguido de aplicação e reexecução idempotente de 007/008; checksums confirmados. O banco descartável foi removido ao fim.
- `npm audit --omit=dev --audit-level=moderate`: zero vulnerabilidades reportadas.
- `git diff --check`: passou.

## Evidência do banco real

Backup executado pelo script operacional antes das migrations.
007/008 aplicadas e registradas em `schema_migrations` em 19/09/2026.
Dr. Paulo e Matheus: perfis MASTER ativos nas identidades existentes; Dra. Cris preservada como DOCTOR.
`has_table_privilege` para nogueira_lios: app_users=false, patient_profiles=false, lios.applications=true.
Backup de `nogueira_app` e `n8n` validado em 20/09; arquivos de configuração protegidos
com 0600. A credencial administrativa foi rotacionada e o backup deixou de manter
senha inline. AUTH_SECRET independente foi provisionado sem alterar senhas pessoais.

## Correções da reauditoria

- Checkout inicial limpo e igual ao GitHub em `b16b640947348a4b3809650b929a15925473e4e8`; build ativo antigo, `/api/health` ainda retornava 404.
- A imagem LIOS `:local` existente continha testes antigos que esperavam publicação automática de conteúdo demo. Reconstruída a partir do código versionado, passou nos 7 testes e ruff.
- Deploy agora bloqueia concorrência, faz fetch antes/depois, backup, confere a label SHA da imagem, preserva builds ativos e restaura web/LIOS em falhas.
- Ações existentes de conteúdo e agenda agora têm auditoria na mesma transação.
- Smoke persistente foi incorporado ao deploy e usa as identidades reais com sessões efêmeras, sem senha pessoal ou token em arquivos/logs.

## Limites explícitos

Senhas pessoais não foram solicitadas ou alteradas. O fluxo Supabase foi exercitado com provedor simulado; as identidades e vínculos reais foram conferidos no banco. Não houve cobrança, e-mail real nem geração paga de IA.
**Bloqueio real:** `nwqkwuxewbtyaisjiucy.supabase.co` retorna NXDOMAIN em dois
resolvedores independentes. Matheus tem MASTER, mas login por senha remoto exige
restaurar o provedor. Não há credencial de gestão Supabase nesta VPS. O resultado
do smoke distingue esse bloqueio da autorização validada com sessões efêmeras.
Não há credencial de geração real configurada: LIOS funciona em demonstração, com publicação sintética bloqueada. Feeds RSS são opcionais e precisam de configuração explícita.
A auditoria editorial usa heurísticas da LIOS original e não substitui revisão clínica.

## Evidência final

O deploy só informa sucesso após comparar o SHA do web local, domínio público e
LIOS privada e passar no smoke autenticado. A evidência gerada após a publicação
fica em `/var/log/nogueira-deploy-<SHA>.json`, com SHA, data, checks e migrations,
sem credenciais. O estado final é verificável por `/api/health`, `/healthz`, BUILD_ID,
label da imagem e `git rev-parse`, conforme DEPLOY_RUNBOOK. Não gravar neste arquivo
o próprio SHA do commit que o contém.
