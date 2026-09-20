# Mapa do banco

Banco de produção `nogueira_app`, container `nogueira-postgres`.
`nogueira_app_user` é o usuário da aplicação, sem superuser ou criação de roles. Manutenção usa a conta existente `nogueira_admin`. A LIOS usa `nogueira_lios`, restrita ao schema editorial.

| Entidade | Papel e relações |
|---|---|
| app_users | Identidade canônica, e-mail único/citext, senha opcional, vínculo Supabase, papel clínico, status e session_version |
| patient_profiles / patient_health_intakes | Cadastro e informações clínicas; vinculados ao usuário/paciente |
| doctors / secretaries | Profissionais e equipe existentes |
| appointments / payments | Consultas e cobranças; vínculos com pacientes e profissionais |
| leads / lead_events / educativo_leads | Captação e histórico operacional |
| educativo_posts | Blog; rascunho/publicado/arquivado, seções JSON, SEO e autoria |
| patient_exam_uploads | Metadados e armazenamento de exames; autorização por proprietário ou exams.read |
| email_verification_tokens | Confirmação de e-mail existente |
| internal_calendar_events | Agenda administrativa |
| audit_logs | Auditoria compartilhada; ator, ação, entidade, resultado, IP, snapshots e metadados |
| roles / permissions | Perfis e permissões por módulo |
| user_roles / role_permissions | Relações N:N do RBAC |
| auth_rate_limits | Limitação de tentativas; chave com hash, contagem e expiração |
| schema_migrations | Nome, SHA-256 do arquivo e data de aplicação das migrations novas |

## Schema lios (migration 008)

`applications` delimita o escopo editorial.
`rag_documents` armazena avatar/oferta/sinais, origem, checksum e conteúdo. A unicidade por aplicação/tipo/checksum deduplica entradas.
`pipeline_runs` persiste fila, tema, modo, etapa, revisões e resultado. Índice parcial permite uma execução ativa por aplicação.
`pipeline_events` contém o histórico de etapas.
`articles` preserva cada tentativa, corpo, metadados, fontes e auditoria. `blog_post_id` referencia `public.educativo_posts` e torna o envio idempotente.
`cache_entries` preserva a interface de cache do núcleo de origem; não contém dados clínicos.

## Migrations

001–006 já eram parte da aplicação (há dois arquivos históricos numerados 004). Não reaplicar cegamente em produção.
007 adiciona RBAC, campos de auditoria, versão de sessão e limitador. Reutiliza as identidades verificadas de Dr. Paulo, Matheus e Dra. Cris, preservando senhas, vínculo Supabase e papéis clínicos.
008 cria schema/tabelas LIOS. O runner aplica cada arquivo em transação sob lock e verifica checksum em reexecuções.
As permissões do usuário de runtime LIOS são provisionadas separadamente com `scripts/configure-lios.mjs`; o container não executa DDL.

007 e 008 já estavam aplicadas em produção em 19/09/2026; os checksums são
revalidados em cada deploy. A reauditoria de 20/09 aplica o esquema histórico e
007/008 em banco vazio descartável, sem copiar pacientes, e confirma a reexecução.
Não houve necessidade de alterar migrations aplicadas ou criar entidades duplicadas.
A implementação do painel não cria tabelas: reutiliza as entidades e relações existentes.

As ações de conteúdo e criação de compromissos gravam mudança e auditoria na mesma
transação. Título, notas clínicas, conteúdo do artigo, documentos e credenciais
não são replicados nos snapshots da auditoria administrativa.

## Migration 009 — painel/IAM/CRM

- app_users.must_change_password boolean NOT NULL DEFAULT false: exige troca inicial quando credencial é habilitada/resetada pelo IAM.
- app_users.password_changed_at timestamptz: data da última troca concluída pelo titular.
- internal_calendar_events.crm_visible boolean NOT NULL DEFAULT false: agenda compartilhada; eventos privados existentes não se tornam visíveis automaticamente.
- Sete permissões panel/CRM, perfil CRM_OPERATOR e concessões a MASTER; panel.access aos perfis internos existentes.
- Cris recebe MASTER na identidade existente e mantém DOCTOR. Nenhum password_hash, UUID, vínculo Supabase ou clínico é alterado.
- session_version dos usuários com perfis é incrementado para exigir novo login após mudança de política. 007/008 permanecem com conteúdo/checksum original.

leads/lead_events/patient_profiles/appointments/doctors/internal_calendar_events são reutilizadas pelo CRM. Projeções explícitas excluem CPF, anamnese, notas privadas, pagamentos e credenciais. Mutações CRM + evento de auditoria são transacionais. Sem DDL em runtime e sem banco adicional.
