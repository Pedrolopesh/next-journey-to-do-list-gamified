# Progressão e regras de jogo

Código em `apps/api/src/modules/progression/domain` (funções puras, uma por regra, cada uma com teste) e `modules/achievements`. **O servidor decide a progressão**; o app nunca calcula EXP. Os valores abaixo vêm de `packages/contracts` (`DEFAULT_GAME_CONFIG`) e da tabela `game_config`, que pode ser ajustada sem publicar o app (sem registro, vale o valor inicial).

## Valores iniciais

| Item | Fácil | Médio | Difícil |
|---|---|---|---|
| EXP por check | 5 | 10 | 20 |
| Moedas por check | 1 | 2 | 4 |

- EXP para concluir cada nível: 200, 400, 600, 800 e 1000; do nível 5 em diante, 1000. Passando do fim de uma tabela, vale o último valor.
- Bônus de moedas por nível ganho: 10. Cada história tem 5 capítulos.
- Moedas perdidas ao desmarcar, por capítulo: 3, 5, 10, 15 e 20 (depois do fim, o último valor).

## Datas

"Dia" é o dia **local** do usuário (`AAAA-MM-DD`), no fuso IANA do perfil: a virada é às 00:00 nesse fuso. As funções de domínio recebem a data ou o instante como argumento e **nunca leem o relógio** (o relógio é injetado), então os testes controlam o tempo. A aritmética de datas usa UTC só como calendário. Fuso inválido lança `RangeError`.

## Marcar um item (`aplicarCheck`)

- EXP e moedas vêm da dificuldade. Hábito não tem limite diário.
- Se o item já rendeu EXP hoje (marcado, desmarcado e marcado de novo), rende **só as moedas**.
- O EXP que sobra ao subir de nível é carregado; um check pode subir mais de um nível. Cada nível ganho rende o bônus de moedas.
- Cada nível ganho conclui um capítulo da **história ativa**, até a história terminar. O progresso do capítulo é a EXP dentro do nível. Sem história ativa (onboarding incompleto) o check rende EXP e moedas, mas não conta capítulo.
- O resultado vira um registro (`item_checks`) com tudo que o check fez, que é a entrada exata do desfazer.

## Desmarcar (`desfazerCheck`)

- Vale em qualquer dia e em qualquer capítulo.
- **EXP, nível e capítulo nunca voltam**: só as moedas diminuem, pela perda do capítulo atual, nunca abaixo de zero.
- O bônus de moedas por nível não é revertido.

## Diário: atraso e sequência

- Um diário está **atrasado** quando o último dia agendado antes de hoje terminou sem check. Só conta dias a partir da criação. Marcar hoje (mesmo um atrasado) tira o atraso.
- **Sequência:** dias seguidos com check, voltando a partir de hoje. Dia agendado sem check (que não seja hoje) quebra; dias não agendados não quebram. Hoje ainda sem check não quebra (o dia não terminou). Marcar um atrasado hoje reinicia em 1.

## Conquistas

O catálogo (slugs, classes, ícones) está em `packages/contracts`; o critério de cada uma é uma função pura em `domain/achievements.ts`, e o serviço monta o contexto a partir do banco.

- **Avaliação dentro da transação** da ação (check, item, categoria, personagem ou evento do app). Cada conquista é liberada **uma só vez** (a chave primária impede duplicar).
- As de **coleção** dependem das outras: entram na volta seguinte, e o serviço repete a avaliação até estabilizar (no máximo 4 voltas).
- **Um modal por ação:** tudo que foi liberado fica pendente (`notifiedAt` nulo), mas a resposta traz só a pendente **mais antiga** (empate: ordem do catálogo). As outras aparecem, uma por vez, nas ações seguintes. O app confirma o aviso por `POST /v1/achievements/ack`, e só as conquistas do próprio usuário.
- **Retroativo** (`backfillAll`): libera, já como avisadas, o que cada usuário já cumpria, sem abrir modal.
- Os diários são avaliados numa janela de 90 dias (cobre a Chama de 30 dias e os dias perfeitos recentes); quem usa o app há mais tempo só enxerga essa janela.
- Slug que saiu do catálogo não trava a fila das válidas. A galeria mostra progresso numérico (nulo quando o critério é um evento); surpresa bloqueada não mostra o texto.
- **Itens de exemplo não contam** como criação (nem como item ativo ou anotação), mas marcar ou concluir um exemplo conta normalmente. Detalhes em `openspec/specs/starter-items/spec.md`.
