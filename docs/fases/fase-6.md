# Fase 6 — Conteúdo: registro parcial

- Início: 2026-10-09
- Status: parte de código concluída; arte final e teste em aparelho dependem de produção externa

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Formato de dados do conteúdo (`Story`, `Chapter`) no contrato | feito na Fase 5; agora coberto por teste do seed (`seed-data.spec.ts`) |
| 2 | Roteiro de cada capítulo em pt-BR | provisório: 25 textos curtos no seed; o roteiro final é trabalho de redação |
| 3 | Arte por bioma (parallax, miniaturas, ícones) em estilo LPC | pendente: segue com placeholders SVG originais |
| 4 | Sprites completos do personagem (spritesheets por categoria) | pendente |
| 5 | Conteúdo cadastrado por seed versionado | feito (`apps/api/prisma/seed-data.ts`) |
| 6 | `CREDITS.md` e tela "Créditos" | feito; lista de LPC vazia até a primeira importação |
| 7 | Script de validação de assets | feito: `apps/banner/scripts/validate-assets.mjs` roda no `build` (e no CI) |
| 8 | Testar as 5 histórias no banner em aparelho físico | pendente (depende da arte e do aparelho) |
| 9 | Limite de peso do banner | feito: 1,5 MB para o `index.html` único; conferido a cada build |

## Limites validados no build

- `index.html` do banner: até 1.500.000 bytes.
- Cada arquivo de arte em `src/assets`: até 60.000 bytes.
- Cada SVG: até 16 cores distintas (paleta LPC).

Mudar um limite exige registrar o motivo no ADR-0003.

## Como importar um asset LPC

1. Coloque o arquivo em `apps/banner/src/assets`.
2. Adicione uma linha no `CREDITS.md` e uma entrada em `apps/mobile/src/features/credits/credits.ts`.
3. Rode `pnpm --filter @nextjourney/banner build`: o validador confere peso e paleta.
4. Confira a licença contra a distribuição nas lojas antes de congelar a arte.
