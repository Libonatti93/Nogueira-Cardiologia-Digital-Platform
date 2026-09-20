# Painel único, IAM e CRM

## Host e experiência

URL canônica interna: `https://painel.nogueiracardiologia.com.br`.
`src/proxy.ts` reescreve a raiz desse Host para `/acesso`: sem sessão apresenta login; sessão interna válida vai para o workspace por permissões. Site público mantém sua raiz, SEO e domínio. Portal/blog/exames públicos no Host painel redirecionam ao domínio público. Painel recebe noindex/no-store e não exibe widgets promocionais do site.

Não há segunda aplicação, banco ou autenticação. O mesmo web :3002 responde aos hosts via Traefik.
Sidebar recolhível/responsiva mostra logo, identidade, perfis, navegação autorizada, troca de senha e logout. Menus: dashboard, CRM/agenda/pacientes/consultas, exames, financeiro, conteúdo, LIOS, IAM, auditoria e configurações, conforme permissões. Exames/financeiro/conteúdo reutilizam seções existentes; configurações aponta aos controles reais de acesso/credencial.

| Condição | Entrada |
|---|---|
| Senha temporária pendente | /alterar-senha |
| internal.access (inclui MASTER e DOCTOR existentes) | /dashboard |
| crm.access, sem internal.access | /crm |
| lios.read, sem anteriores | /lios |
| governance.read | /governanca |
| audit.read, sem anteriores | /auditoria |
| Sem módulo autorizado | /sem-acesso |

`/acesso`, `/acesso/dashboard`, `/acesso/governanca`, `/acesso/lios` continuam aliases funcionais durante a transição. Cookies são restritos ao hostname: sessões entre domínio público e painel não são compartilhadas automaticamente.

## Componentes e limites

- `src/lib/panel-policy.ts`: catálogo de navegação e roteamento por permissões.
- `auth.ts`, `api-access.ts`, `access-policy.ts`: sessão/audience/RBAC, revogação, Origin.
- `governance.ts` e `governance-console.tsx`: evolução do IAM existente.
- `src/lib/crm.ts`, `/api/internal/crm`, `crm-console.tsx`: projeções e mutações operacionais nas tabelas existentes.
- `panel-sidebar.tsx` e `internal-shell.tsx`: apresentação compartilhada.
- `009_panel_iam_crm.sql`: campos aditivos, permissões/perfil, MASTER Cris, revogação das sessões internas anteriores.

GET CRM usa views summary/leads/patients/appointments/agenda/history, pesquisa e paginação de até 100 registros. Cada view exige sua permissão; resumo consulta somente módulos concedidos. POST aceita lead, appointment ou event com permissão específica, valida ator novamente na transação e registra auditoria.
CRM cria/edita contatos, acompanhamento e consultas; consulta pacientes já cadastrados. Não escreve prontuários, pagamentos, anexos ou usuários. Estados financeiros existentes podem ser preservados, mas o operador não marca uma consulta/lead como pago. Horário já ocupado pelo mesmo médico retorna conflito. Eventos compartilhados usam crm_visible=true; compromissos privados antigos permanecem privados.
Dashboard amplo existente continua limitado por internal.access. Cards de IAM/LIOS são consultados apenas quando suas permissões estão presentes, sem dados inventados.

## DNS pendente do proprietário

- Tipo recomendado: **A**.
- Host no provedor: **painel** (FQDN painel.nogueiracardiologia.com.br).
- Destino real da VPS: **2.24.215.163**.
- Não criar AAAA sem IPv6 funcional conferido. Nenhuma alteração DNS foi executada pelo agente.
- Traefik usa o serviço nogueira-web existente em http://172.16.1.1:3002. HTTP redireciona a HTTPS.
- Antes do DNS, usa certificado padrão apenas para teste local. Não é certificado público válido do painel.
- Cron existente a cada minuto executa ensure-traefik-nogueira-route.js. Ao resolver o A para o IP acima, grava marcador root-only nogueira-panel-tls-ready e habilita o resolver letsencrypt já usado no site. Não solicita certificado antes disso.
- Teste pré-DNS: Host/SNI reais pelo Traefik em 127.0.0.1; ver DEPLOY_RUNBOOK. A exceção de certificado só se aplica a esse diagnóstico local, nunca ao browser de usuários ou TLS do site público.

## Limites operacionais

Matheus já possui MASTER mas não tinha credencial local. Paulo ou Cris precisam definir temporária na conta existente pelo IAM; o titular escolhe sua senha na troca obrigatória. Nenhuma senha real foi alterada nesta implementação.
Supabase indisponível continua afetando pacientes; não afeta login interno. LIOS demo e seus controles anteriores permanecem. Restore do provedor e chave de IA real são dependências externas preexistentes.
