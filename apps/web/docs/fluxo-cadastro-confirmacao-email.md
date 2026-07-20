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
Sistema gera token seguro de confirmacao
        |
        v
Token e salvo em email_verification_tokens
        |
        v
Sistema envia email, se provedor estiver configurado
        |
        v
Paciente clica no link
        |
        v
API /api/auth/confirm-email valida token
        |
        v
app_users.email_verified_at e preenchido
        |
        v
Paciente consegue entrar no portal
```

## Banco de Dados

### app_users

Novo campo:

```text
email_verified_at
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

O sistema foi preparado para usar Resend via API, sem instalar dependencia adicional.

Variaveis futuras:

```text
RESEND_API_KEY
EMAIL_FROM
NEXT_PUBLIC_SITE_URL
```

Enquanto `RESEND_API_KEY` nao estiver configurada, o sistema entra em modo de teste:

- cria usuario;
- cria token seguro;
- mostra o link de confirmacao na tela;
- registra o link no log do servidor.

Isso permite testar tudo agora sem custo mensal.

## Caminho de Menor Custo

### Agora

Usar modo de teste para validar o fluxo completo.

### Producao

Escolher um provedor:

- Google Workspace ou Microsoft 365 para email corporativo da equipe;
- Resend, Brevo, SendGrid ou outro provedor transacional para emails automaticos da plataforma.

Para escala, o ideal e separar:

- email humano da clinica: Gmail/Outlook corporativo;
- email automatico do sistema: provedor transacional.

## Pendencias Futuras

- escolher provedor de envio real;
- configurar SPF, DKIM e DMARC no DNS;
- configurar `RESEND_API_KEY`;
- configurar `EMAIL_FROM`;
- criar layout visual final dos emails;
- criar tela dedicada de "verifique sua caixa de entrada";
- criar rotina de limpeza de tokens expirados;
- adicionar painel interno para secretaria ver pacientes pendentes de confirmacao.

