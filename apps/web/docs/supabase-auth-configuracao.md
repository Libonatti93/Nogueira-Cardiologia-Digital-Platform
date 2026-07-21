# Supabase Auth - Configuracao do Portal do Paciente

Este guia registra como conectar o Supabase Auth ao portal do paciente da Nogueira Cardiologia.

## O Que o Supabase Vai Fazer

O Supabase fica responsavel por:

- cadastro do paciente com email e senha;
- envio do email de confirmacao;
- bloqueio de login enquanto o email nao for confirmado;
- validacao da senha no login;
- reenvio do email de confirmacao.

O banco local PostgreSQL continua responsavel por:

- dados do portal;
- CRM da secretaria;
- agenda;
- exames enviados;
- dashboard medico/admin;
- vinculo com o usuario confirmado do Supabase.

## Dados Que Podem Ser Enviados Ao Codex

Pode enviar:

```text
Project URL
Publishable key ou anon public key
```

Nao envie no chat:

```text
service_role key
database password do Supabase
JWT secret
```

A integracao de paciente nao precisa da `service_role key`.

## Variaveis De Ambiente

No servidor, configurar:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
NEXT_PUBLIC_SITE_URL=https://www.nogueiracardiologia.com.br
```

Tambem funcionam estes nomes alternativos:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_PUBLISHABLE_KEY
```

## Configuracao No Painel Do Supabase

No Supabase:

```text
Authentication
  |
  v
Providers
  |
  v
Email
  |
  v
Confirm email: ligado
```

Depois:

```text
Authentication
  |
  v
URL Configuration
  |
  +--> Site URL:
  |    https://www.nogueiracardiologia.com.br
  |
  +--> Redirect URLs:
       https://www.nogueiracardiologia.com.br/portal?verified=1
       https://www.nogueiracardiologia.com.br/portal
```

## Fluxo Final

```text
Paciente abre /portal
        |
        v
Clica em "Criar cadastro"
        |
        v
Preenche nome, WhatsApp, email e senha
        |
        v
Next.js chama Supabase Auth
        |
        v
Supabase envia email de confirmacao
        |
        v
Paciente confirma
        |
        v
Paciente volta para /portal
        |
        v
Paciente entra com email e senha
        |
        v
Next.js cria sessao local segura
        |
        v
Portal do paciente e liberado
```

## Status

```text
Codigo: implementado
Banco local: preparado
Publicacao: depende das credenciais do Supabase no ambiente
Equipe interna: permanece no auth local
Paciente: usa Supabase Auth quando configurado
```

