# Governança, acesso e auditoria

Interface `/governanca`, alias `/acesso/governanca`; APIs `/api/internal/governance` e `/api/internal/audit`.
A mesma identidade possui vários perfis. Papel clínico `app_users.role`, UUID, vínculos médicos e Supabase são preservados.

| Perfil | Escopo |
|---|---|
| MASTER | Todas as permissões cadastradas; gestão integral |
| CRM_OPERATOR | panel.access, crm.access, crm.leads.read/manage, crm.patients.read, crm.appointments.read/manage |
| DOCTOR | panel.access e permissões existentes internal.access, content.manage, reports.export, exams.read |
| LIOS_EDITOR | panel.access, lios.read/manage/publish |
| AUDITOR | panel.access, governance.read, audit.read |

DOCTOR conserva o dashboard amplo que já possuía; esta entrega não altera silenciosamente seus poderes históricos. CRM_OPERATOR nunca recebe internal.access, financeiro, IAM, auditoria ou LIOS. O IAM impede inserir poderes administrativos nesse perfil operacional; acesso adicional exige atribuir outro perfil explicitamente.

## Identidades MASTER

- Dr. Paulo: `4d6a92f6-2a80-428e-84be-d2369de3c22f`, DOCTOR + MASTER, credencial local já existente.
- Matheus Libonatti: `0c2a873f-828e-46f9-b9e1-6e4997a83d12`, MASTER; papel paciente e vínculo Supabase preservados. Sem hash local no início: habilitação manual pelo IAM necessária, sem conta duplicada.
- Dra. Cris: `9dfce534-033f-4f74-91ef-61478581ef48`, DOCTOR + MASTER pela migration 009, mesma senha e vínculo clínico.

UUID + e-mail são conferidos somente no bootstrap aditivo; decisões de acesso posteriores usam permissões no banco. MASTER é protegido contra edição de permissões; toda migration com novas permissões deve também concedê-las a MASTER.

## Operação do IAM

Usuários: pesquisa/paginação, criação interna, edição de nome/status e múltiplos perfis, último acesso, credencial habilitada/pendente, revogação de sessões e histórico individual. E-mail não é alterado pelo console para preservar vínculos externos. Contadores reais resumem equipe, MASTER, CRM, médicos, inativos e acessos em 24h.
Perfis: criação/edição com dependências de permissões validadas no backend e contagem de usuários. Matriz mostra usuário → perfis → módulo → permissões efetivas. Auditoria tem filtros de usuário/ação, paginação e detalhes.

Para adicionar funcionário, pesquise primeiro a identidade. Se existir, atribua CRM_OPERATOR à mesma conta e habilite a credencial. Caso contrário, crie usuário interno, escolha CRM_OPERATOR e forneça senha temporária por canal seguro. Não atribua MASTER por conveniência.
Para desligamento, desative a conta: sessões deixam de funcionar imediatamente. Remover um perfil ou modificar suas permissões também invalida sessões. “Revogar sessões” incrementa session_version sem mudar senha/perfis.

## Credencial local

Somente governance.manage pode habilitar/resetar credencial de outra conta interna. O MASTER digita senha temporária (mínimo 12 caracteres, máximo 72 bytes bcrypt), entregue ao titular por canal seguro. O sistema nunca recupera/exibe senha/hash e não gera uma senha conhecida pelo agente.
`must_change_password=true` bloqueia páginas/APIs internas até `/alterar-senha`. O titular informa a senha atual e escolhe uma diferente; o backend limpa a exigência, incrementa session_version e emite nova sessão. Auto-reset administrativo é recusado: usar “Alterar minha senha”. Reset de MASTER exige outro MASTER ativo com credencial local pronta.

## Segurança

- Sessão interna exige audience=internal, panel.access, usuário ativo, session_version atual e permissão específica. Sessão de paciente, mesmo da mesma pessoa, não abre IAM.
- Mutações exigem Origin permitido e recusam Sec-Fetch-Site cross-site. Cookie host-only, Secure, HttpOnly e SameSite=Lax, validade de oito horas.
- Login local não chama Supabase; pacientes continuam com seu fluxo/provider atual. Rate limit persistente por IP/e-mail; troca de senha limitada por usuário.
- Mutações de governança são serializadas e revalidam ator no banco. Auto-lockout de MASTER/gestor delegado e remoção do último MASTER ativo são recusados.
- CRM consulta apenas contatos, etapas e agendamentos autorizados, sem CPF, anamnese, notas clínicas, arquivos, valores financeiros ou credenciais. Agenda histórica privada não aparece no CRM; apenas eventos crm_visible.
- SQL parametrizado, entradas limitadas e snapshots auditáveis por allowlist. Sem impersonação de usuário.

## Eventos

Preservados: auth.login/logout, access.denied/origin_denied, governance.master.bootstrap,
governance.user.create/update, governance.role.update, reports.read, exams.read,
content.create/update/delete, calendar.create, lios.request/mutation/submit.
Novos: governance.credential.reset, governance.session.revoke, auth.password.change,
crm.lead.create/update, crm.appointment.create/update, crm.calendar.create.
Mudanças e auditoria ocorrem na mesma transação quando aplicável. Auditoria guarda IDs, status, versões e datas, nunca senha/hash/token/cookie, payload clínico, notas de agenda ou conteúdo RAG. IP deriva do último X-Forwarded-For do proxy confiável.

Os testes usam senhas fictícias no banco isolado. Smoke real usa sessões de diagnóstico assinadas em memória por três minutos; valida autorização, não conhece nem comprova senhas pessoais. Ver VALIDATION.
