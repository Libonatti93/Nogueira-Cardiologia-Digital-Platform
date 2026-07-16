# PostgreSQL + n8n

Estrutura recomendada para a VPS da Nogueira Cardiologia.

## Objetivo

- PostgreSQL local para `nogueira_app`.
- Banco separado para n8n.
- n8n em container separado.
- Banco sem porta pública.
- Dados persistentes em volumes Docker.

## Variáveis

Copie `.env.example` para `.env` e troque as senhas:

```bash
cp .env.example .env
```

Gere uma chave forte para o n8n:

```bash
openssl rand -hex 32
```

## Subir localmente

```bash
docker compose up -d
```

Em produção com Easypanel, preferir criar os apps pelo painel:

- PostgreSQL como serviço/database interno.
- n8n como app Docker usando `n8nio/n8n:latest`.
- Configurar domínio no Easypanel, por exemplo `automacoes.nogueiracardiologia.com.br`.

## Backup recomendado

Criar rotina diária com `pg_dump`:

```bash
pg_dump "$DATABASE_URL" | gzip > "nogueira_app-$(date +%F).sql.gz"
```

Depois enviar para armazenamento externo via n8n, S3, Cloudflare R2 ou Google Drive.

## Segurança

- Não expor PostgreSQL publicamente.
- Usar senhas fortes.
- Usar HTTPS no n8n.
- Guardar `N8N_ENCRYPTION_KEY`.
- Fazer backup antes de atualizações.
