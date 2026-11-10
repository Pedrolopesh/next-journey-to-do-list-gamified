# ADR-0005: pnpm, TypeScript and ESLint configuration versions

- Date: 2026-10-03
- Status: accepted
- Plan phase: Phase 1, steps 1 and 8 to 10

## Context

Three facts found in Phase 1:

1. Corepack could not activate pnpm 12.8.1 (the latest) on the development machine (`Cannot find module ... pnpm.cjs`). pnpm 11.28.3 worked.
2. npm offers TypeScript 7.x as `latest`, but `typescript-eslint` 8.71 only accepts `typescript <6.1`. Expo and NestJS also follow the 5.x line.
3. ESLint 9 resolves `eslint.config.js` from the folder it runs in, not from the file. lint-staged runs from the root, so it did not find each package's configuration.

## Decision

- **pnpm 11.28.3**, pinned in the `packageManager` field (Corepack uses exactly that version).
- **TypeScript `~5.9`**, pinned in the packages that use it.
- **ESLint 9** (flat config), with lint-staged calling `eslint --flag v10_config_lookup_from_file`, which makes ESLint look for the configuration near each file (the ESLint 10 default). `eslint` also stays in the root `devDependencies`.
- Commit messages: commitlint requires a lowercase subject after the type.

## Consequences

- Bumping a version is a conscious decision (a new ADR), not a side effect of `pnpm add`.
- When `typescript-eslint` accepts TypeScript 6/7 and Expo/Nest follow, reassess.
- When moving to ESLint 10, the flag is no longer needed.
