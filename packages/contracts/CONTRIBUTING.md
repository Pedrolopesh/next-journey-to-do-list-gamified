# packages/contracts — shared contracts

Monorepo rules are in `../../CONTRIBUTING.md`. This package is the **single source** of the data formats between the API, the app and the banner.

- Zod schemas + types (`z.infer`). No business logic and no framework dependency: the app (React Native), the banner (browser) and the API (Node) import from here.
- Never duplicate a type in another package: import from `@nextjourney/contracts`.
- Every contract change (route, schema, banner message) updates the consumers **in the same PR** and the matching proposal/ADR. The typecheck of all three breaks if something is left behind.
- Every new schema has a test (`*.test.ts`), with valid and invalid cases, including limits.
- Input schemas validate what comes from the client; never include a sensitive field in an **output** schema (password hash, another user's refresh token, third-party emails).
- The build (`tsup`) emits ESM and CJS. `lint`, `typecheck` and `test` depend on the build of the dependencies (Turbo).
- Banner protocol: messages `{ v: 1, type, payload }`; if the format changes, bump the `v` version and handle both during the transition.
