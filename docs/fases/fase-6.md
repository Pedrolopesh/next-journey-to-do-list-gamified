# Fase 6 — Conteúdo: registro parcial

- Início: 2026-10-09
- Status: código e arte do QG (Home) concluídos; Mapa em canvas, acessórios LPC, roteiro final e teste em aparelho pendentes

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Formato de dados do conteúdo (`Story`, `Chapter`) no contrato | feito na Fase 5; agora coberto por teste do seed (`seed-data.spec.ts`) |
| 2 | Roteiro de cada capítulo em pt-BR | provisório: 25 textos curtos no seed; o roteiro final é trabalho de redação |
| 3 | Arte por bioma (parallax, miniaturas, ícones) em estilo LPC | parcial: o QG (Home) tem 7 cenários com manhã, tarde e noite; a cena Mapa segue com placeholders SVG originais |
| 4 | Sprites completos do personagem (spritesheets por categoria) | parcial: corpo, cabelo, roupa de cima, calça e calçado em LPC; faltam acessórios |
| 5 | Conteúdo cadastrado por seed versionado | feito (`apps/api/prisma/seed-data.ts`) |
| 6 | `CREDITS.md` e tela "Créditos" | feito; a tela lista a arte LPC (gerada por `apps/banner/scripts/export-credits.mjs`) e um teste barra licença fora de MIT, CC0, OGA-BY e CC-BY |
| 7 | Script de validação de assets | feito: `apps/banner/scripts/validate-assets.mjs` roda no `build` (e no CI) |
| 8 | Testar as 5 histórias no banner em aparelho físico | pendente (depende da arte e do aparelho) |
| 9 | Limite de peso do banner | feito: 1,5 MB para o `index.html` único; conferido a cada build |

## Limites validados no build

- `index.html` do banner: até 1.500.000 bytes.
- Cada arquivo de arte em `src/assets`: até 60.000 bytes.
- Cada SVG: até 16 cores distintas (paleta LPC).

Mudar um limite exige registrar o motivo no ADR-0003.

## Como importar arte LPC

1. Rode `apps/banner/scripts/import-lpc.mjs` com `LPC_GENERATOR` e `LPC_BASE` apontando para os clones do gerador de personagens e do pacote base. Ele só traz camadas com licença permissiva e gera `apps/banner/lab/catalog.json`, `apps/banner/lab/assets/**` e `apps/banner/lab/CREDITS-LPC.md`.
2. Rode `node apps/banner/scripts/export-credits.mjs` para atualizar a tela Créditos e as cores de exemplo do app.
3. Rode `pnpm --filter @nextjourney/banner build`: o validador confere o peso do bundle.
4. Confira a licença contra a distribuição nas lojas antes de congelar a arte.

Arte de cena, props e personagens desenhados em código (`apps/banner/src/qg/scenes`) são do projeto e não precisam de crédito de terceiros.
