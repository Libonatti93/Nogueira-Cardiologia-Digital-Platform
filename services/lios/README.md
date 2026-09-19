# LIOS na Nogueira Cardiologia

Núcleo derivado de `Libonatti93/LIOS` no commit
`b32d1cc8086541fcb5eeeb6e734e9601676cf5a8`. Criação e arquitetura original:
Matheus Libonatti. Licença proprietária preservada em LICENSE.

Integração: API privada FastAPI, PostgreSQL no schema `lios`, fila durável,
console Next.js e autenticação/RBAC da Nogueira. Nenhum paciente é enviado à IA.
A geração em demonstração permanece bloqueada para envio ao blog. Artigos reais
aprovados podem ser enviados como rascunho, para revisão humana no painel existente.

Consulte `../../docs/agent-context/LIOS_INTEGRATION.md` para operação e atualização.
