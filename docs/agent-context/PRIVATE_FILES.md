# Arquivos privados — infraestrutura e operação

## Auditoria anterior às alterações (03/10/2026)

- Branch operacional: `agent/portal-seo-home-ux`. Checkout limpo, sem mudanças locais;
  VPS, artefato web, imagem LIOS e branch remota em `47045f6b463604b6d66d1e3554c21a708ca99efd`.
  HEAD da branch padrão do GitHub: `1f604bc07c8850aa69144be9d0589a573d7c2f06`;
  não é a branch operacional. Nenhum reset/merge da branch padrão é necessário.
- Next.js 16.3.5 App Router/React 19, Tailwind 4, Route Handlers/Server Actions;
  web servido por `nogueira-web.service`, host :3002. Releases imutáveis `.next-releases/<SHA>`.
- Sessões HMAC/HttpOnly/Secure, audience interna, RBAC vivo, session_version,
  credenciais locais e checagem de Origin. Identidades, senhas, portal e Supabase preservados.
  Três MASTER; DOCTOR, LIOS_EDITOR, AUDITOR e CRM_OPERATOR já existentes.
- PostgreSQL 16.14, banco `nogueira_app`, runtime `nogueira_app_user` sem superuser;
  volume Docker `nogueira_postgres_data`. `nogueira_lios` restrito ao schema editorial.
  Migrations 007–009 já aplicadas com checksum. Banco isolado existente `nogueira_integration_test`.
- Containers: PostgreSQL (:5432 loopback), LIOS (:8081 loopback), EasyPanel e Traefik 3.6.7 (80/443).
  LIOS sem volume, filesystem readonly; dados no PostgreSQL. Web não usa Docker.
- Domínios públicos no Traefik existente; `painel` previamente preparado. `app` não existia
  no proxy e respondeu NXDOMAIN no DNS público durante a auditoria. Novo alias preparado,
  sem retirar `painel`, site ou portal. DNS A app → 2.24.215.163 depende do proprietário.
- Uploads existentes de exames: `apps/web/storage/exam-uploads` (privado, ignorado no Git);
  imagens públicas de identidade: `apps/web/public/uploads-imagens-nogueira`.
  Não mover/reclassificar uploads existentes nesta entrega.
- Backup diário às 03:15 UTC por `/etc/cron.d/nogueira-postgres-backup`, dumps locais
  em `/opt/nogueira-postgres/backups`, retenção 14 dias. Última execução auditada: 03/10.
  Não foi encontrada configuração de cópia externa/restic/borg/rclone. Backup do provedor
  não pode ser confirmado a partir da VPS. Disco inicial: 96 GB, 85 GB disponíveis.

## Implementação

`/arquivos` reutiliza InternalShell/PanelSidebar. API `/api/internal/files` lista e altera
metadados; `/upload` recebe PUT binário em streaming; `/[id]/content` oferece GET/HEAD,
download/preview autenticado e Range para mídia/Safari. Não existem URLs públicas de objetos.
Interface: subpastas/breadcrumb, busca global por nome, recentes/favoritos/lixeira,
grid/lista, paginação, seleção múltipla, upload múltiplo/drag-drop, progresso/cancelamento,
download, preview e fallback, renomear/mover/restaurar/excluir com confirmação.

Migration aditiva `010_private_files.sql`: `drive_folders`, `drive_files`, `drive_file_cleanup`.
Permissão `files.access` concedida a MASTER; cada usuário acessa somente seu owner_id,
inclusive entre MASTER. CRM/DOCTOR sem concessão explícita continuam sem arquivos privados.
Futuro compartilhamento exige ACL explícita; privilégio MASTER não significa ler arquivos alheios.
Sem versões de arquivo na v1 e sem sobrescrita silenciosa de uploads.

Armazenamento: `/opt/nogueira-drive` (DRIVE_STORAGE_ROOT), pasta host persistente fora do
Git/build/public. **Não há volume Docker de arquivos**, pois o web é systemd. Sobrevive
a restart, rebuild, releases e compose down/up. Eventual containerização deverá fazer
bind mount desse mesmo diretório; não usar filesystem efêmero.
Objetos: `objects/<prefixo UUID>/<UUID>`; envios incompletos: `incoming/<UUID>`.
Diretórios 0700 e objetos 0600. Nomes originais ficam apenas no banco.

Limites v1: 250 MB/arquivo, 10 GB por proprietário incluindo lixeira, até 3 uploads
simultâneos por processo, reserva de 1 GB livre, até 64 níveis, 100 itens/página/ação.
Upload em streaming com SHA-256, validação de tamanho real e assinaturas dos formatos
visualizáveis, sem confiar no MIME do cliente. Formatos desconhecidos, HTML/SVG/scripts,
Office, ZIP e HEIC continuam disponíveis para download com application/octet-stream.
Preview inline restrito a tipos passivos detectados, CSP sandbox, nosniff, no-store,
Content-Disposition seguro. UTF-8 TXT é visualizado; texto incompatível usa download.
Vídeo/áudio dependem do codec suportado pelo navegador. Não há conversão de Office/HEIC
nem alegação de antivírus. SQL parametrizado, UUID validado, caminhos internos derivados
exclusivamente de UUID e O_NOFOLLOW, autorização por dono em todas as operações.

Mutações revalidam conta/permissão/versão da sessão, serializam alterações do mesmo dono
e auditam IDs/ação, sem nomes/conteúdo dos documentos. Exclusão de pasta marca o grupo
ativo; itens anteriormente na lixeira mantêm seu grupo. Restaurar filho cujo pai não
está disponível retorna à raiz. Conflito de nome de pasta é informado, sem sobrescrita.
Exclusão definitiva cria fila transacional de unlink, reprocessada nas mutações e backup.
Arquivos em incoming abandonados após queda abrupta podem ser inspecionados e removidos
por manutenção após confirmar que não há uploads ativos; nunca apagar objects sem
confrontar os metadados. Não há esvaziamento automático de documentos da lixeira.

## Backup e recuperação

O cron existente passa a chamar `scripts/backup-drive.mjs`. Cada conjunto local em
`/opt/nogueira-postgres/backups/drive/<timestamp>/` contém `database.sql.gz`,
`objects.tar.gz` e `manifest.json` com UUID/tamanho/checksum. Lock PostgreSQL exclusivo
impede mudanças de metadados/objetos durante dump e tar; downloads continuam disponíveis.
Incoming é excluído; a publicação final de upload espera o lock. Conjuntos incompletos
nunca são apresentados como completos. Arquivos herdados de exames não fazem parte
deste arquivo tar; a política histórica de exames continua precisando de revisão externa.

**BACKUP DO NOGUEIRA DRIVE AINDA PRECISA SER CONFIGURADO** em destino externo ao SSD/VPS.
Copiar com criptografia e controle de acesso os conjuntos completos de
`/opt/nogueira-postgres/backups/drive/`; incluir `/opt/nogueira-drive` e os metadados
PostgreSQL na política externa. Nenhuma credencial ou serviço pago foi inventado.
O backup local não protege contra perda da VPS. Retenção dos conjuntos: aproximadamente
14 dias completos, alinhada à rotina existente. Exclusão definitiva pode continuar
presente em backups retidos até sua expiração.

Recuperação: validar gzip/tar/manifest; restaurar primeiro em banco e diretório isolados,
comparar SHA-256/tamanho de cada objeto e exercitar autorização/download. Em desastre,
parar novas escritas e escolher um par dump/objects do mesmo timestamp. Nunca restaurar
um dump completo sobre produção ativa sem análise; ele inclui os módulos preexistentes.
Rollback de código usa `.runtime.env.previous`/release anterior e mantém migration e
objetos. Não apagar o diretório para rollback. Versão de package existente: 0.2.0.

## Validação desta entrega

- Lint sem avisos, typecheck e build otimizado: PASS (137 páginas, build separado da produção).
- Unidade: 12 testes PASS, incluindo nomes/MIME/Range. Governança PostgreSQL: PASS.
- Regressão HTTP existente: 15 grupos PASS; painel/IAM/CRM/LIOS/autenticação e Server Actions preservados.
- Navegador existente: Chromium desktop/mobile, login/IAM/CRM/sidebar/logout PASS.
- Arquivos: 12 grupos PASS, cobrindo API, segurança/isolamento MASTER, hierarquia,
  lixeira/restore/purge, tamanho/quota, SHA-256, persistência após restart e ausência de resíduos.
- Chromium e WebKit 26.6 em HTTPS local: login, pastas, múltiplos uploads, drag/drop,
  TXT preview/download, busca, grid/lista, seleção, lixeira/restore e largura 390px PASS.
  Sem erros JavaScript e sem overflow horizontal. Não equivale a ensaio em iPhone físico.
- Backup: dump completo restaurado em banco descartável, todos os objetos conferidos
  por tamanho/SHA-256 e metadados idênticos ao manifesto. Banco descartável removido.
- Migration aplicada e reexecutada por checksum no banco de integração antes de produção.
- Evidências sem pacientes: `/tmp/nogueira-drive-evidence`, `/tmp/nogueira-drive-backups`;
  navegadores/bibliotecas de teste somente em cache/tmp, sem atualização de pacotes da VPS.
- Revisão do diff e comparação com segredos reais de configuração: nenhum segredo/documento
  adicionado ao Git. Dumps, screenshots, certificados de teste e uploads permanecem fora dele.
- Deploy executa a mesma validação operacional existente e smoke do Drive; este cria apenas
  uma pasta/arquivo técnico temporário do Dr. Paulo e os remove, sem alterar senhas reais.
  Evidência final: `/var/log/nogueira-drive-<SHA>.json` e `/var/log/nogueira-deploy-<SHA>.json`.
- Backup retém pelo menos os dois últimos conjuntos completos; recusa nova cópia se ela
  comprometer a reserva de 1 GB livre. A cópia externa permanece necessária.

Comandos a partir de apps/web: `npm test`, `npm run lint`, `npm run typecheck`, build de
verificação conforme DEPLOY_RUNBOOK; `node --env-file=.env.test tests/drive.integration.mjs`
usa exclusivamente o banco de integração e `/tmp/nogueira-drive-integration`.
Para navegador, definir PLAYWRIGHT_MODULE e DRIVE_BROWSER_ENGINES=chromium,webkit; exige
engines/dependências locais instalados. PLAYWRIGHT_WEBKIT_EXECUTABLE é um override opcional
para launcher de laboratório. HTTPS de teste usa certificado efêmero em /tmp.
`DRIVE_STORAGE_ROOT=/tmp/nogueira-drive-integration DRIVE_BACKUP_DIR=/tmp/nogueira-drive-backups node --env-file=.env.test scripts/backup-drive.mjs`
seguido de `node --env-file=.env.test tests/drive-backup.integration.mjs` valida recuperação
sem escrever no banco de produção.
