# ADR-0004: regras de jogo ambíguas e como foram resolvidas

- Data: 2026-10-09
- Status: **proposta** (implementada em `apps/api/src/modules/progression/domain`; aguardando a confirmação do Pedro)
- Fase do plano: Fase 3, passo 12

## Contexto

A especificação deixava casos de borda em aberto. As soluções abaixo estavam em "Regras complementares" de `docs/REQUISITOS.MD` como propostas. Para não travar a Fase 3, foram **implementadas como estão e cobertas por testes**; se alguma for alterada, o teste correspondente muda junto.

## Decisão (como cada ponto está implementado)

**Nível, EXP e moedas**
- EXP de um nível n para n+1 = `75n − 25`. O EXP que sobra ao subir de nível é carregado; um check pode subir mais de um nível (`niveisGanhos`).
- Cada nível ganho rende o bônus de 10 moedas (`bonusMoedas`, separado das moedas do check).
- Hábito sem limite diário: todo check rende EXP, moedas e um passo do capítulo. Diário, tarefa e hábito rendem igual (só a dificuldade importa).

**Capítulos e história**
- Checks do capítulo n = `min(10 + 5(n−1), 40)`. O check que atinge o necessário fecha o capítulo e o próximo começa em 0.
- O capítulo 5 fecha a história (`completed`): os checks seguem rendendo EXP e moedas, mas não contam para capítulo (`countsForChapter = false`).
- O progresso de capítulo é por história; EXP, nível e moedas são globais. O domínio recebe o progresso da história ativa; a API garante que é o da história certa.

**Desfazer**
- Só no mesmo dia local do check (`OUTRO_DIA`); a API traduz para `UNDO_NOT_ALLOWED`.
- **Capítulo fechado é definitivo** (`CAPITULO_FECHADO`, API: `CHECK_LOCKED`): o check que fechou o capítulo e os de capítulos já fechados não voltam.
- O nível nunca cai: o EXP para em 0 do nível atual (devolve só o que cabe). O bônus de moedas por nível não é revertido. Moedas e contadores nunca ficam negativos.
- Item excluído: seus checks não podem mais ser desmarcados (regra da API, fora do domínio).

**Diários**
- **Atrasado:** o último dia agendado antes de hoje (a partir da criação do diário) terminou sem check. Um diário criado hoje só atrasa depois que um dia agendado termina. Marcar hoje, mesmo um atrasado, tira o atraso.
- **Sequência:** dias seguidos com check, voltando a partir de hoje. Dia agendado sem check (que não seja hoje) quebra; dia não agendado não quebra; hoje sem check ainda não quebra. Marcar um atrasado hoje reinicia em 1.
- Dia local = data no fuso IANA do perfil, com virada às 00:00 (`diaLocal`, usando `Intl`; testado com horário de verão e virada de mês e de ano).

## Ainda a implementar (Fase 4 e 5)

Conquistas (critérios do catálogo), resumo semanal, contador semanal do hábito e a transação do check na API. Ficam fora do domínio puro de `aplicarCheck`.

## Consequências

- As regras podem mudar sem tocar em controllers: basta alterar a função e o teste.
- Se o Pedro alterar alguma regra, este ADR é substituído por um novo (ADRs aceitos não são editados).
