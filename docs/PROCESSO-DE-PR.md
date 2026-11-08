# PR process: from branch to merge

Goal: no PR goes up with an error a machine would find, and every PR is easy to review. The steps below apply to anyone who contributes.

## 1. Before opening the PR (local)

1. `git pull origin main` and a `<type>/<slug>` branch.
2. Commits: Conventional Commits **in English** and lowercase, **with no body** and **with no AI attribution** (checked by `commitlint`).
3. A change in behavior, contract or game rule: an OpenSpec proposal (`/opsx:propose`) before the code.
4. `pnpm run verify` (see below). Only go on with everything green.
5. Review the diff: new code in English and comments only where the code does not say it by itself (rules 11 and 12 of `CONTRIBUTING.md`).
6. Code review of the branch (`/code-review` or another person's review). Fix everything relevant; what stays pending goes to an issue with the reason, and to the "Risks and pending items" section of the PR.
7. Description following `.github/PULL_REQUEST_TEMPLATE.md`, **in English** (see section 5).

## 2. What `pnpm run verify` checks

| #   | Step                                                     | Tool                                         |
| --- | -------------------------------------------------------- | -------------------------------------------- |
| 1   | Commit messages                                          | `commitlint` (`scripts/check-commits.sh`)    |
| 2   | Lint, types, unit tests and build of all packages        | Turborepo                                    |
| 3   | Business rules against the database (API e2e)            | Vitest + Supertest + test Postgres           |
| 4   | Changed OpenSpec proposals                               | `openspec validate` (`scripts/check-openspec.sh`) |
| 5   | Duplicated code (2% limit)                               | `jscpd` (`.jscpd.json`)                      |
| 6   | Secrets, IPs, history, authorship and dependencies       | `scripts/security-scan.sh` (full mode)       |
| 7   | Clean tree                                               | `git status`                                 |

`SKIP_E2E=1 pnpm run verify` skips the e2e when there is no local Postgres. CI runs all of this (except the full mode of step 6) on every PR.

## 3. CI (`.github/workflows/ci.yml`)

- `check` job: PR commits, lint, types, tests, build, API e2e (the PostgreSQL that comes with the runner), OpenSpec, duplication and secret scan.
- `descricao` job: title in the `type: subject` format and the five template sections; it blocks mentions of AI tools.
- Official actions with pinned versions; no repository secret in the flow.
- Outside CI, for now: interface tests (Maestro, they need an emulator). Run them before the PR if you touched a screen (`docs/TESTES.md`).

## 4. Security review, on every front

Go through the `CONTRIBUTING.md` checklist for what changed:

- **API**: the route is born protected, input and output with Zod, `select`/DTO (never the whole model), the user's own object (IDOR), a transaction for counters, no sensitive data in logs.
- **App**: tokens only in SecureStore, nothing sensitive in AsyncStorage, URL or log; client validation is only UX.
- **Banner/lab**: no network, no state, validated messages; the lab is for development only.
- **Contracts**: a contract change and the consumers' change in the same PR.
- **Dependencies**: exact name, pinned version, lockfile together, `pnpm audit` with no high or critical (exceptions documented in `pnpm-workspace.yaml`).
- There is no admin app in this repository; if one ever exists, it goes into this list.

## 4.1 Quality and duplication

- Search the repository before creating (reuse). Code repeated in two places becomes a shared function or module.
- `pnpm run duplicates` fails above 2%. Generated art (`qg/scenes`) and pixel art data are left out.
- Debt that does not fit in the PR becomes a GitHub issue, with the reason; it never stays only in someone's head.

## 5. Opening and merging

- Only with the maintainer's approval. Review your own diff before opening.
- Title and description **in English**, short and declarative, with the sections `## What changes`, `## Why`, `## How it was verified`, `## Risks and pending items` and `## Security` (CI checks these headings). The template's checkbox list can become short sentences (the standard of the infra PRs). Also say what was not verified.
- No tool footer, no co-author and no mention of AI or a session, in the title, the body and the commits. CI blocks the common forms in the PR title and body and `commitlint` in the commits; the language (English) is not fully checked by a machine, it is a review rule.

Example description:

```md
## What changes

- The release workflow builds `@nextjourney/contracts` before the smoke tests.

## Why

The smoke step failed with `Cannot find module .../contracts/dist/index.js`.

## How it was verified

- Reproduced from the run log; not yet exercised on a real release.

## Risks and pending items

- None.

## Security

- No permission, secret or access change.
```

- Squash merge, with the title `type: subject (#N)` and an **empty body** (`gh pr merge --squash --body ""`), after green CI.
- After the merge: update the local `main` and delete the branch.
