## Why

Hoje o capítulo 1 pede só 50 de EXP (5 checks médios) e o personagem chega ao portal cedo demais; desmarcar devolve EXP e moedas e fica preso ao mesmo dia e ao capítulo aberto. O Pedro revisou as regras na página "Moedas e EXP" do laboratório e aprovou uma pontuação mais lenta, com desmarcar livre e sem perda de EXP.

## What Changes

- **EXP por capítulo (BREAKING no `game_config`):** 200, 400, 600, 800 e 1000, no lugar da fórmula `75n − 25`. Do nível 5 em diante o nível continua subindo, com 1000 de EXP por nível; a história continua no cenário do capítulo 5.
- **Desmarcar livre:** vale em qualquer dia e em capítulo já fechado (some a trava `CHECK_LOCKED` e a regra do mesmo dia). O EXP, o nível e o capítulo nunca voltam.
- **Moedas ao desmarcar:** o usuário perde moedas por capítulo atual (3, 5, 10, 15, 20), nunca abaixo de zero. O check não devolve mais moedas.
- **EXP uma vez por item e dia:** marcar de novo, no mesmo dia, um item já desmarcado rende moedas mas 0 de EXP.
- **Avisos:** marcar sempre mostra EXP e moedas ganhos; desmarcar mostra aviso amarelo com as moedas a menos.
- **Jornada:** o personagem só chega ao portal ao fechar o capítulo; no capítulo 5 concluído ele fica no fim da cena, sem trocar de capítulo.

## Capabilities

### New Capabilities

- `scoring-rules`: EXP por capítulo, moedas, regra de desmarcar, EXP uma vez por item e dia e avisos.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de pontuação em openspec/specs/. -->

## Impact

- `packages/contracts`: `gameConfigSchema` (troca `levelExpSlope/levelExpOffset` por `levelExpTable` e `undoCoinPenalty`), `CheckResult` do desfazer.
- `apps/api`: `levels.ts`, `apply-check.ts`, `undo-check.ts` (e testes), `checks.service.ts`, seed do `game_config`, e2e.
- `apps/mobile`: toasts de marcar e desmarcar (com variante amarela), `use-check-flow`, `journey-progress`, textos em `pt-BR.json`.
- `apps/banner`: página "Moedas e EXP" do laboratório passa a ler os valores do contrato.
- Sem dependência nova e sem migration de schema: o `game_config` é JSON e o seed grava os valores novos (rodar `db:seed`).

## Segurança

- O servidor decide tudo; o app só mostra o resultado. Sem rota nova.
- Idempotência: `checkId` continua impedindo EXP duplicado; desmarcar repetido continua `CHECK_ALREADY_REVERTED`.
- Desmarcar continua exigindo que o check seja do próprio usuário (IDOR) e usa a mesma transação com trava de `user_stats`.
- Sem dado sensível em log.

## Fora do escopo

- Níveis dos cenários além do capítulo 5 e novas histórias.
- Mudar EXP e moedas por dificuldade (5/10/20 e 1/2/4) e o bônus de 10 moedas por capítulo.
