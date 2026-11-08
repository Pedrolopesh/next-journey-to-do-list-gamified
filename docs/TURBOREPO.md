# Turborepo — how it works and how it is configured in Next Journey

Updated on 2026-10-12, with `turbo` 2.11.6 and `pnpm` 11.28.3. The official documentation of the installed version is in `node_modules/turbo/docs/` and is worth more than any text on the internet, because it follows the version the project uses.

## Part 1 — How Turborepo works (general)

### 1.1 The problem it solves

A monorepo has several packages (API, app, banner, contracts) and several tasks (lint, typecheck, test, build). Running everything in every package, in the right order, all the time, is slow. Turborepo does three things:

1. **Orders:** runs each task after the tasks it depends on.
2. **Parallelizes:** runs at the same time what does not depend on each other.
3. **Caches:** if the inputs of a task did not change, it does not run again; it restores the result and shows the stored log.

It does **not** install dependencies nor decide which folders are packages. That belongs to the package manager (here, pnpm).

### 1.2 pnpm and Turborepo, who does what

| Tool      | Responsibility                                                            | File                                                     |
| --------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| pnpm      | Install dependencies once, link workspace packages by name, run scripts   | `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`  |
| Turborepo | Discover the package graph, order and cache tasks                         | `turbo.json`                                             |

Turbo reads the pnpm workspace to know which packages exist and who depends on whom (through the `dependencies`/`devDependencies` field of each `package.json`).

### 1.3 Concepts

**Package graph.** If `apps/api` lists `@nextjourney/contracts` in `dependencies`, there is an edge `api → contracts`. These edges come only from the `package.json` files.

**Task.** A `package.json` *script* that Turbo knows how to run. In `turbo.json`, `tasks` declares which script names are tasks and how they relate. A package that does not have the script simply does not take part in that task.

**Task graph.** Turbo combines the package graph with the `dependsOn` of the tasks. Example: `"test": { "dependsOn": ["^build"] }`.

- `^build` (with a caret) = the `build` **of the packages I depend on**.
- `build` (without a caret) = the `build` **of the same package**.

So the API `test` only runs after the `contracts` `build`, and so do the banner and app tests. Since all three depend only on `contracts`, once it compiles the three test in parallel.

**Hash and cache.** For each task of each package Turbo computes a hash with: the package files (respecting `inputs`), the hash of the tasks it depends on, the declared environment variables, the task configuration and the global files (such as the lockfile). Same hash = cache hit: it restores the `outputs` and replays the log, without running anything (the final line shows `FULL TURBO`). The local cache lives in `.turbo/` (ignored by Git).

**`outputs`.** List of files the task produces (`dist/**`). Only what is in `outputs` is restored on a cache hit. Tasks without files (lint, test) can omit `outputs`: the log is still cached.

**`dev` and `persistent`.** Servers that keep running do not finish, so they are `"persistent": true` and `"cache": false`. No other task can depend on a persistent task.

**Environment variables (strict mode).** By default Turbo only passes to the tasks the variables listed in `env`/`globalEnv` (which also enter the hash). Exceptions: framework inference already includes variables such as `EXPO_PUBLIC_*` for Expo packages. Variables that must not affect the cache but need to exist (EAS tokens, for example) go in `passThroughEnv`/`globalPassThroughEnv`. If a task fails because of a "missing" variable, it is almost always this.

**Filters.**

| Command                                           | Effect                                                         |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `turbo run test --filter=@nextjourney/contracts`  | only that package                                              |
| `turbo run test --filter=@nextjourney/contracts...` | the package and whoever depends on it                        |
| `turbo run test --filter="...[origin/main]"`      | packages changed relative to main (and their dependents)       |
| `turbo run lint test --affected`                  | the modern short form of the previous filter                   |

**Remote Cache.** Shares the cache between machines (you and CI). It is optional and disabled ("Remote caching disabled" in the log). It can be enabled later without changing anything in the tasks.

**Useful commands to understand what happens.**

```bash
pnpm exec turbo ls                      # lists the packages it saw
pnpm exec turbo run build --dry=json    # shows the plan and whether each task would be HIT or MISS, without running
pnpm exec turbo run build --graph       # draws the task graph
pnpm exec turbo run build --force       # ignores the cache
pnpm exec turbo prune @nextjourney/api --docker   # generates a minimal subset of the repo for the Dockerfile
```

`turbo prune` will be useful for the API deploy on the VPS: the Dockerfile copies only the API and what it imports, instead of the whole monorepo.

## Part 2 — How it is configured in this project

### 2.1 Files

**`pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Every directory inside `apps/` and `packages/` with a `package.json` is a package.

**`package.json` (root)**: `"private": true` (the monorepo is never published), `"packageManager": "pnpm@11.28.3"` (corepack uses exactly this version), `"engines": { "node": ">=24" }` and the scripts:

```json
"build": "turbo build",
"lint": "turbo lint",
"typecheck": "turbo typecheck",
"test": "turbo test",
"dev": "turbo dev"
```

That is: `pnpm run test` at the root becomes `turbo test`, which runs the `test` script of each package that has one, in graph order.

**`turbo.json`**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

Line-by-line reading:

| Task        | Configuration                                         | Why                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`     | depends on the `build` of the dependencies; produces `dist/**` | `contracts` must be compiled before whoever imports it. The banner generates the `dist/index.html` that the app embeds                                                              |
| `typecheck` | depends on `^build`                                   | A package's `tsc` reads the compiled types (`dist/*.d.ts`) of the dependencies                                                                                                              |
| `lint`      | depends on `^build`                                   | ESLint with type-aware rules (typescript-eslint) reads the compiled types (`dist/*.d.ts`) of the dependencies; without the build, everything becomes "type not resolved"                     |
| `test`      | depends on `^build`                                   | The tests import the compiled code of the contracts                                                                                                                                         |
| `dev`       | no cache, persistent                                  | Development servers (API, Vite, Metro) keep running                                                                                                                                         |

**Why `contracts` needs a build.** NestJS runs on CommonJS and does not read TypeScript from inside `node_modules`. That is why `contracts` is compiled with `tsup` (ESM + CJS output). Metro (app) and Vite (banner) read TypeScript directly, but use the same compiled package to stay uniform.

### 2.2 Packages Turbo sees today

Real output of `turbo ls`:

```
6 packages (pnpm9)
  @nextjourney/api           apps/api
  @nextjourney/banner        apps/banner
  @nextjourney/contracts     packages/contracts
  @nextjourney/eslint-config packages/eslint-config
  @nextjourney/mobile        apps/mobile
  @nextjourney/tsconfig      packages/tsconfig
```

| Package                      | Scripts                                       | Role                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nextjourney/contracts`     | `build` (`tsup`), `lint`, `typecheck`, `test` | Shared Zod schemas. Exports `main`, `module`, `types` and `exports` pointing to `dist/`                                                                                       |
| `@nextjourney/tsconfig`      | none                                          | Reused TypeScript configs: `base.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ES2022), `node.json` (NodeNext) and `react-native.json`             |
| `@nextjourney/eslint-config` | none                                          | Lint rules exported as `@nextjourney/eslint-config/base`, `/node` and `/react`                                                                                                |

`apps/` has `api`, `banner` and `mobile`, each with its own scripts (`build`, `lint`, `typecheck`, `test`).

### 2.3 What happens when you run `pnpm run build`

1. pnpm runs the root `build` script: `turbo build`.
2. Turbo reads the workspace and builds the package graph (6 packages; the API, the banner and the app depend on `contracts`).
3. Because of `^build`, `contracts` is compiled before the packages that import it.
4. For each task it computes a hash of the inputs. The first time it runs and stores the result; the following times, if nothing changed, it answers `FULL TURBO` without running.

With the apps, the banner `build` also copies the generated `index.html` into the app (`apps/mobile/assets/banner/banner.html`, ignored by Git) and validates the weight. The `mobile` tests run Vitest and Jest.

### 2.4 Next changes in Turbo

When the API deploy lands, `turbo prune` generates the subset of the monorepo that the Dockerfile needs. Other changes go here when there is a decision.

### 2.5 Everyday recipes

```bash
pnpm install                                   # installs everything
pnpm run build                                 # build of all packages
pnpm --filter @nextjourney/contracts add zod   # a dependency in one package only
pnpm exec turbo run build --dry=json           # understand what would run
pnpm exec turbo run test --filter="...[origin/main]"   # only what changed
```

### 2.6 Gotchas already found

- **`generate` is a Turbo task.** The Prisma client is generated in `apps/api/src/generated` (ignored by Git). When `build`, `typecheck` and `lint` each called `prisma generate`, they ran in parallel and fought over the same folder (intermittent failures). Now `apps/api/turbo.json` declares the `generate` task (with `inputs` on the schema and `outputs` on the generated folder) and the others depend on it. To run it by hand: `pnpm --filter @nextjourney/api generate`.
- **Environment variables in strict mode.** Turbo only passes the declared variables to the tasks. `DATABASE_URL` and `TEST_DATABASE_URL` are in `globalPassThroughEnv` (passed without entering the cache hash), because Prisma 7 reads `DATABASE_URL` even for `prisma generate`, which runs in the API `lint`, `typecheck` and `build`. In CI they point to the job's ephemeral Postgres; locally `prisma.config.ts` loads `apps/api/.env`.
- **`turbo` guidance block.** `turbo` writes a guidance block for automated agents into the root rules file when it detects one. To keep that file from being changed, `turbo.json` sets `"agentGuidance": false`.
- **pnpm 12.8.1 does not activate through corepack** on this machine (2026-10-02, error `Cannot find module ... pnpm.cjs`). That is why `packageManager` is at 11.28.3.
- **`pnpm init` writes the newest version** into `packageManager` and `devEngines`; `package.json` was rewritten by hand with the pinned version.
- **ESLint 9 resolves `eslint.config.js` from the current folder**, not from the file. In lint-staged (which runs from the root) that would break, so the command uses `--flag v10_config_lookup_from_file`, which makes ESLint look for the config near each file (the default ESLint 10 behavior). `eslint` also needs to be in the root `devDependencies` for lint-staged to find the binary.
- **TypeScript 5.9, not 7.** `typescript-eslint` 8.71 accepts `typescript <6.1`. Since `npm` already offers 7.x, `pnpm add` installs 7 if you do not pin the range.
