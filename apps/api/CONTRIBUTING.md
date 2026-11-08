# apps/api — Next Journey (NestJS API)

Monorepo rules are in `../../CONTRIBUTING.md` (read it first). The API-specific rules are kept here.

## Actual stack (2026-10-09)

NestJS 12 in **ESM** (`"type": "module"`, relative imports with `.js`), TypeScript ~6.0, **Vitest** (the Nest 12 default) for tests, the monorepo ESLint for lint. See `docs/adr/0007-api-nestjs-12-esm-e-vitest.md`.

## Commands

`pnpm --filter @nextjourney/api build | start:dev | lint | typecheck | test | test:cov`

## `progression` module (`src/modules/progression/domain`)

Every progression rule lives here, as a **pure function with a test**:

- `applyCheck` (EXP, coins, level, chapter), `undoCheck`, `isOverdue`, `calculateStreak`, `localDay`, `expForLevel`, `coinsLostOnUndo`.
- **No I/O.** No database, network, `Date.now()`, `new Date()` without an argument or `Math.random()`. The date and the instant come in as arguments.
- **No Nest in the domain.** No decorator or `@nestjs/*` in `domain/`. The service calls the domain; the domain does not know the framework.
- The types (`PlayerState`, `GameConfig`, `Difficulty`...) come from `@nextjourney/contracts`. Never duplicate them.
- **Every rule change starts with a test.** Minimum 80% coverage in `domain/` (100% today); `pnpm test:cov` fails below that.
- The values (EXP, coins, chapters) come from `GameConfig` (the `game_config` table), never hard-coded.
- The ambiguous rules and how they were resolved are in `docs/adr/0004-regras-de-jogo-ambiguas.md` (and in REQUISITOS.MD, "Regras complementares").

## When controllers and services arrive (Phase 4)

Guards at controller level, input validation with the contract schemas, explicit `select` or an output DTO, logs without sensitive data, idempotent checks by `checkId`. The full checklist is in the root `CONTRIBUTING.md`.
