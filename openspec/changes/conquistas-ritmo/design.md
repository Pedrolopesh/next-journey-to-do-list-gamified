## Decisions

1. **Pendente mais antiga por ação.** `evaluate` grava todas as liberadas (`notified_at` nulo) e devolve, em lista de um item, a pendente mais antiga por `unlocked_at` (empate: ordem do catálogo). O app confirma com `ack`, e a próxima ação devolve a seguinte. O retroativo (silencioso) devolve o que liberou, já avisado.
2. **App ao abrir.** `usePendingAchievements` mostra só a pendente mais antiga, uma vez por usuário e sessão; as demais esperam as ações.
3. **Contadores por dia.** `estatisticasDeChecks` ganha `dailyDays`, `balancedDays` e `podiumDays`; `resumoDeHoje` fica só com `todosToday`.
4. **Nomes.** Só texto no catálogo; o seed atualiza `name` e `description` por `slug`.
