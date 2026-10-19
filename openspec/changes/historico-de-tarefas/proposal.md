## Why

Tarefa concluída sai da lista de tarefas e não há onde vê-la depois. Além disso, o app só consegue desmarcar o que marcou na sessão atual, porque guarda o identificador do check na memória; ao reabrir o app, a regra "desmarcar quando quiser" some. O servidor precisa ser a fonte dessa informação.

## What Changes

- **`lastCheckId` nos itens (contrato):** `GET /v1/items` passa a devolver, por item, o check de hoje que ainda vale (o mais recente não desmarcado) ou nulo. O app desmarca por ele e não depende mais da memória da sessão.
- **Histórico de tarefas:** nova rota `GET /v1/items/history` (autenticada, só do próprio usuário) devolve as tarefas concluídas, da mais recente para a mais antiga, paginada por `before` e `limit`, cada uma com o `checkId` que a concluiu.
- **Tela de histórico no Perfil:** lista as tarefas concluídas com categoria, dificuldade e data, e um botão "Desfazer" que devolve a tarefa à lista (as moedas diminuem, o EXP fica), com aviso amarelo.
- **Aviso na aba Tarefas:** rodapé informando que as tarefas concluídas ficam no histórico, em Perfil (toque abre o histórico).

## Capabilities

### New Capabilities

- `task-history`: histórico de tarefas concluídas, desfazer a partir do histórico e `lastCheckId` dos itens.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de itens em openspec/specs/. -->

## Impact

- `packages/contracts`: `itemSchema` (+`lastCheckId`), `historyItemSchema`, `historyQuerySchema`, `historyResponseSchema`.
- `apps/api`: `items.service` (lista com `lastCheckId`, `history`), `items.controller` (`GET /items/history` antes de `:id`), e2e.
- `apps/mobile`: tela `history`, entrada no Perfil, rodapé de Tarefas, `useHistory`, desfazer pelo `lastCheckId`, textos em `pt-BR.json`.
- Sem migration: a informação já está em `item_checks` (`reverted_at`, `checked_on`) e `items.completed_at`, e já existe o índice `[item_id, reverted_at]`.

## Segurança

- Rota nova protegida pelo guard global; só devolve dados do próprio usuário (filtro por `user_id`) e valida a consulta com Zod (`before` ISO, `limit` de 1 a 100).
- DTO de saída por allowlist (id, título, categoria, dificuldade, data, `checkId`); nunca o model do Prisma.
- Desfazer continua exigindo que o check seja do próprio usuário (404 caso contrário).

## Fora do escopo

- Histórico de diários e hábitos (só tarefas, que são as que somem da lista).
- Apagar definitivamente ou editar uma tarefa do histórico.
