# Fluxo de Cadastro com Confirmacao de Email

Este documento registra a arquitetura implementada para o cadastro do paciente com confirmacao de email antes de liberar o portal.

## Objetivo

Garantir que o paciente use um email real antes de acessar a dashboard do paciente, solicitar consulta e enviar exames.

## Fluxo Implementado

```text
Paciente acessa /portal
        |
        v
Preenche nome, WhatsApp, email e senha
        |
        v
API /api/auth/signup cria usuario patient pendente
        |
        v
Supabase Auth cria credencial e gera confirmacao
        |
        v
Supabase envia email de confirmacao
        |
        v
Paciente confirma pelo link
        |
        v
Login sincroniza app_users.email_verified_at
        |
        v
Paciente consegue entrar no portal
```

Enquanto o Supabase nao estiver configurado no ambiente, o sistema usa o fluxo interno de teste com token proprio para nao quebrar o portal.

## Banco de Dados

### app_users

Novo campo:

```text
email_verified_at
supabase_user_id
```

Quando este campo esta vazio, o paciente ainda nao confirmou o email.

### email_verification_tokens

Tabela criada para controlar os links de confirmacao.

Campos principais:

```text
id
created_at
expires_at
consumed_at
user_id
token_hash
sent_to_email
purpose
```

O token real nao fica salvo no banco. O banco guarda apenas o hash do token, o que reduz risco em caso de vazamento.

Esta tabela continua existindo como fallback tecnico. Com Supabase configurado, a confirmacao principal fica em Supabase Auth.

## Regras de Acesso

- Paciente sem email confirmado nao entra no portal.
- Paciente sem email confirmado nao solicita consulta.
- Paciente sem email confirmado nao envia exames.
- Paciente sem email confirmado nao abre arquivos de exame.
- Medico, secretaria e admin continuam acessando a dashboard interna normalmente.
- Usuarios antigos foram marcados como confirmados pela migracao para evitar bloqueio indevido.

## Reenvio de Confirmacao

Quando o paciente tenta entrar sem confirmar, a tela permite reenviar o link.

Fluxo:

```text
Paciente informa email no login
        |
        v
Login retorna email_not_verified
        |
        v
Tela mostra acao "Reenviar confirmacao"
        |
        v
API /api/auth/resend-verification gera novo token
        |
        v
Tokens antigos pendentes sao consumidos
        |
        v
Novo link e enviado ou exibido em modo de teste
```

## Envio de Email

O sistema foi preparado para usar Supabase Auth como caminho principal para cadastro, senha e confirmacao de email do paciente.

Variaveis futuras:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Tambem sao aceitas estas variaveis equivalentes no servidor:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_PUBLISHABLE_KEY
```

Enquanto o Supabase nao estiver configurado, o sistema entra em modo de teste:

- cria usuario;
- cria token seguro;
- mostra o link de confirmacao na tela;
- registra o link no log do servidor.

Isso permite testar tudo agora sem custo mensal.

## Caminho de Menor Custo

### Agora

Usar Supabase Auth free para cadastro, senha e confirmacao de email do paciente.

### Producao

Configurar Supabase Auth:

- criar projeto Supabase;
- ativar Confirm Email;
- configurar Site URL;
- liberar Redirect URL do dominio;
- configurar as variaveis no servidor.

Para escala, o ideal e separar:

- email humano da clinica: Gmail/Outlook corporativo;
- autenticacao de paciente: Supabase Auth;
- email transacional avancado: provedor dedicado somente quando o volume justificar.

## Pendencias Futuras

- criar projeto Supabase;
- ativar Confirm Email no Supabase;
- configurar Site URL como `https://www.nogueiracardiologia.com.br`;
- adicionar Redirect URL `https://www.nogueiracardiologia.com.br/portal?verified=1`;
- configurar `NEXT_PUBLIC_SUPABASE_URL`;
- configurar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- adicionar Redirect URL `https://www.nogueiracardiologia.com.br/portal/redefinir-senha`;
- criar layout visual final dos emails;
- criar tela dedicada de "verifique sua caixa de entrada";
- adicionar painel interno para secretaria ver pacientes pendentes de confirmacao.
