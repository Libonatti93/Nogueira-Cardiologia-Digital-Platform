# Governança, acesso e auditoria

Página `/acesso/governanca`, APIs `/api/internal/governance` e `/api/internal/audit`.
Pesquisa/paginação de usuários, criação interna, edição de nome/status/perfis, catálogo de permissões e histórico filtrável de eventos.

| Perfil | Permissões |
|---|---|
| MASTER | Todas as permissões cadastradas pela migration |
| DOCTOR | internal.access, content.manage, reports.export, exams.read |
| LIOS_EDITOR | lios.read, lios.manage, lios.publish |
| AUDITOR | governance.read, audit.read |

MASTER foi vinculado às contas existentes:
- Dr. Paulo: `4d6a92f6-2a80-428e-84be-d2369de3c22f`, login local.
- Matheus: `0c2a873f-828e-46f9-b9e1-6e4997a83d12`, login Supabase já vinculado.

Não existe autorização por e-mail espalhada no frontend. A migration de bootstrap combina UUID e e-mail previamente conferidos. As verificações posteriores usam RBAC no banco.
Novas permissões devem ser atribuídas a MASTER por nova migration. Papéis clínicos históricos são independentes dos perfis administrativos; o cadastro paciente de Matheus é preservado.

## Proteções

- Toda API administrativa valida sessão ativa e permissão; esconder links é somente UX.
- Mutações exigem Origin permitido e recusam Sec-Fetch-Site cross-site. Os dois domínios oficiais estão configurados por AUTH_ALLOWED_ORIGINS.
- Edições de usuário e de permissões de perfil incrementam session_version. Logout também revoga as sessões existentes daquela conta.
- MASTER não pode remover seu próprio acesso nem desativar/remover o último MASTER ativo. Alterações são serializadas e revalidam os poderes do ator dentro da transação.
- Identificador MASTER é protegido contra edição de suas permissões pelo console.
- Credenciais locais novas exigem 12 caracteres e no máximo 72 bytes para bcrypt.
- Não registrar senha, hash, token, cookie, conteúdo clínico ou corpo de RAG na auditoria de acesso.

## Eventos

auth.login (sucesso, recusa, limite), auth.logout, access.denied, access.origin_denied,
governance.master.bootstrap, governance.user.create/update, governance.role.update,
reports.read, exams.read, content.create/update/delete, lios.request, lios.mutation, lios.submit.
`calendar.create` registra a criação de compromisso sem copiar título, local ou notas.
Governança, conteúdo, agenda e envio de rascunhos gravam o evento na mesma transação da mudança.
Solicitações LIOS registram intenção e resultado sem copiar corpo editorial ou segredos.
IP usa o último endereço de X-Forwarded-For; o servidor deve continuar atrás do proxy confiável.

## Verificação

Testes unitários cobrem tokens, origem, permissões e redaction. Testes de banco cobrem revogação, proteção MASTER e transações. Testes HTTP usam credenciais fictícias e Supabase simulado em banco isolado; não conhecem nem alteram as senhas reais dos usuários.
O smoke de produção valida páginas e APIs com sessões assinadas de três minutos
para as identidades existentes de Dr. Paulo e Matheus; testa também recusa para
usuário comum e CSRF, conferindo os eventos reais no banco. Tokens ficam somente
em memória. Isso comprova autorização/sessão no ambiente real, não a senha pessoal
nem uma autenticação real de senha no provedor Supabase.
Em 20/09 o provedor Supabase configurado retorna NXDOMAIN; portanto o login real
de Matheus e dos pacientes que dependem dele está bloqueado externamente.
O perfil MASTER e suas permissões estão presentes e testados. A API sinaliza 503
sem emitir sessão; restauração do provedor requer gestão externa (ver ENVIRONMENT).
