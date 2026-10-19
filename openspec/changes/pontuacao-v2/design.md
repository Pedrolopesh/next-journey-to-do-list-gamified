## Context

`expParaNivel(n)` usa `75n − 25`; `aplicarCheck` sobe de nível e conclui um capítulo por nível; `desfazerCheck` só funciona no mesmo dia, devolve EXP e moedas e é bloqueado quando o capítulo fecha. O mobile mostra o personagem pela EXP dentro do nível (`journeyView`).

## Decisions

1. **Tabela no `game_config`.** `levelExpTable: [200, 400, 600, 800, 1000]` e `undoCoinPenalty: [3, 5, 10, 15, 20]`. `expParaNivel(n)` devolve o item `min(n, tamanho)`, então do nível 5 em diante são 1000 por nível. Mesma regra para a perda de moedas (usa o capítulo atual, no máximo o último). Alternativa descartada: manter a fórmula com outros números, que não dá o controle por capítulo que o Pedro quer.
2. **Capítulo ≠ nível depois do 5.** `story.chapter` para em `chaptersPerStory` e `story.completed` fica verdadeiro; o nível segue subindo e dando o bônus de 10 moedas. O app limita a cena ao capítulo 5.
3. **Desmarcar.** `desfazerCheck` perde a trava de dia e de capítulo. Efeito: `totalChecks − 1`; EXP, nível e capítulo intactos; `coins − min(multa, coins)`. O `CheckRecord` não precisa mais de `closedChapter` para travar (o campo continua gravado).
4. **EXP uma vez por item e dia.** No check, se existe check revertido do mesmo item no mesmo dia local com `exp > 0`, o novo check grava `exp = 0` e dá as moedas normais. Sem coluna nova: a consulta usa `item_checks`. Efeito colateral aceito: no capítulo 1 um item difícil dá 4 moedas e a multa é 3, então marcar, desmarcar e marcar de novo rende +1 moeda por volta; o ganho é pequeno e vamos medir antes de endurecer.
5. **Streak e estado do item ao desfazer.** Como qualquer dia passa a valer, o desfazer recalcula `lastCheckedOn` e a sequência a partir dos checks ativos restantes (em vez de restaurar os valores guardados no check).
6. **Resultado do desfazer.** `CheckResult` volta com `expGained: 0` e `coinsGained` negativo (as moedas perdidas); o app mostra o aviso amarelo.
7. **Jornada.** Com `story.completed`, `journeyView` devolve progresso 1 e nunca portal pendente; o nível da cena é `min(level, chaptersPerStory)`.

## Risks / Trade-offs

- Usuários existentes com EXP no nível mantêm o `expInLevel` (só o teto cresce); ninguém perde nível.
- O `game_config` antigo no banco não passa no schema novo até rodar `db:seed`; o carregador falha de forma explícita.
