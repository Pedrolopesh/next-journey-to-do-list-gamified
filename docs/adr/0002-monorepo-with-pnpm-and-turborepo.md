# ADR-0002: monorepo with pnpm + Turborepo

- Date: 2026-10-02
- Status: accepted
- Plan phase: Phase 1, step 14

## Context

The project has three parts (API, banner and app) that share the same data formats (Zod contracts). With separate repositories, the contracts would have to become a versioned npm package, and a contract change would only break the consumers after being published.

## Decision

A **single monorepo**, with **pnpm workspaces** (`apps/*`, `packages/*`, scope `@nextjourney/*`) and **Turborepo** to order, parallelize and cache the tasks (`build`, `lint`, `typecheck`, `test`, `dev`). Configuration and behavior are in `docs/TURBOREPO.md`.

## Consequences

- A changed schema breaks the typecheck of the API, the app and the banner **in the same PR**, not in production.
- One place for lint, formatting, hooks and CI.
- `packages/contracts` needs a build (tsup, ESM + CJS), because NestJS runs in CommonJS and does not read TypeScript from inside `node_modules`; Metro and Vite read the TypeScript directly.
- More initial setup (Metro with pnpm, Turbo cache in CI) in exchange for not duplicating types.
- Turbo's remote cache stays optional, for later.
