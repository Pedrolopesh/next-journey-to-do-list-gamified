# apps/api — Next Journey (API NestJS)

Regras do monorepo em `../../AGENTS.md` (leia primeiro). Aqui ficam as regras específicas da API.

## Stack real (2026-10-09)

NestJS 12 em **ESM** (`"type": "module"`, imports relativos com `.js`), TypeScript ~6.0, **Vitest** (o padrão do Nest 12) para testes, ESLint do monorepo para lint. Ver `docs/adr/0007-api-nestjs-12-esm-e-vitest.md`.

## Comandos

`pnpm --filter @nextjourney/api build | start:dev | lint | typecheck | test | test:cov`

## Módulo `progression` (`src/modules/progression/domain`)

Toda regra de progressão mora aqui, como **função pura com teste**:

- `aplicarCheck` (EXP, moedas, nível, capítulo), `desfazerCheck`, `estaAtrasado`, `calcularStreak`, `diaLocal`, `expParaNivel`, `checksParaCapitulo`.
- **Sem I/O.** Nada de banco, rede, `Date.now()`, `new Date()` sem argumento, `Math.random()`. A data e o instante entram como argumento.
- **Sem Nest no domain.** Nenhum decorator nem `@nestjs/*` em `domain/`. O service chama o domínio; o domínio não conhece o framework.
- Os tipos (`PlayerState`, `GameConfig`, `Difficulty`...) vêm de `@nextjourney/contracts`. Nunca duplicar.
- **Toda mudança de regra começa por um teste.** Cobertura mínima de 80% em `domain/` (hoje 100%); `pnpm test:cov` falha abaixo disso.
- Os valores (EXP, moedas, capítulos) vêm do `GameConfig` (tabela `game_config`), nunca fixos no código.
- As regras ambíguas e como foram resolvidas estão em `docs/adr/0004-regras-de-jogo-ambiguas.md` (e em REQUISITOS.MD, "Regras complementares").

## Quando entrarem controllers e services (Fase 4)

Guards no nível do controller, validação de entrada com os schemas do contrato, `select` explícito ou DTO de saída, logs sem dado sensível, checks idempotentes por `checkId`. Checklist completo no `AGENTS.md` da raiz.
