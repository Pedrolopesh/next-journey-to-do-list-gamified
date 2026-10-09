# ADR-0002: monorepo com pnpm + Turborepo

- Data: 2026-10-02
- Status: aceita
- Fase do plano: Fase 1, passo 14

## Contexto

O projeto tem três partes (API, banner e app) que compartilham os mesmos formatos de dados (contratos Zod). Com repositórios separados, os contratos teriam de virar um pacote npm versionado, e uma mudança de contrato só quebraria os consumidores depois de publicada.

## Decisão

Um **monorepo único**, com **pnpm workspaces** (`apps/*`, `packages/*`, escopo `@nextjourney/*`) e **Turborepo** para ordenar, paralelizar e cachear as tarefas (`build`, `lint`, `typecheck`, `test`, `dev`). Configuração e funcionamento em `docs/TURBOREPO.md`.

## Consequências

- Um schema alterado quebra o typecheck de API, app e banner **no mesmo PR**, e não em produção.
- Um só lugar para lint, formatação, hooks e CI.
- O `packages/contracts` precisa de build (tsup, ESM + CJS), porque o NestJS roda em CommonJS e não lê TypeScript de dentro de `node_modules`; o Metro e o Vite leem o TypeScript direto.
- Mais configuração inicial (Metro com pnpm, cache do Turbo no CI) em troca de não duplicar tipos.
- Cache remoto do Turbo fica opcional, para depois.
