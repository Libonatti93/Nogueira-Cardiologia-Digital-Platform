# CRM operacional — entrega de 12/10/2026

Esta evolução reaproveita a aplicação em produção, PostgreSQL, autenticação local,
RBAC e tabelas existentes. Não cria outro sistema, banco ou identidade de paciente.
Painel: https://painel.nogueiracardiologia.com.br/crm.

## Estado encontrado e preservação

A auditoria inicial encontrou VPS e GitHub no commit `2e4fdda`, sem divergência,
CRM com cinco colunas, cadastro completo de pacientes e agendamento básico.
Havia 3 leads, 28 eventos, 12 usuários, 4 arquivos de exames e um compromisso
privado; nenhuma consulta, cobrança ou ficha em `patient_profiles`.
As migrations históricas 001–013 foram preservadas, inclusive os dois arquivos 004.
O runner mantém o registro por nome/checksum de 007 em diante.

Backup inicial: `/opt/nogueira-postgres/backups/*2026-10-12-160211*`, incluindo
arquivos privados. Checkpoint Git e código interrompido:
`/root/nogueira-checkpoints/crm-20261012/`. O deploy faz outro backup imediatamente
antes das migrations. Dados e histórico não são apagados.

## Arquitetura e mudanças

- `patient_profiles`: central de pessoas, inclusive contatos sem conta no portal.
  Nome, telefone e origem bastam para começar; nascimento, sexo, idade calculada,
  endereço/CEP e medicamentos declarados continuam disponíveis. Acrescentados
  convênio, indicação, responsável, tags, relacionamento e informação de falecimento.
- `leads`: oportunidades ligadas à pessoa. `pipeline_stage` é o funil operacional;
  o enum antigo `stage` permanece para integrações e financeiro. Todo cartão ativo
  tem tarefa pendente com descrição e data, inclusive entradas pelo código legado.
- `appointments`: única fonte de consultas. `care_status` separa atendimento de
  pagamento, com duração, modalidade e observações administrativas. Alteração
  financeira não reabre uma consulta realizada nem reinicia seu POP.
- `internal_calendar_events`: compromissos da equipe na mesma agenda; somente
  `crm_visible=true` aparece para atendimento. Compromissos privados ficam privados.
  Bloqueios vinculados a profissional impedem consultas sobrepostas.
- `lead_events` e `audit_logs`: histórico e autoria. Os registros anteriores ficam
  preservados. Auditoria administrativa não copia medicamentos ou credenciais.
- `crm_tasks`: tarefas, responsáveis, prazos, prioridade, conclusão e resultado.
  `crm_exam_followups`: exames solicitados/realizados e retorno indicado/agendado,
  sem presumir prazo médico.

A aplicação valida permissões novamente dentro da transação. Triggers protegem
horários, vínculo pessoa/oportunidade, próxima ação e falecimento também quando
a escrita vem das rotas antigas. Reservas concorrentes do mesmo profissional são
serializadas; sobreposição é recusada. O checkout retorna 409 para conflito antes
de iniciar uma cobrança e reutiliza contato sem CPF quando nome, telefone e e-mail
identificam uma única pessoa compatível.

## Funil e acessos

1. Entrada / Base
2. Conexão
3. Negociação
4. Prospecção / Follow-up
5. Orçamento / Condições
6. Agendamento
7. Aguardando consulta
8. Consulta realizada
9. Pós-venda / POP 1

Perdido, frio/inativo e falecido são filtros/status auxiliares. Cartões mostram
telefone, origem, responsável, tempo na etapa, última interação e próxima ação,
com destaque de atraso. Arrastar ou selecionar uma etapa persiste a mudança;
um conflito com atualização de outro usuário solicita recarregar.

`CRM_OPERATOR` aparece como Atendimento / Secretaria e tem somente Agenda,
Contatos / Pacientes e CRM no menu principal. Novos funcionários recebem o perfil
pelo IAM existente, sem cadastrar e-mail no código. Não recebe financeiro, exames
técnicos, notícias, clima, conteúdo, LIOS, IAM ou indicadores gerenciais.

MASTER entra no mesmo CRM, com os mesmos registros. Mantém os módulos anteriores,
auditoria e o botão Indicadores da operação, com conversões, etapas, origem,
produtividade, perdas, atrasos, reativações e POP. Filtros por período, responsável,
origem, etapa e relacionamento. Conversões usam a coorte de contatos criada no
período; produtividade usa a data das interações. Telas visíveis atualizam a cada
10 segundos e ao recuperar foco. Não há base duplicada.

## Automação e condições comerciais

Marcar consulta realizada cria exatamente uma tarefa de cada tipo: D+3 (satisfação),
D+6 (exames) e D+180 (continuidade). Prazos contam de `completed_at` em Brasília;
se não informado ao concluir, usa o momento atual. Concluir a primeira tarefa POP
leva a oportunidade para Pós-venda. Reabrir consulta cancela as tarefas POP ainda
pendentes, preservando tarefas e interações já concluídas.

Pacientes com consulta anterior e de seis meses a três anos sem consulta/contato
relevante podem entrar na recuperação. Contato 2 ocorre 20 dias após concluir o
primeiro sem agendamento; contato 3, mais 20 dias após concluir o segundo. Depois
do terceiro sem conversão, encerra a régua e marca frio/inativo. A automação não
reinscreve indefinidamente uma régua encerrada. Novo agendamento cancela contatos
de recuperação pendentes e registra conversão.

`scripts/crm-automation.mjs` qualifica elegíveis a cada cinco minutos pelo cron
`/etc/cron.d/nogueira-crm-automation`, instalado pelo deploy. As tarefas persistem
no banco sem navegador aberto. Logs: `/var/log/nogueira-crm-automation.log`.
O mecanismo gera tarefas para a equipe; não envia WhatsApp, campanhas ou ligações.

Falecimento exige origem da informação, aceita data/observação e cancela tarefas
pendentes. Comunicações e novas réguas/agendamentos ficam bloqueados; o histórico
permanece consultável. Somente MASTER pode corrigir esse status.

Consulta: **R$ 700,00**, Pix, dinheiro na clínica ou cartão em 1x. Atualizados
fallback Asaas, exemplo de ambiente, ambiente local, checkout e faixa pública.
Retirada a propaganda de desconto automático. Pagamentos antigos não são alterados.
O playbook explica honorários particulares e uso de convênio para exames e outros
procedimentos somente conforme cobertura, autorização e indicação.

## Migrations e arquivos principais

- `014_operational_crm.sql`: campos aditivos, tarefas, acompanhamento de exames,
  mapeamento dos estados, tarefas iniciais, POP, recuperação e permissões.
- `015_crm_integrity.sql`: reaproveitamento de pessoa no legado, vínculo de eventos,
  cancelamento por ciclo de vida, bloqueios de agenda e histórico de pagamento.
- `016_crm_workflow_fixes.sql`: correções verificadas nos testes de automação,
  separação de status financeiro/operacional, reativação e auditoria de tarefas.

014/015 já haviam sido aplicadas no banco isolado antes da interrupção; seus
checksums foram preservados. 016 corrige funções sem reescrever migrations aplicadas.
O runner aplica cada migration em transação e verifica idempotência por checksum.

Implementação principal em `apps/web/src/lib/crm-workspace.ts`,
`crm-workflow.ts`, `src/components/internal/crm-{console,forms,person-detail,playbook,model}`,
`src/app/api/internal/crm/route.ts`, `src/lib/panel-policy.ts`, `governance.ts`,
`src/app/api/appointments/route.ts`, checkout/Asaas e scripts de migration/deploy/smoke.

## Roteiro para a equipe testar

1. **Atendente:** entrar com a conta existente. Conferir somente os três menus.
   Tentar `/governanca` e confirmar a recusa de acesso.
2. **Contatos:** Novo contato → nome, telefone, origem → salvar. Completar os
   campos opcionais depois. A pessoa deve aparecer na central e no Kanban.
3. **CRM:** arrastar Entrada para Conexão, recarregar e conferir a etapa e Timeline.
   Registrar ligação ou objeção informando obrigatoriamente próxima ação/data.
4. **Hoje:** uma tarefa com prazo vencido aparece em Atrasadas; as futuras aparecem
   em Próximas. Abrir o contato permite consultar e concluir tarefas com resultado.
5. **Agenda:** testar Dia/Semana/Mês, criar consulta presencial/online, editar,
   reagendar e cancelar. Tentar horário sobreposto do mesmo médico: deve recusar.
6. **D+3/D+6/D+180:** editar consulta para Consulta realizada. Abrir Tarefas e
   conferir três prazos a partir da realização. Salvar novamente não duplica POP.
   Concluir D+3 com resultado; D+6 e D+180 permanecem. Não é necessário aguardar
   meses para conferir os prazos; testes automatizados usam dados fictícios.
7. **Pós-exames:** no detalhe → Agenda → Exames e retorno, registrar pedidos,
   realizados, data e orientação médica; vincular a consulta de retorno quando houver.
8. **Frio:** usar paciente de teste com consulta realizada há 220 dias, sem contato
   recente. Iniciar recuperação; concluir cada tentativa como Sem resposta e
   conferir 20 dias + 20 dias. Após o terceiro, status frio e régua encerrada.
9. **Falecido:** em contato de teste → Dados → Relacionamento, informar falecimento
   e origem. Conferir tarefas canceladas, comunicações bloqueadas e Timeline intacta.
10. **Dr. Paulo:** acessar o mesmo contato/consulta pela conta MASTER. Abrir
    Indicadores da operação e a auditoria; mudanças da atendente aparecem na mesma base.

Não usar pacientes reais para simular falecimento ou conclusão de consultas.

## Validação técnica e operação

Testes específicos:

```sh
node --env-file=.env.test scripts/migrate.mjs
node --env-file=.env.test --import tsx tests/crm-operational.integration.ts
node --env-file=.env.test --import tsx tests/http.integration.ts
PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs node --env-file=.env.test tests/crm-workspace.browser.mjs
npm test
npm run lint
npm run typecheck
NEXT_DIST_DIR=.next-verification RELEASE_SHA=verification npm run build
```

O teste HTTP requer LIOS isolada em 127.0.0.1:8082; não usar o serviço de produção.
O navegador usa apenas identidades fictícias e remove seus próprios dados ao final.
Evidências visuais: `/tmp/nogueira-crm-operational/`.
O novo teste de navegador cobre a interface de nove etapas; os scripts de interface
anteriores documentam o modelo antigo de cinco etapas e não são critérios desta versão.

Deploy oficial: commit/push e `node scripts/deploy.mjs`. Exige árvore limpa, SHA
igual ao GitHub, build separado, backup e smoke. Valida TLS do painel, páginas e
APIs MASTER/operacionais e identificação do artefato. Resultado por release:
`/var/log/nogueira-deploy-<SHA>.json`. Runtime anterior fica em `.runtime.env.previous`;
migrations aditivas e dados não são revertidos por rollback do código.

## Dependências externas

O Supabase do portal de pacientes já estava indisponível por DNS antes desta
entrega; restauração exige administração do provedor. Login interno permanece
independente. Asaas não foi exercitado com cobrança real. LIOS continua em modo
demonstração sem chave de IA real. A geração de tarefas CRM não depende desses
serviços externos. Mensagens e ligações são feitas pela equipe, com registro no CRM.
