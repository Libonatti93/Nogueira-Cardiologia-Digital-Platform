# Email Corporativo do Dominio - Planejamento

Este documento registra o plano para criar emails profissionais usando o dominio `nogueiracardiologia.com.br`, como `contato@nogueiracardiologia.com.br`, `secretaria@nogueiracardiologia.com.br` e futuros emails internos da equipe.

## Objetivo

Criar uma estrategia segura e profissional para:

- usar emails com o dominio da clinica;
- aumentar confianca para pacientes e parceiros;
- reduzir risco de mensagens cairem em spam;
- preservar reputacao do dominio;
- permitir recuperacao de senha e comunicacoes automaticas da plataforma;
- deixar a decisao comercial para uma etapa posterior, apos aprovacao.

## Decisao Recomendada

O caminho recomendado e contratar um provedor profissional de email, preferencialmente:

```text
Opcao 1: Google Workspace - Gmail profissional
Opcao 2: Microsoft 365 - Outlook/Exchange profissional
Opcao 3: Email proprio no servidor - apenas como estudo tecnico, nao recomendado para producao
```

Para a Nogueira Cardiologia, a recomendacao inicial e:

```text
Google Workspace Business Starter
```

Motivo: e simples para equipe usar, tem boa entregabilidade, e facilita a operacao com Gmail, Drive, Agenda e documentos.

## Custos de Referencia

Valores consultados em fontes oficiais em 20 de julho de 2026. Devem ser conferidos novamente antes da contratacao, porque planos e precos podem mudar.

### Google Workspace

Fonte oficial: https://workspace.google.com/pricing

Planos principais:

- Business Starter: US$ 7 por usuario/mes no plano anual, ou US$ 8,40 por usuario/mes no plano flexivel.
- Business Standard: US$ 14 por usuario/mes no plano anual, ou US$ 16,80 por usuario/mes no plano flexivel.
- Business Plus: US$ 22 por usuario/mes no plano anual, ou US$ 26,40 por usuario/mes no plano flexivel.

Uso recomendado para comecar:

```text
1 ou 2 contas:
- contato@nogueiracardiologia.com.br
- secretaria@nogueiracardiologia.com.br
```

### Microsoft 365

Fonte oficial: https://www.microsoft.com/en-us/microsoft-365/business/microsoft-365-plans-and-pricing

Planos principais:

- Microsoft 365 Business Basic: US$ 7 por usuario/mes no plano anual, ou US$ 8,40 por usuario/mes no plano mensal.
- Microsoft 365 Business Standard: US$ 14 por usuario/mes no plano anual.
- Microsoft 365 Business Basic sem Teams: US$ 5,40 por usuario/mes no plano anual.

Uso recomendado se a equipe preferir Outlook:

```text
Microsoft 365 Business Basic
```

## Por Que Nao Criar Email Proprio no Servidor

Tecnicamente e possivel configurar email proprio com Postfix, Dovecot, Roundcube, DKIM, SPF, DMARC, backups e monitoramento.

Mesmo assim, nao e a melhor decisao para producao neste momento.

Principais riscos:

- maior chance de cair em spam;
- manutencao constante;
- risco de bloqueio de IP;
- responsabilidade tecnica alta;
- maior fragilidade para comunicacao com pacientes;
- mais dificil garantir reputacao e entregabilidade.

Para uma clinica, email precisa funcionar com alta confiabilidade. Por isso, o custo mensal de um provedor profissional tende a ser menor do que o custo tecnico e operacional de manter email proprio.

## Arquitetura Recomendada

```text
Dominio nogueiracardiologia.com.br
        |
        v
DNS do dominio
        |
        +--> Registro MX
        |       direciona recebimento de emails
        |
        +--> Registro SPF
        |       autoriza quem pode enviar emails pelo dominio
        |
        +--> Registro DKIM
        |       assina tecnicamente os emails enviados
        |
        +--> Registro DMARC
                define politica contra falsificacao
        |
        v
Google Workspace ou Microsoft 365
        |
        +--> contato@nogueiracardiologia.com.br
        +--> secretaria@nogueiracardiologia.com.br
        +--> financeiro@nogueiracardiologia.com.br
        +--> paulo@nogueiracardiologia.com.br
        |
        v
Equipe acessa pelo Gmail ou Outlook
```

## Fluxo Para Criar o Email

```text
1. Escolher provedor
        |
        v
2. Criar conta Google Workspace ou Microsoft 365
        |
        v
3. Informar o dominio nogueiracardiologia.com.br
        |
        v
4. Confirmar propriedade do dominio via DNS
        |
        v
5. Criar caixas de email desejadas
        |
        v
6. Configurar MX, SPF, DKIM e DMARC no DNS
        |
        v
7. Testar envio e recebimento
        |
        v
8. Conectar email ao sistema para mensagens automaticas
```

## Emails Sugeridos

Primeira fase:

- `contato@nogueiracardiologia.com.br`
- `secretaria@nogueiracardiologia.com.br`

Segunda fase:

- `agendamento@nogueiracardiologia.com.br`
- `exames@nogueiracardiologia.com.br`
- `financeiro@nogueiracardiologia.com.br`

Terceira fase:

- emails nominais para medicos e equipe;
- alias ou grupos, como `equipe@nogueiracardiologia.com.br`;
- caixa especifica para notificacoes automaticas, como `no-reply@nogueiracardiologia.com.br`.

## Integracao Com a Plataforma

Depois que o email profissional estiver ativo, a plataforma pode usar o dominio para:

- confirmacao de cadastro;
- recuperacao de senha;
- confirmacao de agendamento;
- aviso de exame enviado;
- comentario medico disponivel;
- notificacoes administrativas;
- comunicacao institucional.

Fluxo previsto:

```text
Paciente faz cadastro
        |
        v
Sistema cria token de verificacao
        |
        v
API envia email pelo provedor
        |
        v
Paciente clica no link
        |
        v
Sistema confirma email valido
        |
        v
Conta fica liberada para uso completo
```

## Pendencias Tecnicas Futuras

- escolher Google Workspace ou Microsoft 365;
- criar a conta principal da clinica;
- acessar o painel DNS do dominio;
- configurar registros MX;
- configurar SPF;
- configurar DKIM;
- configurar DMARC;
- criar caixas e aliases;
- testar entregabilidade;
- criar tabela de verificacao de email no PostgreSQL;
- criar API de envio de email;
- criar tela de "verifique seu email";
- bloquear uso completo do portal ate confirmacao do email;
- criar rotina de reenvio de email de verificacao.

## Estimativa de Tempo

### Fase 1 - Contratacao e DNS

Tempo medio: 1 a 3 horas.

Inclui:

- contratar provedor;
- validar dominio;
- configurar DNS;
- criar primeiras caixas;
- testar envio e recebimento.

### Fase 2 - Integracao Com o Sistema

Tempo medio: 1 a 2 dias de desenvolvimento.

Inclui:

- criar estrutura de verificacao no banco;
- gerar token seguro;
- enviar email de confirmacao;
- criar pagina de confirmacao;
- ajustar login/cadastro;
- testar fluxo completo.

### Fase 3 - Entregabilidade e Seguranca

Tempo medio: 1 dia.

Inclui:

- ajustar SPF, DKIM e DMARC;
- testar reputacao do dominio;
- validar conteudo dos emails;
- evitar padroes de spam;
- documentar procedimento operacional.

## Status

```text
Status atual: mapeado para decisao futura
Prioridade: segundo plano
Bloqueio: depende de aprovacao comercial e escolha do provedor
Recomendacao tecnica: Google Workspace Business Starter
```

