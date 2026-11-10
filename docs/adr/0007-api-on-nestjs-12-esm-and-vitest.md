# ADR-0007: API on NestJS 12, ESM and Vitest

- Date: 2026-10-09
- Status: accepted
- Plan phase: Phase 4, step 1 (done earlier, to unblock Phase 3)

## Context

The specification planned NestJS 11, Jest and CommonJS. The current Nest generator (`nest new`) delivers **NestJS 12**, in **ESM**, with **Vitest** and oxlint.

## Decision

- Use **NestJS 12** as generated, in **ESM** (`"type": "module"`, relative imports with `.js`).
- **Vitest** instead of Jest, the same test runner the banner and `contracts` already use (a single tool in the monorepo).
- The **monorepo's ESLint** (type-checked rules and ordered imports) instead of the generator's oxlint, to keep a single lint.
- TypeScript `~6.0` in the API (compatible with typescript-eslint, which accepts anything below 6.1).

## Consequences

- ESM makes it easier to consume `@nextjourney/contracts` without the CommonJS layer; `contracts` still emits CJS for any consumer that needs it.
- Vitest's esbuild does not emit decorator metadata: integration tests with Nest dependency injection (Phase 4) need a plugin (for example SWC). The `domain/` tests are not affected (pure functions).
- The minimum 80% coverage on `domain/` is enforced by `vitest.config.ts` itself.
