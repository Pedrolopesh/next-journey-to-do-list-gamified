# Itens, categorias e checks

Código em `apps/api/src/modules/items` e `modules/categories`. As regras de EXP e moedas estão em [progressao-e-jogo.md](progressao-e-jogo.md).

## Itens

- Três tipos: diário (tem frequência, em dias da semana 0 a 6), tarefa (prazo opcional) e hábito. O **tipo nunca muda**; frequência só em diário e prazo só em tarefa.
- A lista (`GET /v1/items`) já vem com o estado do dia: feito, atrasado, sequência e contadores. Tarefa concluída sai da lista e vai para o histórico.
- O usuário só usa **as próprias categorias** (proteção contra IDOR): categoria de outra pessoa é `404`.
- **Exclusão lógica**: o histórico de EXP é mantido (RF-16).
- **Histórico** (`GET /v1/items/history`): tarefas concluídas, da mais recente para a mais antiga, só do próprio usuário, paginado por `before` (instante de conclusão). A rota é declarada antes de `:id` para não ser lida como id.
- **Itens de exemplo:** criados pelo servidor quando a conta passa a valer (`items/starter-items.ts` e `StarterItemsService`), uma vez, só para conta sem itens. Exemplo não incrementa `items_created`.
- Excluir uma categoria com itens ativos exige a categoria de destino (`moveTo`).

## Marcar (`POST /v1/items/:id/checks`)

Uma **única transação**: valida, grava o check, atualiza EXP, nível e moedas, o capítulo da história ativa, a sequência do diário e as conquistas.

- **Idempotente por `checkId`** (UUID gerado pelo app): repetir devolve exatamente o mesmo resultado, sem duplicar EXP (com as conquistas, na primeira resposta).
- **Serializado por usuário:** a ação trava a linha de estatísticas do usuário ativo. Uma chamada concorrente com o mesmo `checkId` espera e, ao entrar, já enxerga o check gravado pela primeira.
- **EXP uma vez só** quando o item é desmarcado e marcado de novo: as moedas são rendidas, o EXP não. Tarefa vale **uma vez na vida** (desmarcar em outro dia não libera o EXP de novo); diário e hábito, **uma vez por dia** (o dia seguinte é um check novo de verdade).
- Os capítulos concluídos (um por nível ganho) são gravados e a resposta traz o modal do último (RF-28).
- O check é gravado **antes** da avaliação das conquistas, para que as de equilíbrio e chama enxerguem este check.

## Desmarcar (`DELETE /v1/items/:id/checks/:checkId`)

Em qualquer dia e capítulo. EXP, nível e capítulo ficam como estão; só as moedas diminuem (perda do capítulo atual, nunca abaixo de zero). A sequência e os dias com check são recalculados pelo que restou de checks ativos.
