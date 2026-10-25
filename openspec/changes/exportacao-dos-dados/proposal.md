## Why

A LGPD dá à pessoa o direito de acessar os dados que o serviço guarda sobre ela. Hoje o app não tem como entregar isso: não existe rota de exportação. Também falta um documento claro de privacidade e retenção (o que é guardado, por quanto tempo e como pedir a exclusão), exigido pelas lojas.

## What Changes

- Nova rota autenticada `GET /v1/me/export`: devolve um JSON com os dados da própria conta (perfil, progresso, personagem, categorias, itens, checks, conquistas, itens cosméticos e histórias), montado por lista de campos permitidos. Nunca devolve hash de senha, tokens, códigos nem dados de outras contas.
- Limite de 3 pedidos por hora por conta (`429`) e um evento de segurança `data_exported` no log.
- App: botão "Exportar meus dados" em Configurações, que abre a folha de compartilhamento com o JSON (carregando e toast, RN-FB).
- Documento público `docs/PRIVACIDADE.md`: dados guardados, prazos de retenção (conta excluída, cadastro não confirmado, tokens, contadores, logs), exportação e exclusão. O plano de resposta a incidente fica em nota privada.

## Capabilities

### New Capabilities

- `data-export`: exportação dos dados da própria conta.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de privacidade em openspec/specs/. -->

## Impact

- `packages/contracts`: `dataExportSchema`.
- `apps/api`: serviço e rota de exportação, evento de segurança, testes e2e.
- `apps/mobile`: botão em Configurações, `endpoints.ts`, `pt-BR.json`, teste de componente.
- Docs: `PRIVACIDADE.md`, `SEGURANCA.md`.

## Segurança

- IDOR: toda consulta filtra por `userId` do token; nada de id vindo do cliente.
- Lista de campos permitidos por tabela; hash de senha, tokens de sessão, códigos e contadores ficam de fora.
- Limite por conta e evento de segurança; o arquivo contém o e-mail da pessoa e não é registrado em log.

## Fora do escopo

- Formato de portabilidade além de JSON, exportação por e-mail e histórico de logs.
- Correção/atualização de dados pela própria pessoa além do que o app já permite.
