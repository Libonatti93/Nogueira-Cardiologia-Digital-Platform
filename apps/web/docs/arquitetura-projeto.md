# Arquitetura do Projeto Nogueira Cardiologia

Este documento resume como o projeto esta organizado hoje, quais partes ja estao conectadas ao banco de dados, quais ainda usam dados simulados e quais sao as principais pendencias.

## Visao Geral

```text
USUARIO / PACIENTE
        |
        v
SITE PUBLICO
src/app/page.tsx
        |
        | botao "Marcar Consulta"
        v
PORTAL
src/app/portal/page.tsx
        |
        +----------------------------+
        |                            |
        v                            v
CADASTRO / LOGIN PACIENTE       LOGIN MEDICO / ADMIN
src/components/portal/           src/components/portal/
portal-access.tsx                portal-access.tsx
        |                            |
        v                            v
/api/auth/signup                 /api/auth/login
src/app/api/auth/signup/route.ts src/app/api/auth/login/route.ts
        |                            |
        v                            v
BANCO POSTGRESQL                 BANCO POSTGRESQL
tabela app_users                 tabela app_users
```

## Onde o Banco Entra

```text
CODIGO DO SITE
        |
        v
src/lib/db.ts
        |
        v
DATABASE_URL
        |
        v
Docker container: nogueira-postgres
        |
        v
Banco: nogueira_app
        |
        v
Tabelas:
app_users
patient_profiles
appointments
leads
payments
doctors
secretaries
audit_logs
```

O arquivo que conecta o sistema ao banco e:

```text
src/lib/db.ts
```

Ele e o fio entre o Next.js e o PostgreSQL.

## Fluxo de Cadastro

```text
Paciente preenche:
nome
email
whatsapp
senha
        |
        v
PortalAccess
src/components/portal/portal-access.tsx
        |
        v
POST /api/auth/signup
src/app/api/auth/signup/route.ts
        |
        v
Valida:
nome minimo
email com formato valido
whatsapp
senha minima
email duplicado
        |
        v
Salva no banco:
tabela app_users
```

Hoje isso esta conectado de verdade ao PostgreSQL.

O dado cai na tabela:

```text
app_users
```

Campos principais:

```text
email
password_hash
role
full_name
phone_whatsapp
is_active
last_login_at
```

Pendente: ainda nao tem confirmacao de e-mail.

## Fluxo de Login

```text
Paciente ou medico digita:
email
senha
        |
        v
POST /api/auth/login
src/app/api/auth/login/route.ts
        |
        v
Consulta app_users
        |
        v
Se senha correta:
paciente -> /portal/paciente
medico/admin -> /portal/medico
```

Hoje isso tambem esta conectado de verdade ao PostgreSQL.

## Fluxo de Agendamento

```text
Paciente entra em:
/portal/paciente
        |
        v
Clica em "Iniciar agendamento"
        |
        v
/portal/paciente/agendar
src/app/portal/paciente/agendar/page.tsx
        |
        v
Preenche:
nome
CPF
whatsapp
email
nascimento
altura
peso
risco cardiovascular
LGPD
        |
        v
POST /api/appointments
src/app/api/appointments/route.ts
        |
        v
Salva em varias tabelas:
patient_profiles
patient_health_intakes
leads
appointments
lead_events
```

Esse fluxo esta conectado ao banco.

Diagrama mais detalhado:

```text
/api/appointments
        |
        +--> patient_profiles
        |       dados cadastrais do paciente
        |
        +--> patient_health_intakes
        |       hipertensao, diabetes, colesterol, tabagismo
        |
        +--> leads
        |       cria oportunidade para secretaria acompanhar
        |
        +--> appointments
        |       cria solicitacao de consulta
        |
        +--> lead_events
                registra evento: paciente solicitou consulta
```

## Fluxo do Medico

```text
Login medico/admin
        |
        v
/portal/medico
src/app/portal/medico/page.tsx
        |
        v
Mostra dashboard
```

Mas atencao: hoje essa tela ainda usa dados falsos/simulados.

Os dados vem daqui:

```text
src/data/dashboard.ts
```

Entao:

```text
/portal/medico
        |
        v
AINDA NAO BUSCA DO BANCO
        |
        v
usa src/data/dashboard.ts
```

Pendente: conectar essa tela ao PostgreSQL real.

## Fluxo da Secretaria

```text
/portal/secretaria
src/app/portal/secretaria/page.tsx
        |
        v
Mostra funil comercial
```

Mas tambem esta com dados simulados:

```text
src/data/dashboard.ts
```

Hoje:

```text
/portal/secretaria
        |
        v
NAO busca leads reais do banco ainda
```

Pendente: conectar com a tabela `leads`.

## Fluxo dos Conteudos Educativos

```text
Blog / conteudo educativo
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
        |
        v
LeadGate
src/components/educativo/lead-gate.tsx
        |
        v
POST /api/leads
src/app/api/leads/route.ts
```

Aqui existe um ponto importante:

```text
/api/leads ainda tenta salvar no Supabase
```

Mas o projeto atual ja tem PostgreSQL local com a tabela:

```text
educativo_leads
```

Hoje esta assim:

```text
Conteudo educativo
        |
        v
/api/leads
        |
        v
Supabase
```

Mas deveria ficar assim:

```text
Conteudo educativo
        |
        v
/api/leads
        |
        v
PostgreSQL local
        |
        v
educativo_leads
leads
```

Pendente: corrigir `/api/leads` para salvar no PostgreSQL.

## Fluxo de Pagamento Asaas

```text
Asaas envia webhook
        |
        v
/api/asaas/webhook
src/app/api/asaas/webhook/route.ts
        |
        v
Procura pagamento na tabela payments
        |
        v
Atualiza status do pagamento
        |
        v
Se pago, atualiza appointment para paid
        |
        v
Registra evento em audit_logs
```

Essa parte esta preparada, mas falta uma coisa antes:

```text
Ainda falta criar o checkout/pagamento no Asaas
```

Ou seja, o webhook recebe confirmacao, mas o sistema ainda precisa criar o pagamento inicial.

## Arquitetura Completa

```text
                  SITE PUBLICO
                src/app/page.tsx
                       |
                       v
                    /portal
                       |
      +----------------+----------------+
      |                                 |
      v                                 v
CADASTRO / LOGIN                    AREA MEDICA
PortalAccess                        /portal/medico
      |                                 |
      v                                 v
/api/auth/signup                  Dashboard visual
/api/auth/login                   AINDA SIMULADO
      |                                 |
      v                                 v
app_users                         src/data/dashboard.ts
      |
      v
PostgreSQL
nogueira_app


PACIENTE LOGADO
/portal/paciente
      |
      v
/portal/paciente/agendar
      |
      v
/api/appointments
      |
      +--> patient_profiles
      +--> patient_health_intakes
      +--> leads
      +--> appointments
      +--> lead_events


BLOG EDUCATIVO
/blog
      |
      v
LeadGate
      |
      v
/api/leads
      |
      v
HOJE: Supabase
DEVERIA: PostgreSQL


ASAAS
      |
      v
/api/asaas/webhook
      |
      +--> payments
      +--> appointments
      +--> audit_logs
```

## O Que Esta Pronto de Verdade

```text
Banco PostgreSQL rodando no Docker
Tabela app_users criada
Login conectado ao banco
Cadastro conectado ao banco
Agendamento salva dados no banco
Webhook Asaas preparado
Portal paciente existe
Portal medico existe
Portal secretaria existe
Site publico existe
Blog educativo existe
```

## O Que Esta Meio Pronto

```text
Dashboard medico existe, mas usa dados simulados
Dashboard secretaria existe, mas usa dados simulados
Tabela payments existe, mas falta criar checkout Asaas
Tabela educativo_leads existe, mas /api/leads ainda usa Supabase
```

## O Que Esta Pendente

1. Conectar `/portal/medico` ao banco real.

2. Conectar `/portal/secretaria` ao banco real.

3. Criar tela de relatorio com:

```text
total de usuarios
total de pacientes
total de consultas
total de leads
ultimos cadastros
ultimas consultas
pagamentos
```

4. Criar botao de exportar CSV/Excel.

5. Corrigir `/api/leads` para salvar no PostgreSQL, nao no Supabase.

6. Criar confirmacao de e-mail:

```text
cadastro
envia e-mail
paciente clica
email_verified_at e preenchido
login liberado
```

7. Criar checkout Asaas:

```text
paciente solicita consulta
sistema cria cobranca
paciente paga
Asaas chama webhook
pagamento muda para pago
consulta muda para paga/confirmavel
```

8. Criar autenticacao mais forte com sessao/cookie real. Hoje o login redireciona, mas ainda nao tem sessao robusta protegendo paginas.

9. Criar painel administrativo real para evitar terminal no dia a dia.

## Recomendacao de Ordem

Eu faria nesta ordem:

```text
1. Dashboard real de relatorios
2. Exportacao CSV
3. Corrigir leads educativos para PostgreSQL
4. Confirmacao de e-mail
5. Checkout Asaas
6. Protecao real das paginas logadas
```

O proximo passo mais inteligente e:

```text
Criar dashboard real usando o banco PostgreSQL
```

Assim voce para de depender do terminal e comeca a enxergar tudo por tela.
