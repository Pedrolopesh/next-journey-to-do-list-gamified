## Decisions

1. **O servidor decide o que dá para desmarcar.** `lastCheckId` sai de `item_checks` (não desmarcado, `checked_on` = hoje, o mais recente por `checked_at`). Para tarefa concluída, o `checkId` vem na rota de histórico. O app mantém a lista da sessão só como reserva para checks que ainda estão na fila offline.
2. **Sem coluna nova.** A regra "o check ativo é o que não tem `reverted_at`" já existe no banco; a trava contra duplicar continua sendo o bloqueio de `user_stats` mais o `checkId` único.
3. **Paginação por instante.** `before` (ISO) e `limit` (padrão 50, máximo 100); `nextCursor` é o `completedAt` do último item quando há mais.
4. **Tarefa desmarcada volta à lista** (`completed_at` nulo) e sai do histórico, pelo mesmo desfazer de sempre.
