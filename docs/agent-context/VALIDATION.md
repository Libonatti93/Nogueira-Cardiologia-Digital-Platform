# Validação da integração — 19/09/2026

## Evidência pré-deploy

- `npm run lint`: passou.
- `npm run typecheck`: passou; TypeScript também passou no build.
- `npm test`: 6 testes passaram (sessões, RBAC, origens, auditoria, proxy e publicação).
- Build otimizado Next.js 16.3.5: passou; 134 páginas processadas.
- `ruff check --no-cache src tests`: passou.
- `pytest -q -p no:cacheprovider`: 7 testes passaram (RAG isolado/deduplicação, cache, auditoria, bloqueio demo, revisão humana).
- Governança integrada em PostgreSQL temporário: passou (negação de privilégio, proteção MASTER, desativação, revogação de sessões de usuário/perfil, auditoria sem senha, validação transacional).
- Testes HTTP: 10 grupos passaram. Inicialização, páginas e APIs, login local, Supabase simulado/vínculo de identidade, confirmação de e-mail, MASTER, bloqueio paciente/médico, CSRF, fila/RAG/auditoria LIOS, publicação sintética bloqueada, um único rascunho, logout e histórico sem credenciais.
- Migrations 007/008: aplicação e reexecução idempotente verificadas no banco de teste.
- `npm audit fix`: zero vulnerabilidades reportadas após as atualizações compatíveis.
- `git diff --check`: passou.

## Evidência do banco real

Backup executado pelo script operacional antes das migrations.
007/008 aplicadas e registradas em `schema_migrations` em 19/09/2026.
Dr. Paulo e Matheus: perfis MASTER ativos nas identidades existentes; Dra. Cris preservada como DOCTOR.
`has_table_privilege` para nogueira_lios: app_users=false, patient_profiles=false, lios.applications=true.

## Limites explícitos

Senhas pessoais não foram solicitadas ou alteradas. O fluxo Supabase foi exercitado com provedor simulado; as identidades e vínculos reais foram conferidos no banco. Não houve cobrança, e-mail real nem geração paga de IA.
Não há credencial de geração real configurada: LIOS funciona em demonstração, com publicação sintética bloqueada. Feeds RSS são opcionais e precisam de configuração explícita.
A auditoria editorial usa heurísticas da LIOS original e não substitui revisão clínica.

## Evidência final

O deploy só informa sucesso após comparar o SHA do web local, domínio público e LIOS privada. O estado final é verificável por `/api/health`, `/healthz`, BUILD_ID, imagem Docker e `git rev-parse`, conforme DEPLOY_RUNBOOK. Não gravar neste arquivo o próprio SHA do commit que o contém.
