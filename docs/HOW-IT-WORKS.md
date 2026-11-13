# Next Journey — how the project works

Updated on 2026-11-05. This document describes **what exists today** in the repository and **how the pieces talk to each other**. Sources: [REQUIREMENTS.md](./REQUIREMENTS.md) (specification), [TURBOREPO.md](./TURBOREPO.md) (build tool), the specs in `openspec/` and the ADRs in [`adr/`](./adr/README.md).

## 1. The product in one sentence

A personal to-do list for iOS and Android where every checked item earns EXP and coins and moves a pixel art character (LPC) through a story of 5 chapters (6 stories, one per scene; each level gained completes a chapter). Three item types (daily, task, habit) use the same check. No social features, no store, no penalties in v1.

## 2. Current state of the repository (2026-11-05)

| Item                                       | State                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification                              | Ready, in `docs/` and `openspec/`                                                                                                                                                                                                                                                      |
| pnpm + Turborepo monorepo, hooks and CI    | Working: ESLint, Prettier, Husky, lint-staged, commitlint and GitHub Actions (lint, typecheck, test, build and security scan on every PR)                                                                                                                                               |
| `packages/contracts`                       | Shared Zod schemas (auth, items, check, stories, character, banner protocol), with tests; built with `tsup`                                                                                                                                                                            |
| `packages/tsconfig`, `packages/eslint-config` | Ready                                                                                                                                                                                                                                                                               |
| `apps/api`                                 | NestJS + Prisma + PostgreSQL: email code sign-in, sessions, profile (goals, optional age and gender), items, check, progression, stories, achievements, character, `GET /home`, data export and account deletion; unit and e2e tests                                                   |
| `apps/banner`                              | Vite + TypeScript: Map scene (CSS) and HQ scene (canvas, 7 scenes, LPC character); a development lab in pages (`lab.html`: buttons, indicators, achievements, scenes, scenery and maps catalog, character and credits) and a debug panel (`dev.html`), both outside the build                                    |
| `apps/mobile`                              | Expo + React Native: email code sign-in, introduction, character creation, story choice, reminders, Home with the HQ, item tabs (with a draft of the new task), achievements, profile, settings and credits                                                                            |
| `apps/infra`, `apps/smoke`                 | Containerized server (Ansible, OpenTofu, Docker Compose), delivery pipeline and smoke tests                                                                                                                                                                                            |
| Environments                               | Two API environments (development and production), on the same version; production only after manual approval                                                                                                                                                                          |

What is still missing: store builds of the app. The decision records are in `docs/adr/` and the changes in `openspec/`.

## 3. Folder structure

```
next-journey-to-do-list-gamified/
  apps/
    api/        NestJS + Prisma + PostgreSQL
    banner/     Vite + TypeScript; Map in CSS and HQ on canvas (src/qg)
    mobile/     Expo + React Native + Expo Router
    infra/      server, containers, deploy and runbooks
    smoke/      smoke tests against a live environment
  packages/
    contracts/      shared Zod schemas and types
    insignias/      badge art (character grids and palette)
    tsconfig/       base TypeScript configurations
    eslint-config/  shared lint rules
  docs/            requirements, ADRs, QA, API reference and this document
  openspec/        proposals and specs for behavior changes
  scripts/         local verification, security scan and backup
  CONTRIBUTING.md  code, security and PR rules
```

Package names: scope `@nextjourney/*` (e.g. `@nextjourney/contracts`). A package sees the others by name, without publishing anything.

## 4. The three projects and how they talk

```
┌───────────────┐   REST /v1 (JSON, HTTPS)   ┌───────────────────┐
│ apps/mobile   │ ─────────────────────────▶ │ apps/api          │ ──▶ PostgreSQL
│ Expo / RN     │ ◀───────────────────────── │ NestJS + Prisma   │
└──────┬────────┘      CheckResult           └───────────────────┘
       │ postMessage { v:1, type, payload }
       ▼
┌───────────────┐
│ apps/banner   │  runs inside a WebView; never reaches the API
│ Vite + TS     │
└───────────────┘
        └──────── all import Zod schemas from packages/contracts ────────┘
```

- **App ↔ API:** REST under `/v1`, with an access JWT (15 min) and a rotating refresh token (365 days, renewed on every use). Sign-in is by email: the API sends a 6-digit code (`/auth/email/start` and `/auth/email/confirm`), with no password. Google and Apple login happens on the device; only the ID token goes to the API, which validates it. There is no password sign-in.
- **App ↔ banner:** the banner is a single `banner.html` embedded in the app (generated by Vite with `vite-plugin-singlefile`) and loaded in a WebView. The app sends messages (`INIT`, `ITEM_CHECKED`, `CHAPTER_COMPLETED`, `SET_CHARACTER`, `SET_TIME_OF_DAY`, `PAUSE`/`RESUME`) and the banner answers with `READY`, `CHAPTER_TRANSITION_DONE` and `ERROR`. Every message is validated with Zod on both sides.
- **Legal texts:** the Terms of Use and the Privacy Policy are served by the API as text (`GET /v1/legal/documents/:slug`, rendered by the app on the `legal/[slug]` screen) and as public HTML pages (`GET /legal/terms`, `GET /legal/privacy`). The age range collected in the app is optional and statistical; the age rating is the one set in the app store.
- **Contracts:** `packages/contracts` is the single source of the data formats. If a schema changes, the typecheck of the three apps breaks in the same PR.

## 5. The central rule: the server decides progression

All the rules for EXP, coins, level, chapter, streak, undo and achievements live **only in the API**, in `apps/api/src/modules/progression/domain`, as pure functions with tests (decision of 2026-10-02; there is no shared domain package). The app **does not compute EXP**.

Flow of a check:

1. The user taps the checkbox. The app vibrates, animates (180 ms) and marks the item in the cache **at once** (optimistic, only the check state).
2. The app generates a `checkId` (UUID v4), sends `ITEM_CHECKED` to the banner at the current position and calls `POST /v1/items/:id/checks`.
3. The API, in a single transaction (`prisma.$transaction`): validates the check, saves it in `item_checks`, updates the streak, `user_stats` and `story_progress`, evaluates achievements, and answers a `CheckResult` (EXP, coins, level, whether it leveled up, chapter progress (level EXP), whether it completed the chapter, unlocked achievements).
4. The app reconciles the cache with the `CheckResult` and shows the EXP and coins toast; the character runs to the new position (the level EXP). Level-ups and achievements enter a queue of modals, one at a time.
5. Leveled up: the character reaches the portal and waits; the completed-chapter modal opens together with the level one. On the next check the app sends `CHAPTER_COMPLETED` (fade of the scene change) and the character restarts at the EXP position.
6. Network error: the check goes to the offline queue and stays checked. Rule error (4xx): the app undoes the optimism and shows the reason.

The `checkId` makes the check **idempotent**: repeating the call (or resending from the offline queue) does not duplicate EXP.

Initial values (kept in the `game_config` table, adjustable without a new build): EXP 5/10/20 and coins 1/2/4 per difficulty (easy/medium/hard); EXP per chapter 200, 400, 600, 800 and 1000 (after chapter 5 the level rises every 1000 and the story stays in the scene of chapter 5); unchecking never takes EXP, only coins (3, 5, 10, 15 and 20 per chapter); each level gained completes a chapter of the active story; a bonus of 10 coins on leveling up; 5 chapters per story; habits with no daily limit of checks; the day rolls over at 00:00 in the profile time zone. The rest of the rules (undo, achievements, edge cases) is in REQUIREMENTS.md, section "Regras complementares".

## 6. Stack per project

| Project | Main technologies                                                                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API     | Node 24, NestJS 11, Prisma, PostgreSQL 16+, Zod + nestjs-zod, argon2, JWT, nestjs-pino, helmet, throttler, Terminus (`/health`), Swagger outside production, Vitest                                              |
| Banner  | Vite, TypeScript; Map in CSS (`@keyframes`, only `transform` and `opacity`) and HQ on 2D canvas with LPC sprites; Vitest + jsdom                                                                                |
| App     | Expo (development build, not Expo Go), React Native, Expo Router, TanStack Query, Zustand, axios, react-hook-form + Zod, SecureStore, reanimated, i18next (pt-BR), google-signin, expo-apple-authentication, expo-notifications, Sentry, jest-expo |
| Shared  | pnpm, Turborepo, strict TypeScript, ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint, GitHub Actions                                                                                            |

## 7. How to run today

The full steps are in the [README](../README.md). In short: Node 24, pnpm 11 through corepack, `pnpm install`, local PostgreSQL with `docker compose up -d`, migrations and seed, and `pnpm run verify` to check everything.

## 8. Environments and hosting

- **Local development:** Postgres through `docker compose` (file at the root) and the app as a development build against the local API or the development one.
- **Hosted development and production:** a VPS running Docker, with nginx on the host (80/443) and TLS. Rules: the project's own Postgres in a separate compose project, ports published only on `127.0.0.1`, memory and CPU limits per container, the two environments in distinct projects and ports, a daily Postgres backup with 7 days of retention, an external monitor on `/health`. The API image is scanned, signed and verified on the server before it starts (see `docs/adr/`). Address, inventory and audit findings stay outside the repository.
- **App builds:** EAS Build and EAS Submit, profiles `development`, `preview` and `production`; OTA (EAS Update) for JavaScript and banner fixes.
- **Email:** Resend, for the sign-in code. Without a configured key (local environment), the API writes the code to the log.
- **Identity:** name Next Journey; bundle id `br.com.wetechhub.app` (dev: `br.com.wetechhub.app.dev`), immutable from the first iOS build with Apple credentials.

## 9. How the work is done

- Work in phases, with each behavior change having a proposal and a spec in OpenSpec before the code.
- Each change becomes a small PR with Conventional Commits (`feat(mobile): ...`, `chore: ...`). A PR only goes in with `pnpm run verify` and CI green, a code review and a security scan (see [PR-PROCESS.md](./PR-PROCESS.md)).
- Decisions that are hard to reverse become an ADR in `docs/adr/`. Dates always in ISO 8601.

## 10. Decisions already made (2026-10-02)

- Progression rules in a single place in the back end; no `@nextjourney/domain` package.
- Banner: Map in CSS; HQ on canvas (decided in Phase 6, with a limit of 30 frames per second and a maximum weight of 1.5 MB).
- Google login with `@react-native-google-signin/google-signin`.
- Check route: `POST /v1/items/:id/checks`.
- No limit of checks per habit.
- Narrative choices and map choice: backlog (outside v1).
- Delete account: no dedicated screen, a row in Configurações › Conta with a confirmation dialog (a store requirement).
- Own hosting, in containers.

## 11. Known pending items

- Measure the banner on a real device and write ADR-0003 (WebView for the banner).
- Store builds (EAS) and interface tests (Maestro) in CI.
