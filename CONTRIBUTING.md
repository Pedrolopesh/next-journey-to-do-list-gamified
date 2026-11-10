# Contributing to Next Journey

Read this file before any change: stack, rules and checklists. For an overview see `docs/HOW-IT-WORKS.md`; for how to run, see `README.md`.

## Project

Gamified to-do list (dailies, tasks and habits earn EXP and coins and move an LPC character through a story). **pnpm + Turborepo** monorepo, packages under the `@nextjourney/*` scope.

- `apps/api`: NestJS 11 + Prisma + PostgreSQL
- `apps/banner`: game layer in Vite + TypeScript, runs in a WebView (Map in CSS, HQ on canvas)
- `apps/mobile`: React Native + Expo, Expo Router
- `packages/contracts`: shared Zod schemas (API, app, banner)
- `packages/tsconfig`, `packages/eslint-config`: shared configuration

Tests and regression (layers, Maestro for the app UI): `docs/TESTING.md`. Docs: `docs/SCENARIOS.md` (rules for building and checking the banner scenes; read it before creating or changing a scene), `docs/HOW-IT-WORKS.md`, `docs/TURBOREPO.md`, `docs/REQUIREMENTS.md` (specification), `docs/api/` (how the API works inside).

## Stack (FACT, do not change without confirming)

- Node 24 (`.nvmrc`), **pnpm 11.28.3** (`packageManager` field), Turborepo 2.x, TypeScript **~5.9** (7.x breaks `typescript-eslint`)
- ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint
- **NEVER** use `npm` or `yarn` in this repo, only `pnpm`
- Decisions are in the ADRs under `docs/adr/`

## Commands

- `pnpm install`
- `pnpm run build | lint | typecheck | test | dev` (all through Turbo)
- `pnpm --filter @nextjourney/<package> <script>`: a single package
- `pnpm run security`: quick scan for sensitive data plus `pnpm audit`; `pnpm run security:full`: full scan with the whole history (mandatory before every PR)

### What CI checks on every PR

`pnpm install --frozen-lockfile` → the PR commits (commitlint) → `turbo run lint typecheck test build` → API e2e → changed OpenSpec → duplication (`jscpd`) → `scripts/security-scan.sh`; plus the `descricao` job (PR title and sections). Run everything locally with `pnpm run verify`.

## Architecture (target)

- App ↔ API: REST `/v1` (15 min JWT + rotating refresh). App ↔ banner: `postMessage` `{ v: 1, type, payload }`, validated with Zod on both sides. The banner never reaches the API.
- The **server decides progression**. Every rule for EXP, coins, level, streak, chapter and achievements lives only in `apps/api/src/modules/progression/domain`, as a pure function with a test. The app does not compute EXP.
- Contracts between projects live only in `packages/contracts`. Never duplicate types.

## OpenSpec (changes with a spec)

A change that alters behavior, the API contract, the banner protocol or a game rule goes through OpenSpec before it becomes code: `/opsx:propose` (proposal, design, specs, tasks), `/opsx:apply` (implement the tasks), `/opsx:archive` (archive and sync the specs). Living specs are in `openspec/specs/`, changes in `openspec/changes/`. `openspec/config.yaml` is short on purpose: the source of truth is this file. A small fix or a documentation-only change does not need a proposal.

## Implementation rules (MANDATORY)

1. **Reuse before creating.** Look in `packages/` and the existing modules before creating something new.
2. **Never return the whole Prisma model.** Explicit `select` or an output DTO: allowlist, not denylist.
3. **Every route is born protected.** The most restrictive guard that works, at controller level; authentication is not authorization.
4. **Explicit contract.** Input and output validated with Zod (`packages/contracts`); never pass the raw body to Prisma. Changed a contract? It is in the same PR and in the spec.
5. **Database.** `$queryRaw` only with a bound parameter. New migration, never edit an applied migration. Index on every filter or sort column.
6. **UI text only through i18n** (`pt-BR.json`). Colors and sizes only through the design system tokens.
7. **Logs without sensitive data:** never email, password, token or request body.
8. **Dates** in UTC in the database; the user's "day" in the profile time zone; records in ISO 8601.
9. **New test for a new rule.** A game rule change starts with a test.
10. **No action leaves the user in the dark (RN-FB).** Every user action in the app shows loading and ends in a success or error toast; failed validation never leaves the button "doing nothing". Use `useAction` and `toast` (`apps/mobile/src/features/feedback`). Details in `docs/REQUIREMENTS.md` (section 3) and the store gate in `docs/QA.md` (section 7).
11. **Code in English.** Variable, function, type, new file name, comment and test name in English. Only the text the user sees (`pt-BR.json`) and the product content (sample item titles, category names, scenes) stay in Portuguese. The rule applies to what you write, even inside an old Portuguese file: new identifiers and comments in English, without renaming what already exists (that is separate work, by area). Established public names (routes, columns, contract keys) do not change because of this rule.
12. **Comment only when the code does not say it by itself.** Comment the non-obvious why (a constraint, a decision, a workaround, a security reason), never what the line does; no commented-out code, no change history ("it used to do X") and no loose TODO: a pending item becomes a GitHub issue. Long explanations, design decisions and business rules go in the documentation (`docs/`, the OpenSpec `design.md`) with a short link in the code. Review the comments in the diff before opening the PR: delete what repeats the code or went stale and move to the documentation what deserves to stay.

## Security checklist (check on EVERY PR)

The PR template repeats these items; each must be ticked or confirmed in a short sentence in the "Security" section.

### Always

- **This repository is public on purpose.** Assume the attacker reads all the code; nothing committed can be erased later. Never commit real infrastructure data (IP, host, port, inventory) or audit findings.

- **Secrets:** no token, password, key, `.env`, certificate or infrastructure IP/host in code, docs, tests, commits or PRs. `pnpm run security` must pass.
- **Over-exposure:** never return the whole ORM model.
- **IDOR/BOLA:** receiving an `id` from the client requires validating that the requester may access **that object**.
- **Authorization ≠ authentication.**
- **Secret in a log or error:** tokens, passwords, full emails and stack traces do not go into logs or responses.
- **Fail open:** on error, deny. Never a `catch` that authorizes.

### API (NestJS)

- Mass assignment (fields such as `role` and `isBlocked` never come from the client), SQL injection (`$queryRaw`), SSRF, path traversal.
- JWT: validate `exp`, a fixed algorithm, a strong secret outside the code. Rotating refresh token; reuse revokes the family.
- Account enumeration: the email-code request answers the same for an existing and a missing email; with a rate limit.
- Constant-time secret comparison (`crypto.timingSafeEqual`).
- ReDoS, race conditions (transaction or unique constraint), CORS with an allowlist (never reflect `Origin` with credentials), helmet on.
- Check idempotency (`checkId`): repeating must not duplicate EXP.

### App (Expo/React Native) and banner (WebView)

- **Feedback on every action (RN-FB):** a button with `loading`, a success/error toast and a field message on failed validation. A static screen after a tap is a defect.
- Tokens only in SecureStore; nothing sensitive in AsyncStorage, logs, URLs or query strings.
- WebView: restricted `originWhitelist`, only embedded local HTML, no external URL loading; every banner message validated with Zod and dropped if invalid.
- The banner makes no network request and keeps no state.
- Deep links and `scheme`: validate parameters; no open redirect.
- Build secrets (EAS) only in the secrets manager; `EXPO_PUBLIC_*` is public, never put a secret in it.
- Client-side validation is UX; the rule also exists in the backend.

### Dependencies

- Check the exact package name (typosquatting) before installing; version the lockfile together.
- `pnpm audit` clean for high or critical severity.
- New GitHub Actions action: pin the version and prefer official actions.

## Before opening a PR (MANDATORY)

### 1. Review

- Work on a branch and open the PR only after reviewing your own diff: what changed and why, the file list and the result of `lint`, `typecheck`, `test` and `build`.
- Changed something after the review? Review again.

### 2. Full check for keys, tokens and secrets

Run `pnpm run security:full` and proceed only with `OK`. It covers: secret patterns in all versioned and new files; sensitive files (`.env`, `.pem`, keystores, SSH keys); IP addresses; the **whole history** of all branches; ignored files that look sensitive; commit authorship and messages (no co-authorship or tool-generated footers); and `pnpm audit`.

Besides the script, check by hand:

- `git status --ignored` and `git diff --cached`: no unexpected file gets in (`.env`, dumps, logs, screenshots with data, personal or server files).
- The PR description and the commit messages: no token, IP, host, server path or audit finding.
- New docs and tests: no "example" credentials that look real; examples use obviously fake values (`<token>`, `example.com`).
- New dependency: exact name checked, lockfile together, `pnpm audit` clean.

If you find a secret (even an old one), **stop**: do not push, tell the maintainer, revoke the secret and only then remove it from the code and, if it was already committed, from the history.

## Language: English in code and PRs (MANDATORY)

Applies to people and to any tool that writes in this repository.

- **PR, commit and issue:** title, description (including the section headings), commit subject and review comment in English. CI rejects accented characters in the PR title and description.
- **Code:** variable, function, type, class, constant, new file name, test name and comment in English. `scripts/check-hygiene.sh` rejects a new comment with accented characters.
- **Only what the user sees stays in Portuguese:** `pt-BR.json` and the product content (sample items, category names, scenes, achievements). Established public keys (routes, columns, achievement ids, contract fields) do not change because of this rule.
- **When touching an old Portuguese file:** what you write goes in English; rename what already exists only in a dedicated rename PR, by area, with a green `pnpm run verify` and no public contract changed.
- **New documentation** (`docs/`, `README`, OpenSpec) is also in English; the existing one is migrated by area, in separate PRs.

## Public repository hygiene (MANDATORY)

This repository is open: whoever clones it sees everything, and what enters Git never leaves. These rules apply to people and to any AI tool that writes code here. `scripts/check-hygiene.sh` (part of `pnpm run security`, `verify` and CI) checks the first five; the rest are for review.

1. **Notes, diary, personal plan and local rules stay in `internal/`** (ignored by Git), together with the local `AGENTS.md`, `CLAUDE.md` and `.claude/`. Never version `internal/`, `HANDOFF*`, `DIARIO*`, `RESUMO-DA-SESSAO*` or `docs/gestao/`.
2. **No mention of a tool, a personal note or a document outside Git** in code, docs, comments or PRs (note editors, AI assistants, someone's environment shortcuts). If the information matters to contributors, write it in the repository documentation, in neutral language.
3. **No personal or audience motivation.** Commits, comments and PR descriptions say what changes and the technical reason; they do not mention who will read or evaluate the repository (leadership, a panel, a client), opinions or personal decisions. CI checks the PR title and description.
4. **No `TODO` or `FIXME` in comments.** A pending item becomes an issue or goes in "Risks and pending items" of the PR.
5. **No co-authorship, tool-generated footer or session URL** in commits or PRs (CI rejects them).
6. **Never use `git add -A`, `git add .` or `git commit -a` blindly.** Add files by name and check `git status` and `git diff --cached --stat` before each commit; a local file that is not yet in `.gitignore` gets in without warning.
7. **Documentation follows the code.** Changed behavior, a command, an environment variable or a flow? Update `README.md` and `docs/HOW-IT-WORKS.md` (and whatever else describes it) in the same PR. Documentation that contradicts the code is a defect.
8. **New or changed GitHub Actions workflow:** actions pinned by SHA, minimal `permissions` declared at the top and no secret in `run:` without going through `env:`.
9. **Container image:** the base runs `apt-get upgrade` (or equivalent) to close system CVEs; the delivery Trivy scan fails on HIGH or CRITICAL with a fix available.
10. **Dependency:** exact name checked, lockfile together, `pnpm audit` clean and no license incompatible with the project's MIT. A batch update (Dependabot) only goes in after `pnpm run verify` and opening the app.
11. **License and credits:** third-party art, fonts or sounds come with the license noted in `CREDITS.md` in the same PR.
12. **New or changed screen:** the Android back button (and gesture) behaves like iOS, every title has a heading role for screen readers, and route names are not repeated by hand in two places.
13. **OpenSpec:** a behavior change has a proposal with `.openspec.yaml`, `proposal.md`, `tasks.md` and specs (or `skip_specs: true` when there is no spec); `scripts/check-openspec.sh` checks it.

## PR process (MANDATORY; details in `docs/PR-PROCESS.md`)

1. **Green `pnpm run verify`** before opening the PR: commits (commitlint), lint, types, tests, build, API e2e, OpenSpec, duplication (`jscpd`, 2% limit) and `security:full`. CI repeats the steps and also checks the PR title and description.
2. **Code review of the branch before opening the PR.** Handle the findings; what stays pending goes to an issue and to the "Risks and pending items" section of the PR. Never push technical or security debt without a record.
3. **Title and description in English**, declarative and short, following `.github/PULL_REQUEST_TEMPLATE.md`: sections `## What changes`, `## Why`, `## How it was verified`, `## Risks and pending items` and `## Security` (CI checks them). Title `type: subject` in lowercase. Also say what was not verified. No tool footers or session URLs in the title, body or commits. Example title: `fix: build the contracts before the release smoke tests`.
4. **Reuse and duplication:** search before creating; repeated code becomes a shared function. Review the security of every front the PR touches (API, app, banner, contracts, dependencies).
5. **Squash merge** with the title `type: subject (#N)` and an empty body, only with green CI and approval from the maintainer.

## Do not

- Do not add a body to commits
- Do not include co-authorship, tool-generated footers or session URLs in commits or PRs
- Do not write the title, the PR description (including the section headings) or the commit subject in Portuguese: everything in English
- Do not write a new variable, function or type name or comment in Portuguese
- Do not leave a comment that repeats the code, commented-out code or change history in the diff

## Safety

- NEVER commit a `.env` with real values; only `.env.example`.
- NEVER push straight to `main` — always a branch + PR, with review and the full scan (section above).
- NEVER edit migrations that were already applied.
- Always `git pull origin main` before starting.
- **Branch convention:** `<type>/<kebab-case-slug>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`.
- **Commits:** Conventional Commits. The subject starts in lowercase (commitlint rejects a leading capital). One change per PR (the commit has no body).
