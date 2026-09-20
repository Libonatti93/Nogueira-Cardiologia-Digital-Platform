# Integração LIOS

Origem: `git@github.com:Libonatti93/LIOS.git`, branch main,
SHA `b32d1cc8086541fcb5eeeb6e734e9601676cf5a8`, reconferido com fetch no remoto em 20/09/2026.
Autoria e licença de Matheus Libonatti preservadas em `services/lios`.

## Adaptação

A V1 possuía FastAPI/Python, SQLite WAL, tarefas em memória, RAG lexical por aplicação, coletores RSS, provedores demo/OpenAI, auditoria de sete critérios, cache e publicação HTML standalone.
Foram integrados o domínio, repositório, providers, coletores, recuperação, auditoria e testes. O frontend e o publicador standalone não são usados; o console utiliza os componentes Next.js da clínica.
PostgreSQL substitui SQLite no runtime, com schema `lios` e conta sem acesso às tabelas clínicas. SQLite permanece apenas como banco rápido nos testes unitários do domínio.
O arquivo `src/lios/seed.py` é preservado como referência de origem, mas não é executado em produção.

## Fluxo

Sessão Nogueira → RBAC → `/api/internal/lios/*` → API privada com token de serviço → schema LIOS.
`lios.read`: consultas. `lios.manage`: aplicações, RAGs, execuções. `lios.publish`: envio aprovado para rascunho.
O proxy usa uma lista fechada de rotas/métodos; o token nunca vai ao navegador. Acesso direto à API privada exige token inclusive nas leituras. `/healthz` só revela estado/SHA.
O console acompanha eventos via polling autenticado; não mantém uma autorização indefinida em um SSE público.

Worker no mesmo processo FastAPI (uma instância) consome fila PostgreSQL com claim transacional. Reinício preserva pendências na fila e marca execuções interrompidas como falhas auditáveis. Não há cron de geração automática nem automação n8n.
O processamento sequencial limita consumo e continua sem navegador aberto. Escala horizontal exige evoluir leases/recuperação antes de aumentar réplicas.

## Publicação

Fontes usadas vêm do contexto recuperado, não de alegações do modelo. Proveniência sintética é persistida e bloqueada na auditoria e no adaptador do blog.
Aprovação requer nota ≥8 e nenhum bloqueio. O botão de envio também exige URLs rastreáveis.
`POST /api/internal/lios/submit` cria exatamente um `educativo_posts` em draft, dentro de transação. A publicação final é ação humana existente em `/acesso/dashboard`, com content.manage.
A auditoria é uma política editorial heurística; ela não substitui validação clínica nem comprova veracidade de uma fonte.

## Configuração e operação

`services/lios/.env` (ignorado, 0600): LIOS_ENV, LIOS_DATABASE_URL, LIOS_OPERATOR_TOKEN, LIOS_AI_PROVIDER,
LIOS_PUBLIC_URL, LIOS_DOCKER_NETWORK. Opcionais: LIOS_OPENAI_API_KEY, LIOS_TEXT_MODEL, LIOS_IMAGE_MODEL, LIOS_RSS_FEEDS.
`apps/web/.env.local`: LIOS_INTERNAL_URL e mesmo LIOS_OPERATOR_TOKEN.
O modo inicial é demo: não há chave de IA real configurada. RSS requer feeds públicos explicitamente configurados; conectores sociais não são apresentados como ativos.
As extensões Cross Doctoring citadas no upstream são uma evolução separada;
este repositório não depende de serviços, autenticação, banco ou código da Cross.
As branches remotas do repositório LIOS foram conferidas: `main` é a referência disponível.
O núcleo e seus testes estão incorporados e versionados em `services/lios`; o clone
`/root/LIOS-inspection` foi apenas material de consulta e não participa do runtime.
O administrador pode inserir sinais públicos e operar RAGs desde já. A aplicação inicial Nogueira tem público/oferta editoriais gerais, sem dados de pacientes.

Container `nogueira-lios`: bind `127.0.0.1:8081`, rede existente easypanel, usuário 10001, filesystem somente leitura, sem capabilities, sem Docker socket e limites CPU/memória.
Logs: `docker logs --tail 100 nogueira-lios`. Saúde: `curl -fsS http://127.0.0.1:8081/healthz`.
Logs não contêm payloads, credenciais ou corpos de respostas de provedores.

## Atualização futura

Compare a origem com o SHA acima, revise alterações do domínio e adapte mudanças em vez de substituir todo o serviço. Preserve PostgreSQL/RBAC/publicação por rascunho. Rode testes Python, TypeScript, banco e HTTP. Versione novas migrations, construa imagens com o SHA Nogueira e siga DEPLOY_RUNBOOK.

## Compatibilidade com painel/IAM

A interface canônica agora é `/lios` no Host painel.nogueiracardiologia.com.br; `/acesso/lios` continua alias. Serviço/schema/upstream e permissões editoriais não mudaram. panel.access é requisito adicional para sessões internas, que usam autenticação local. CRM_OPERATOR não recebe lios.read/manage/publish; controles no proxy/backend permanecem. O deploy continua conferindo a imagem e healthz pelo mesmo SHA do web.
