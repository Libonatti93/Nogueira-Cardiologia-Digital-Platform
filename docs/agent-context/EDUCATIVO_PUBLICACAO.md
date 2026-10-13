# Central de publicação — 13/10/2026

Área integrada: **MASTER → Educativo / Blog**, `/educativo` no painel existente.
O bloco antigo do dashboard passa a abrir a central; as mesmas tabelas, sessões,
permissão `content.manage`, auditoria e artigos públicos são preservados.

## Auditoria e compatibilidade

Antes desta entrega o editor usava textarea e `sections` JSON; a edição alterava
somente título, resumo, categoria e status. `educativo_posts` estava vazia em
produção; os artigos históricos vinham de `src/data/*blog-posts.ts`. Havia 29
interesses educativos para 10 e-mails na mesma base `educativo_leads`, ligada ao CRM.
O lead-gate enviava o artigo inteiro ao navegador e confiava em localStorage.
Capas eram gravadas em `public`, com validação insuficiente.

A migration aditiva `017_educativo_publishing.sql` acrescenta conteúdo HTML, tipo,
palavras-chave, ALT/legenda, vínculo com perfil do autor, revisão e rascunho separado.
Cria `educativo_post_attachments` e `educativo_access_sessions`; a segunda referencia
os inscritos existentes, sem uma nova base de contatos. `sections`, artigos antigos,
slugs, metadados e datas de publicação anteriores são preservados. Não se permite
mudar a URL depois da primeira publicação. Arquivamento conserva conteúdo e datas.
A migration foi aplicada e reexecutada por checksum no banco isolado.

## Fluxo editorial

Novo conteúdo → escrever → formatar → imagens/materiais → SEO → pré-visualizar →
publicar. Tipos: artigo, aula e material educativo. O editor Tiptap gera HTML semântico
com negrito, itálico, sublinhado, tachado, H1/H2/H3, listas, links, citações, emojis,
separadores, destaques, alinhamento, imagens com ALT/legenda e desfazer/refazer.
O corpo é sanitizado no servidor, na gravação e na renderização.

Autosave após 2,5 segundos sem edição; erros mantêm o texto na tela e há aviso ao
fechar uma aba com alterações não salvas. `revision` evita sobrescrita por outra aba.
Ao editar um conteúdo publicado, `draft_payload` conserva mudanças separadas até
**Publicar alterações**. A ordem e os metadados dos materiais também pertencem à
versão editorial, portanto uma substituição não muda o material publicado antes da
confirmação. O preview autenticado usa o mesmo corpo e os mesmos cards públicos.
Os artigos já existentes no código continuam públicos e com seus endereços originais.

SEO local, sem API paga: 20 indicadores, score 0–100, termos extraídos do texto,
preview de busca, tamanho de título/descrição, tema no título/URL/descrição/início/H2,
estrutura, links, imagens/ALT, extensão e legibilidade simples. O painel orienta uso
natural dos termos e não promete ranking. Publicações entram no sitemap dinâmico.
O perfil do professor reaproveita dados institucionais reais e aponta ao currículo.

## Inscrição e proteção

Novas aulas, materiais educativos e posts com PDF/PowerPoint exigem inscrição;
artigos comuns permitem ao editor escolher. Visitantes veem título, capa, resumo e
primeiro parágrafo limitado a 420 caracteres. O restante não é enviado no HTML nem
no payload RSC para visitantes sem liberação.

A API `/api/leads` continua reaproveitando `leads`, `educativo_leads` e `lead_events`.
Valida a existência do post publicado e toma o título do servidor, registra a origem
e o interesse em cada conteúdo. Requisições repetidas não duplicam o interesse.
A liberação usa token aleatório de 256 bits em cookie HttpOnly, SameSite=Lax,
Secure em HTTPS, válido por 30 dias. Somente SHA-256 do token fica no banco.
LocalStorage antigo não autoriza acesso e é removido; visitas seguintes usam a
sessão para registrar novos interesses sem pedir os mesmos dados. Turnstile,
verificação de origem e limite de tentativas protegem a inscrição.
É inscrição para conteúdo educativo, sem comprovação de titularidade de e-mail;
não confundir com autenticação de pacientes ou autorização para documentos clínicos.

## Arquivos e backup

Objetos usam o armazenamento privado persistente existente `/opt/nogueira-drive`,
UUIDs como nomes físicos, pastas/permissões privadas e o lock de backup do Drive.
Não são gravados em `public`, Git ou dentro da release. Metadados editoriais ficam
na tabela própria de anexos. Capas são públicas somente quando estão vinculadas à
versão publicada; texto/imagens internas seguem a proteção do artigo. PDF/PPT/PPTX
sempre exigem liberação válida. Arquivados e anexos removidos não são públicos.
Cada resposta de arquivo/thumbnail verifica autorização; não basta conhecer o UUID.
Respostas usam no-store, nosniff, CSP sandbox, same-origin e Range autorizado.

Limites: imagens JPG/JPEG/PNG/WEBP até 8 MB e 24 milhões de pixels; PDF/PPT/PPTX até
40 MB. Até 60 anexos na versão atual e limite acumulado de 2 GB/300 objetos por post.
Checam extensão, MIME, assinaturas e estrutura. Imagens são decodificadas e
regravadas, removendo conteúdo extra. PPTX é inspecionado com limites de entradas e
expansão; macros/objetos incorporados/ActiveX são recusados. PPT precisa ter estrutura
CFB de PowerPoint sem macros; PDFs precisam de cabeçalho e final válidos.

PDF: capa de identificação gerada e visualização do arquivo sob demanda no leitor
PDF do navegador, com opção de nova aba/download. PowerPoint: miniatura incorporada
quando disponível (regravada como PNG), contagem de slides em PPTX, ou capa gerada;
PPT/PPTX são baixados para abrir em um leitor compatível. Não há conversão de todos
os slides nem reprodução completa da apresentação no navegador. Nenhum arquivo é
enviado a um visualizador externo.

Substituir/remover desvincula o objeto da versão publicada quando ela for confirmada;
objetos anteriores são conservados no armazenamento e no backup para integridade,
sem URL pública autorizada. O limite acumulado inclui esses objetos. Não há expurgo
automático editorial nesta entrega.
O backup existente foi estendido para incluir esses objetos no manifesto, tamanho,
checksum e estimativa de espaço. Dump e arquivos usam o mesmo lock consistente.
O teste restaurou o dump e todos os objetos em destino isolado e conferiu SHA-256.
A pendência anterior de cópia externa à VPS permanece descrita em PRIVATE_FILES.md.

## Validação

- Build otimizado, TypeScript, lint e 17 testes unitários: aprovados.
- `tests/educativo.integration.mjs`: Chromium 1440px/768px/390px, edição/formatos,
  imagem/ALT/legenda, JPEG/PNG/PDF/PPTX, PPT estrutural, draft/autosave/reabertura,
  previews, publicação, SEO/metadata, listagem/sitemap, inscrição e acesso posterior.
- Negativas: anônimo/operador/CSRF, vazamento em HTML/RSC, PDF/PPTX/thumbnail/HEAD
  sem sessão, Range inválido, expiração, tentativa de usar arquivo de outro post,
  extensão/MIME/assinatura/tamanho, conflito de revisão e mudança de slug publicado.
- Publicação separada de rascunhos, substituição/remoção, arquivamento e datas
  preservadas; auditoria de criação/edição/publicação/upload/remoção.
- Backup/restore completo com metadados, tamanho e checksum; sem dados reais nos
  testes. Evidência visual: `/tmp/nogueira-educativo-evidence`.
- Regressão HTTP: 16 grupos aprovados (auth, IAM, CRM, agenda, LIOS, auditoria).
- Regressão do Drive: 13 grupos aprovados, incluindo limites, permissões, Range,
  revogação durante upload, persistência após reinício e ausência de resíduos.
- Next atualizado para 16.4.0; `npm audit --omit=dev` sem vulnerabilidades reportadas.
  O audit completo mantém avisos transitivos de ferramentas de lint (`braces`);
  não foi aplicada a sugestão de downgrade incompatível do ESLint/Next.

Comandos a partir de `apps/web`:

```sh
node --env-file=.env.test scripts/migrate.mjs
npm run typecheck
npm run lint
npm test
# Carregar .env.test no processo pai evita --env-file herdado em NODE_OPTIONS pelos workers.
node -e "process.loadEnvFile('.env.test'); const r=require('node:child_process').spawnSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,NEXT_DIST_DIR:'.next-educativo',RELEASE_SHA:'educativo-verification'}}); process.exit(r.status??1)"
LD_LIBRARY_PATH=/tmp/nogueira-browser-libs/extracted/usr/lib/x86_64-linux-gnu PLAYWRIGHT_MODULE=/tmp/nogueira-browser/node_modules/playwright/index.mjs node --env-file=.env.test tests/educativo.integration.mjs
NEXT_DIST_DIR=.next-educativo node --env-file=.env.test --import tsx tests/http.integration.ts
```

O teste HTTP exige LIOS isolada em 127.0.0.1:8082. O script editorial cria e limpa
somente suas fixtures e objetos, nunca artigos de pacientes ou da produção.
Não executar o teste HTTP contra produção.

## Deploy

Segue `node scripts/deploy.mjs`, com árvore limpa, commit enviado, backup antes da
migration, build por SHA, smoke e rollback de código existente. Foi acrescentado
`scripts/smoke-educativo.mjs`: verifica painel/TLS, permissão, draft privado, upload,
sanitização, preview e bloqueio anônimo; remove somente seu rascunho técnico nunca
publicado. Não altera senhas e não inscreve contatos fictícios em produção.
Evidência sanitizada: `/var/log/nogueira-educativo-<SHA>.json`.
Conferir HEAD, upstream, BUILD_ID, health local/público/painel e imagem LIOS iguais.
Rollback conserva migration e arquivos; não apagar storage nem reverter os dados.
