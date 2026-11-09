## Why

A Home precisa de um QG (cenário parado com o personagem LPC) no lugar da cena Mapa. O laboratório (`apps/banner/lab.html`, PR #18) validou 7 cenários com manhã, tarde e noite; falta levá-los ao banner de produção e à Home do app.

## What Changes

- O banner passa a suportar `INIT` com `scene: 'qg'`: `sceneKey` é o id do cenário (`cabin`, `beach`, `rooftop`, `zombie`, `castle`, `paradise`, `hell`), `timeOfDay` escolhe manhã, tarde ou noite e `character` (chaves do app) vira camadas LPC.
- `SET_TIME_OF_DAY` e `SET_CHARACTER` passam a valer no QG; `ITEM_CHECKED` faz o personagem comemorar; `CHAPTER_COMPLETED` escurece, volta e responde `CHAPTER_TRANSITION_DONE` (mesmo fluxo do Mapa, para os modais do app continuarem iguais).
- O motor do laboratório vira módulo compartilhado (`apps/banner/src/qg`), usado pelo laboratório e pelo banner. A arte entra no bundle único como data URL, só o que o app usa (parado e correndo).
- **Contrato:** `sceneKindSchema` já tem `qg`, e `INIT` já tem `sceneKey` e `timeOfDay`. Novo: `character.look` (opcional, `lpcLookSchema`) com a aparência LPC completa, guardado em `characters.look` (JSONB, migration nova) e devolvido por `GET /me`. Sem `look`, o banner usa o mapa das chaves simples.

## Impact

- `apps/banner`: motor, cena QG, mapa de chaves do app para LPC, controlador.
- `packages/contracts`, `apps/api` (campo `look`) e `apps/mobile`: Home com o QG, "Ambiente" (cenário e hora, guardados no aparelho), formulário do personagem com todas as opções do laboratório (nome por último) e créditos LPC.
- Plano: Fase 2 (banner) e Fase 6 (arte), cenário do QG.

## Segurança

Sem rede no banner, sem estado persistente, sem novas mensagens. Chave desconhecida de cenário ou de camada cai no padrão. O bundle continua abaixo de 1,5 MB (568 KB medidos).

## Fora do escopo

Cena Mapa em canvas, acessórios LPC (chapéu, espada, escudo), corpo feminino pelo título do personagem, e testes de desempenho em aparelho (Fase 2, passos 16 e 17).
