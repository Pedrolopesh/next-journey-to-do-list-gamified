## 1. Contrato e API

- [x] 1.1 `itemSchema` com `lastCheckId`; schemas do histórico em `packages/contracts`
- [x] 1.2 `items.service`: `lastCheckId` na lista e no editar; `history` paginado
- [x] 1.3 `GET /items/history` antes de `:id`, com validação Zod
- [x] 1.4 e2e: `lastCheckId`, ordem e paginação, desfazer devolve à lista, 401, 400 e isolamento entre usuários

## 2. App

- [x] 2.1 `fetchHistory`, `useHistory` (paginado) e chave dentro de `items` para recarregar junto
- [x] 2.2 Tela `history` com desfazer (aviso amarelo), estado vazio e erro
- [x] 2.3 Entrada "Histórico de tarefas" no Perfil e rodapé na aba Tarefas
- [x] 2.4 Desfazer pelo `lastCheckId` nas listas, com a sessão como reserva da fila offline
- [x] 2.5 Textos em `pt-BR.json`

## 3. Verificação

- [x] 3.1 lint, typecheck, test, build, e2e e `security:full`
- [ ] 3.2 Conferir no emulador: concluir tarefa, ver no histórico, desfazer e reabrir o app com o item marcado
