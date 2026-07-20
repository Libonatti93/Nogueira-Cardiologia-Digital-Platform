# App Mobile e Notificacoes Push - Planejamento

Este documento registra a arquitetura proposta para transformar a plataforma digital da Nogueira Cardiologia em app instalavel e, em uma etapa posterior, publicar nas lojas com notificacoes push para pacientes.

## Objetivo

Criar uma estrategia progressiva para:

- permitir instalacao da plataforma no celular;
- publicar app na Google Play e Apple App Store;
- enviar notificacoes push com consentimento do usuario;
- manter o portal do paciente, central de exames, conteudos educativos e agendamento conectados;
- preservar seguranca, LGPD e revisao medica adequada.

## Decisao Recomendada

O caminho recomendado e em fases:

```text
Fase 1: PWA instalavel
Fase 2: App hibrido com Capacitor
Fase 3: Notificacoes push com OneSignal ou Firebase
Fase 4: Publicacao Google Play
Fase 5: Publicacao Apple App Store
```

Nao iniciar por app nativo puro neste momento, porque aumentaria custo, tempo e manutencao antes de validar a operacao digital com pacientes reais.

## Opcoes Tecnicas

### 1. PWA

PWA significa Progressive Web App. O site continua sendo acessado pelo navegador, mas pode ser instalado na tela inicial do celular.

Vantagens:

- baixo custo;
- entrega rapida;
- aproveita o site atual;
- bom para validar experiencia mobile;
- funciona bem em Android.

Limitacoes:

- nao aparece como app tradicional na App Store;
- notificacoes no iPhone possuem mais restricoes;
- depende mais do navegador;
- menor percepcao de app premium.

### 2. App hibrido com Capacitor

Capacitor permite empacotar a plataforma web atual como app para Android e iOS.

Vantagens:

- reaproveita o sistema atual;
- permite publicar nas lojas;
- permite notificacoes push mais confiaveis;
- menor custo que app nativo completo;
- bom equilibrio entre velocidade e experiencia.

Limitacoes:

- precisa criar builds Android/iOS;
- precisa contas de desenvolvedor;
- passa por revisao das lojas;
- precisa manutencao de versoes.

### 3. App nativo completo

App criado especificamente com React Native, Flutter, Swift ou Kotlin.

Vantagens:

- experiencia mobile mais refinada;
- maior controle tecnico;
- melhor acesso a recursos nativos.

Limitacoes:

- maior custo;
- maior tempo;
- manutencao mais complexa;
- nao recomendado como primeiro passo neste momento.

## Arquitetura Proposta

```text
Paciente
   |
   v
App Nogueira Cardiologia
   |
   +--> Portal do paciente
   +--> Agendamento
   +--> Central de exames
   +--> Conteudos educativos
   +--> Notificacoes
   |
   v
Next.js / Plataforma Web
   |
   +--> APIs internas
   +--> Autenticacao
   +--> Dashboard medico/admin
   |
   v
PostgreSQL
   |
   +--> app_users
   +--> appointments
   +--> patient_exam_uploads
   +--> leads
   +--> notifications
   +--> push_subscriptions
```

## Arquitetura de Notificacoes

```text
Paciente instala o app
        |
        v
App pede permissao de notificacao
        |
        v
Paciente aceita
        |
        v
App gera token do dispositivo
        |
        v
API salva token no banco
        |
        v
Sistema ou n8n dispara evento
        |
        v
OneSignal/Firebase envia push
        |
        v
Paciente recebe notificacao no celular
```

## Exemplos de Notificacoes

- Sua consulta foi solicitada com sucesso.
- Sua consulta foi confirmada.
- Lembrete: sua consulta e amanha.
- A secretaria enviou uma atualizacao.
- Seu exame foi recebido pela equipe.
- Dr. Paulo adicionou uma orientacao ao seu exame.
- Novo conteudo educativo disponivel.
- Pagamento pendente para concluir o agendamento.

## Ferramentas Possiveis

### OneSignal

Mais simples para comecar.

Vantagens:

- painel amigavel;
- boa documentacao;
- integra bem com Android/iOS;
- permite segmentacao;
- bom para operacao de marketing e relacionamento.

Ponto de atencao:

- planos e limites podem variar com volume de usuarios e recursos.

### Firebase Cloud Messaging

Mais tecnico e robusto.

Vantagens:

- muito usado em apps Android;
- sem custo inicial relevante para push;
- integra bem com infraestrutura Google;
- flexivel para desenvolvedores.

Ponto de atencao:

- painel menos amigavel para operacao nao tecnica;
- Apple ainda exige APNs para iOS.

### Apple Push Notification Service

Servico obrigatorio para notificacoes nativas em iPhone/iPad.

Ponto de atencao:

- exige conta Apple Developer ativa.

## Estrutura de Banco Sugerida

### push_subscriptions

```text
id
user_id
platform
provider
device_token
device_name
is_active
permission_granted_at
last_seen_at
created_at
updated_at
```

### notifications

```text
id
user_id
title
body
category
status
provider
provider_message_id
sent_at
read_at
metadata
created_at
```

### notification_preferences

```text
id
user_id
appointments_enabled
exams_enabled
educational_content_enabled
payments_enabled
marketing_enabled
updated_at
```

## Fluxo com n8n

```text
Evento no sistema
   |
   +--> consulta criada
   +--> exame recebido
   +--> pagamento pendente
   +--> conteudo novo publicado
   |
   v
Webhook n8n
   |
   v
n8n aplica regra
   |
   +--> qual usuario?
   +--> qual mensagem?
   +--> pode notificar?
   +--> horario adequado?
   |
   v
OneSignal/Firebase
   |
   v
Push no celular
   |
   v
Registro em notifications
```

## Requisitos LGPD

Antes de ativar notificacoes, e necessario:

- consentimento claro do usuario;
- preferencia para ativar/desativar categorias de notificacao;
- politica de privacidade atualizada;
- registro de quando o usuario aceitou;
- evitar expor dado sensivel no texto da notificacao;
- permitir revogacao da permissao;
- registrar logs de envio.

Exemplo correto:

```text
Seu exame foi recebido pela equipe.
```

Evitar:

```text
Seu exame de alteracao cardiaca X foi analisado.
```

## Custos Estimados

### Google Play

```text
Conta Google Play Developer: US$ 25 pagamento unico
```

### Apple App Store

```text
Apple Developer Program: US$ 99 por ano
```

### OneSignal

```text
Pode ter plano gratuito ou planos pagos conforme volume/recursos.
Confirmar precos no momento da contratacao.
```

### Firebase

```text
Firebase Cloud Messaging geralmente nao tem custo direto de push.
Custos podem aparecer em outros servicos Firebase se forem usados.
```

### Desenvolvimento

Estimativa tecnica inicial:

```text
PWA: 1 a 3 dias uteis
Capacitor Android: 3 a 7 dias uteis
Capacitor iOS: 5 a 10 dias uteis
Push notifications: 5 a 10 dias uteis
Publicacao Google Play: 2 a 7 dias de revisao
Publicacao Apple App Store: 2 a 14 dias de revisao
```

Tempo total estimado para primeira versao nas lojas:

```text
3 a 6 semanas
```

Esse prazo pode variar conforme aprovacoes das lojas, criacao das contas, revisoes da Apple, ajustes de politica de privacidade e materiais visuais exigidos.

## Itens Necessarios Para Publicar

### Identidade visual

- nome do app;
- icone em alta resolucao;
- screenshots do app;
- descricao curta;
- descricao completa;
- categoria;
- classificacao etaria;
- URL da politica de privacidade.

### Dados institucionais

- CNPJ;
- razao social;
- endereco;
- telefone;
- email de suporte;
- responsavel pela conta das lojas.

### Apple

- conta Apple Developer;
- acesso ao Apple Developer e App Store Connect;
- certificados;
- profiles;
- revisao da Apple.

### Google

- conta Google Play Developer;
- app bundle Android;
- politica de privacidade;
- formulario de seguranca de dados;
- classificacao de conteudo.

## Riscos e Pontos de Atencao

- Apple pode rejeitar apps que sejam apenas uma pagina web sem valor nativo suficiente.
- Notificacoes de saude nao devem revelar dados sensiveis na tela bloqueada.
- Paciente precisa aceitar notificacoes.
- E preciso manter canal para desativar preferencia.
- Mudancas importantes no app exigem novas builds e revisao das lojas.
- App com finalidade diagnostica pode exigir analise regulatoria mais rigorosa.

## Proposta de Primeira Versao

Primeira versao do app:

- login do paciente;
- portal do paciente;
- solicitacao de consulta;
- central de exames;
- conteudos educativos;
- WhatsApp da clinica;
- notificacoes basicas de consulta e exame recebido;
- politica de privacidade integrada.

Nao incluir na primeira versao:

- diagnostico por IA;
- recomendacao automatica de conduta;
- PACS completo;
- visualizador DICOM avancado;
- prescricao digital.

## Aprovacao Necessaria

Antes de iniciar a implementacao, alinhar com Dr. Paulo:

- se a clinica quer app nas lojas agora ou primeiro PWA;
- nome oficial do app;
- responsavel pela conta Apple/Google;
- orcamento anual da Apple;
- consentimento e politica de notificacoes;
- tipos de notificacao permitidos;
- nivel de exposicao de dados de saude;
- prioridade entre Android, iOS ou ambos.

## Recomendacao Final

Comecar com:

```text
PWA + preparacao para Capacitor
```

Depois evoluir para:

```text
Capacitor + OneSignal
```

E publicar primeiro:

```text
Google Play
```

Depois:

```text
Apple App Store
```

Motivo: Android costuma ser mais rapido para validar, enquanto Apple exige mais cuidado de aprovacao e experiencia nativa.
