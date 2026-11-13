# Next Journey — MVP v1 specification

Created on 2026-09-28 · Reorganized for reading on 2026-10-03

## Contents

1. [Overview and scope](#1-overview-and-scope)
2. [Functional requirements](#2-functional-requirements)
3. [Business rules](#3-business-rules)
4. [Non-functional requirements](#4-non-functional-requirements)
5. [Architecture and repository organization](#5-architecture-and-repository-organization)
6. [Project 1 — Back end (apps/api)](#6-project-1--back-end-appsapi)
7. [Project 2 — Banner (apps/web)](#7-project-2--banner-appsbanner)
8. [Project 3 — App (apps/mobile)](#8-project-3--app-appsmobile)
9. [Common standards: CONTRIBUTING.md, lint, tests and pre-commit](#9-common-standards-contributingmd-lint-tests-and-pre-commit)
10. [Step by step: create the app with Expo for iOS and Android](#10-step-by-step-create-the-app-with-expo-for-ios-and-android)
11. [Screens missing from Figma](#11-screens-missing-from-figma)
12. [Out of scope and open decisions](#12-out-of-scope-and-open-decisions)

Related documents: [HOW-IT-WORKS.md](./HOW-IT-WORKS.md) (overview of what exists today), [TURBOREPO.md](./TURBOREPO.md) and [PR-PROCESS.md](./PR-PROCESS.md).

> The app itself is in Brazilian Portuguese. Texts and screen names that the user sees are quoted in Portuguese in this document, on purpose.

---

## 1. Overview and scope

v1 is a personal to-do list in which every completed item earns EXP and coins and moves the LPC character through a story told in chapters. It ships for iOS and Android and is made of **three projects**:

- **Back end:** NestJS + PostgreSQL.
- **Banner:** the web front end of the game layer, which runs inside a WebView.
- **App:** React Native + Expo.

> **Change from the design:** v1 has no + and − buttons on habits. Dailies, todos and habits use the same check component, and every check fires the same `ITEM_CHECKED` event in the banner. What changes between the types is only the recurrence rule and where the item goes after it is checked (see [Business rules](#3-business-rules)).

### v1 principles

- **A single core action:** checking an item. Everything else (EXP, level, coins, achievements, chapter progress) is a consequence calculated on the back end.
- **The server is the source of truth for progression.** The app shows the result optimistically, but the back end is the one that calculates EXP, level and chapter.
- **Game layer and functional layer are separate:** the banner only receives events and never changes data.
- Native dark mode, pt-BR, no social features, no store and no penalties.

---

## 2. Functional requirements

There are **40 requirements in 10 modules**. *Required* blocks the launch; *Desirable* is included if it fits the schedule and does not block publishing to the stores.

### Authentication

| ID | Requirement | Priority |
|---|---|---|
| RF-01 | Passwordless entry: email and a 6-digit code (the account is born at the first confirmed code), with the terms accepted and the time zone. | Required |
| RF-02 | Email code: valid for 15 minutes, single use, 5 attempts, resend every 60 seconds. There is no password. | Required |
| RF-03 | Sign in with Google. | Required |
| RF-04 | Sign in with Apple (an App Store requirement when there is social sign-in). | Required |
| RF-05 | Account deletion with a second proof: an email code or the provider's ID token. | Required |
| RF-06 | Persistent session: the user stays signed in when reopening the app (access + refresh token). | Required |
| RF-07 | Sign out in Profile › Account. | Required |
| RF-08 | Account deletion inside the app, erasing the personal data (a requirement of Apple and Google Play). | Required |

### Onboarding

| ID | Requirement | Priority |
|---|---|---|
| RF-09 | Splash with the logo and the app name while the session is checked. | Required |
| RF-10 | A 3-slide tutorial, skippable, shown only on the first access. | Required |
| RF-11 | Character creation: name, title (Herói, Heroína, Aventureiro), skin tone, hair, outfit and accessory, saved as LPC layer keys. | Required |
| RF-12 | Choice of 1 out of 6 stories, one per scenery (beach, city, zombie apocalypse, castle, forest, hell). The chosen story defines the banner scenery of the tabs. | Required |
| RF-13 | Onboarding resumes from the step where it stopped; the app only unlocks the tabs once a character and a story are defined. | Required |

### Items

| ID | Requirement | Priority |
|---|---|---|
| RF-14 | Create an item with a title, type (Daily, Todo, Habit), category, difficulty (Easy, Medium, Hard) and an optional note. | Required |
| RF-15 | Fields per type: a Daily has a frequency (every day or days of the week); a Todo has an optional deadline (date and time); a Habit has no deadline. | Required |
| RF-16 | Edit and delete an item. Deletion is logical and keeps the EXP history. | Required |
| RF-17 | Check an item with a single check, the same for the 3 types. | Required |
| RF-18 | Undo at any time: EXP is never lost, only coins (3, 5, 10, 15 and 20 per chapter). | Required |
| RF-19 | Dailies tab: the day's items, with the overdue ones on top, a streak count and a pending badge in the menu. | Required |
| RF-20 | Todos tab: grouped by category, with pill filters and an overdue highlight. The todo leaves the list after it is checked. | Required |
| RF-21 | Habits tab: a list with the counter of today's and the week's checks. | Required |
| RF-22 | Search by title in the three tabs. | Desirable |

### Categories and progression

| ID | Requirement | Priority |
|---|---|---|
| RF-23 | 5 default categories (Trabalho, Saúde, Estudo, Freela, Pessoal). The user can rename, create and delete up to 10, with a color from the palette. | Required |
| RF-24 | Each check generates EXP and coins according to difficulty; an EXP bar and a level badge in Profile and Home. | Required |
| RF-25 | An EXP toast on every check and a level-up modal. | Required |
| RF-26 | Weekly summary in Profile (items completed in the week, reset every Monday). | Desirable |

### Story

| ID | Requirement | Priority |
|---|---|---|
| RF-27 | Progress bar below the tabs' banner: current chapter, the level's EXP bar, level and coins. | Required |
| RF-28 | On completing a chapter: a modal with a thumbnail, a title, a 2-to-3-line text and a Continuar button. | Required |
| RF-29 | "Minha história" screen: the journey banner, the story (scenery) choice and its chapters: completed (green check), current (purple border + progress) and future (padlock). The chapters of any story can be seen without changing the active one. | Required |
| RF-30 | Switch story; the progress of each story is saved and resumed when coming back to it. | Required |
| RF-31 | A narrative choice between 2 options at the end of some chapters, recorded in the timeline. | **Backlog** (out of v1, decided on 2026-10-02) |

### Achievements, Home, Banner, Profile, Notifications and Offline

| ID | Module | Requirement | Priority |
|---|---|---|---|
| RF-32 | Achievements | A catalog of 70 achievements in 7 tracks and 4 classes (bronze, silver, gold, diamond), with a 24x24 insignia, criterion, progress and state (locked or earned); a surprise achievement hides its criterion until it is unlocked. | Required |
| RF-33 | Achievements | A single achievement modal (top in the class color, insignia, Continuar and "Ver todas as conquistas") shown when it is unlocked, once per achievement. | Required |
| RF-34 | Achievements | Achievements are merit only: they do not unlock items. Clothes, hats and accessories as rewards are left for a later study (backlog). | Postponed |
| RF-35 | Home | HQ banner ("Seu QG") with a scene according to the time of day, a greeting, 4 indicators (dailies, todos, streak and coins), the story card and, at the end, the buttons to change character, story and scenery. The "Para hoje" list left the Home (the items stay in the tabs). | Required |
| RF-36 | Banner | Tabs' banner: a looping walk, a 5 s run on every check, a chapter-change fade and the character position saved between sessions. | Required |
| RF-37 | Profile | Avatar, name, title, level, EXP, coins, shortcuts to achievements, story and customization. | Required |
| RF-38 | Profile | Settings: theme color (story), categories, account, notifications and about. | Required |
| RF-39 | Notifications | A local daily reminder at a time chosen by the user and a notice of pending dailies in the evening. | Required |
| RF-40 | Offline | Checks made without internet go into a local queue and are synced when the connection returns. | Desirable |

---

## 3. Business rules

Every check is worth EXP and coins by the item's difficulty. Each level gained completes a chapter of the active story. The values below are the starting point and stay in configuration on the back end (the `game_config` table), so they can be adjusted without publishing the app again.

| Parameter | Initial value |
|---|---|
| EXP per check (Easy / Medium / Hard) | 5 / 10 / 20 |
| Coins per check (Easy / Medium / Hard) | 1 / 2 / 4 |
| Bonus on leveling up | 10 coins |
| Habit checks per day | No limit: every check pays EXP and coins |
| Chapter | Each level gained completes a chapter of the active story (chapter progress is the EXP inside the level) |
| Chapters per story in v1 | 5 |
| Day rollover | 00:00 in the time zone saved in the user's profile |
| HQ scene time bands | morning 05h–12h, afternoon 12h–18h, night 18h–05h |

**EXP to complete each chapter (= level):** 200, 400, 600, 800 and 1000 (`levelExpTable` in `game_config`). From level 5 on the level keeps rising, with 1000 EXP each, and the story stays in the scenery of chapter 5.

### By item type

- **Daily:** one check per scheduled day. If a scheduled day ends without a check, the item shows up as overdue the next day and the streak resets. Unscheduled days do not break the streak. Checking an overdue daily counts for today.
- **Todo:** a single check. After it is checked, it leaves the list in 600 ms and goes to the history. An overdue todo is still worth the full EXP (no penalty in v1).
- **Habit:** it can be checked several times a day. Each check adds to the counter and pays EXP and coins, with no daily limit.

### Undo and progression

- Undo is valid **at any time**, in any chapter. **EXP, level and chapter never come back**: only the coins go down, by the current chapter's `undoCoinPenalty` table (3, 5, 10, 15 and 20), without leaving the balance negative. The character does not move. Achievements already earned are not removed.
- **EXP once per item and day:** checking again, on the same day, an item that was undone pays the coins but 0 EXP.
- Notices: checking shows the EXP and coins earned; undoing shows a yellow notice with the coins taken away. In the app, the check itself undoes on tap (only for checks made on this device in this session).
- EXP, level and coins are **global**. The current chapter (and the completed ones) is **separate per story**.
- **Story = scenery** (2026-10-13): there are 6 stories, one per banner scenery, with 5 chapters each. Switching story is free and preserves the progress of each one; completed chapters stay unlocked. The tabs' scenery is the active story's; the HQ (Home) scenery is a separate choice, on the device only.
- **Chapter = level** (2026-10-13): each level gained completes the current chapter of the active story and opens the next (several levels in one check complete several chapters). The character's position in the banner is the EXP inside the level; on leveling up it reaches the portal and waits, and the scene only changes (fade) on the next check. There is no longer a count of checks per chapter.
- Coins only accumulate in v1, with no store. The Stats item in Profile stays locked until level 10.

### Initial achievement catalog

| Achievement | Criterion | Reward |
|---|---|---|
| Primeiro passo | First check | — |
| Chama de 7 dias | All scheduled dailies completed for 7 days in a row | Special outfit |
| Organizado | Create 10 items | — |
| Maratonista | 100 checks in total | Bandana |
| Aprendiz | Reach level 5 | Silver sword |
| Veterano | Reach level 10 | Cape |
| Novo capítulo | Complete the first chapter | — |
| Lenda viva | Complete a whole story | Shield |
| Madrugador | A check before 07h | — |
| Equilíbrio | Checks in 3 different categories on the same day | — |

### Complementary rules (proposed on 2026-10-02, to be confirmed)

Points that the specification left open. Each one becomes a test in the `progression` module and goes into ADR-0004.

**Undo and progression**
- The 10-coin bonus for leveling up is **not reverted** on undo. There is no lock by day or chapter (`CHECK_LOCKED` and the refusal of another day were removed on 2026-10-19).
- The EXP left over when leveling up carries over to the next level (`exp_in_level`); one check can raise more than one level, and the modal shows the final level.
- On completing chapter 5 (the 5th level gained in the story), the story is completed: checks keep paying EXP and coins, the chapter does not advance and the app offers to choose another story.
- A habit with no daily limit (decided on 2026-10-02): each check pays EXP and coins; undoing reverts the specific check (`checkId`).

**Dailies, todos and items**
- Undoing a daily restores the previous `last_checked_on` and streak (the `streak_before` field in `item_checks`). Undoing a todo puts it back in the list (`completed_at` null).
- A daily created today only becomes overdue if a scheduled day ends after the creation. Checking an overdue daily restarts the streak at 1.
- Deleted items keep the EXP history, but their checks can no longer be undone.
- Deleting a category with active items requires informing the target category (`moveTo`).

**Time zone, week and position**
- Changing the profile's time zone applies from now on: a `checked_on` already stored is not recalculated.
- The habit's weekly counter (RF-21) and the weekly summary (RF-26): a Monday-to-Sunday week in the profile's time zone, calculated on read. `GET /items` returns `checksToday` and `checksThisWeek`; `GET /me` returns the week's summary.
- The character's position between sessions (RF-36): derived from `story_progress` (`checks_in_chapter / required_checks`), returned by `GET /home`. The HQ's `timeOfDay` uses the profile's time zone.

**Achievements**
- Achievements are evaluated inside the check's transaction and unlocked only once (idempotent). `total_checks` goes down on undo, but an achievement already earned is not removed.
- *Chama de 7 dias:* 7 local days in a row in which every scheduled daily was completed on its own day; days with no scheduled daily are neutral.
- *Organizado* counts items created (`items_created`), even those deleted later. *Madrugador* uses the profile's local time (before 07h). *Equilíbrio* counts distinct categories of active checks on the same local day.

**Sign-up**
- Sign-up sends the acceptance of the Terms and the Policy (`termsAcceptedAt` and `termsVersion`).

---

### Cross-cutting rule: no action leaves the user in the dark

**RN-FB (mandatory across the whole app).** Every action the user triggers (a button tap, a form submission, social sign-in, signing out, deleting, saving, resending) has to answer right away and end in a visible way:

1. **In progress:** the button shows loading (`loading`) and ignores repeated taps, or the screen shows a skeleton/indicator. It never sits still with no reaction.
2. **Success:** a success toast, or an obvious change of screen/state (for example, the item shows up checked).
3. **Error:** an error toast with a clear text (no network, a rule violated, a generic error), plus the message next to the field when there is one.
4. **Validation failed:** the button never "does nothing": invalid fields show a message and the toast warns. Every field required by the contract needs a place to show the error.
5. **No network:** warn (toast) and, when there is an offline queue, say it was kept to be sent later.

A static screen after a tap is a defect, even if the logic is right. Implementation: `useAction` and `toast` in `apps/mobile/src/features/feedback`. Exception: purely local and instant navigation (going back, opening a screen, switching tab).

**This rule is verified on every screen before any submission to the stores** (script in `docs/QA.md`, section "Portão da loja") and on every PR that touches a screen.

## 4. Non-functional requirements

> The most important performance target is for the **check to answer on screen in under 100 ms**, with an optimistic update, even if the server is slow.

| Category | Requirement |
|---|---|
| Platforms | iOS and Android from the minimum versions of the Expo SDK in use; an iPhone and Android devices with 4 GB of RAM as the reference. |
| Performance | Check feedback in under 100 ms; API p95 below 300 ms on check and listings; banner at 60 fps; cold start in under 3 s. |
| Security | Codes and refresh tokens stored only as a hash; a 15-minute JWT access token + a 365-day refresh token (renewed on every use) with rotation and revocation; HTTPS mandatory; a rate limit of 5 sign-in attempts per minute per IP and email; Google and Apple ID tokens validated on the back end. |
| On-device storage | Tokens only in SecureStore (Keychain / Keystore); nothing sensitive in AsyncStorage. |
| Privacy (LGPD) | Acceptance of the Terms and the Policy at sign-up; account deletion with removal of personal data within 30 days; logs with no email, password or token. |
| Availability | 99.5% per month; a daily PostgreSQL backup with 7-day retention. |
| User feedback | The RN-FB rule (section 3): every action shows loading and ends in a success or error toast; no screen stays static after a tap. |
| Observability | Structured JSON logs with a `requestId` on the back end; error capture with Sentry on the back end, in the app and in the banner front end. |
| Dates and time zone | Everything in UTC in the database; the user's "day" is calculated in the IANA time zone saved in the profile (for example `America/Sao_Paulo`). |
| Accessibility | Touch targets of 44 px or more; `accessibilityLabel` on icon buttons; informative text with a minimum contrast of 4.5:1; support for the system font up to 130%. |
| Language | pt-BR in v1, with all texts in translation files to make English easier later. |
| Code quality | Lint with no errors or warnings in CI; a minimum coverage of 80% on the back end's business rules and 70% on the app's and the front end's logic. |

---

## 5. Architecture and repository organization

The three projects live in a single **monorepo with pnpm workspaces and Turborepo**, because the API, the app and the banner share the same Zod contracts. A changed schema breaks the typecheck of all three in the same PR, not in production.

The app talks to the API over **REST** and to the banner over **postMessage**; the banner never accesses the API. Sign-in with Google and Apple happens on the device, and only the ID token reaches the API for validation.

```
next-journey-to-do-list-gamified/
  apps/
    api/        NestJS + Prisma
    banner/     Vite + TS (game layer)
    mobile/     Expo + React Native
  packages/
    contracts/      Zod schemas and types (API, app, banner)
    eslint-config/  shared lint rules
    tsconfig/       base tsconfig
  CONTRIBUTING.md  turbo.json  pnpm-workspace.yaml  .husky/
```

There is no shared domain package: every progression rule (EXP, coins, level, chapter, streak, achievements) lives only in `apps/api/src/modules/progression/domain`. The app shows the result of the `CheckResult` and only estimates the chapter progress (the chapter's checks + 1 over the required ones) to animate the banner.

The trade-off of the monorepo is a little more initial setup (Metro with pnpm, the Turbo cache in CI) in exchange for not duplicating types. With three repositories, the contracts would have to become a versioned npm package.

---

## 6. Project 1 — Back end (apps/api)

The back end is a REST API in NestJS that concentrates all the progression rules. A check is a **single transaction** that returns EXP, level, chapter and achievements already calculated.

### Stack

| Layer | Technology | How it is used |
|---|---|---|
| Runtime | Node.js 24 LTS + TypeScript in strict mode | The same version in CI, in Docker and on the machine (`.nvmrc`). |
| Framework | NestJS 11 | One module per domain: controller → service → pure domain functions → repository. |
| Database | PostgreSQL 16+ | UUID as the key, `timestamptz` for dates, `jsonb` only for the schedule and criteria. |
| ORM and migrations | Prisma | `schema.prisma` is the source of truth; `prisma migrate` versions the schema; a seed with stories, chapters, achievements and `game_config`. |
| Validation and contracts | Zod + nestjs-zod | The schemas live in `packages/contracts` and are imported by the API and the app. |
| Authentication | `@nestjs/jwt`, argon2, google-auth-library, jose | Own JWT; the Google ID token validated by the official library; the Apple one validated with Apple's public keys through jose. |
| Configuration | `@nestjs/config` + a Zod schema for `.env` | The API does not start if a variable is missing or invalid. |
| Logs | nestjs-pino (pino + pino-http) | Detailed in [Logs](#logs). |
| HTTP security | helmet, restricted CORS, `@nestjs/throttler` | A global rate limit and a stricter one on the authentication routes. |
| Scheduled jobs | `@nestjs/schedule` | Cleanup of expired refresh tokens and the definitive removal of accounts deleted 30 days ago. |
| Email | Resend | The sign-in code and the account-deletion code. |
| Documentation | `@nestjs/swagger` | OpenAPI at `/docs`, outside production only. |
| Health | `@nestjs/terminus` | `GET /health` checks the database. |
| Tests | Jest + `@nestjs/testing` | Detailed in [Common standards](#9-common-standards-contributingmd-lint-tests-and-pre-commit). |

### Modules

| Module | Responsibility |
|---|---|
| `auth` | Email code, Google, Apple, refresh, sign out. |
| `users` | Profile, time zone, onboarding step, notification preferences, account deletion. |
| `characters` | The character's LPC layer keys and the unlocked cosmetics. |
| `categories` | CRUD with the 5 default categories created at sign-up. |
| `items` | CRUD of dailies, todos and habits, check and undo. |
| `progression` | EXP, level and coins from `game_config`, in pure functions. |
| `stories` | Catalog, active story, progress per story, chapters, choices and timeline. |
| `achievements` | Catalog and evaluation of the criteria after every check. |
| `home` | An aggregated endpoint so the Home does not make 5 calls. |

### Check flow

1. The app generates a `checkId` (UUID v4) and calls `POST /v1/items/:id/checks`. That id makes the check **idempotent**: repeating the call, or resending it through the offline queue, does not duplicate EXP.
2. In a single `prisma.$transaction`: it validates that the check is allowed (a daily already checked today, a todo completed), writes `item_checks`, updates the streak, `user_stats` and `story_progress`, and evaluates the achievements.
3. It answers with a `CheckResult`: `expGained`, `coinsGained`, `level`, `leveledUp`, `chapterProgress`, `chapterCompleted`, `achievementsUnlocked[]`.
4. It records the domain event `item.checked` in the log. `level.up`, `chapter.completed` and `achievement.unlocked` are logged when they happen.

The lateness and streak of dailies are calculated **on read and on check**, from `last_checked_on` and the user's time zone. That way there is no need for a day-rollover job for each time zone.

### Data model

| Table | Main fields |
|---|---|
| `users` | id, email (unique, optional for Apple), name, timezone, onboarding_step, notify_at, terms_accepted_at, terms_version, created_at, deleted_at |
| `auth_identities` | id, user_id, provider (google, apple), provider_user_id — unique per (provider, provider_user_id) |
| `refresh_tokens` | id, user_id, token_hash, family_id, expires_at, revoked_at |
| `characters` | user_id, name, title, skin, hair, outfit, accessory |
| `user_stats` | user_id, exp_total, level, exp_in_level, coins, total_checks, items_created |
| `categories` | id, user_id, name, color, position, deleted_at |
| `items` | id, user_id, category_id, type (daily, todo, habit), title, notes, difficulty, schedule_days, due_at, completed_at, streak_current, streak_best, last_checked_on, position, deleted_at |
| `item_checks` | id (the app's checkId), item_id, user_id, checked_on (local day), checked_at, exp, coins, counts_for_chapter, streak_before, reverted_at |
| `stories` / `chapters` | slug, name, theme_color, description, focus_tag, thumbnail_key / story_id, number, title, text, required_checks, scene_key, choice_options |
| `story_progress` | user_id, story_id, current_chapter, checks_in_chapter, is_active |
| `chapter_completions` | user_id, chapter_id, completed_at, choice |
| `achievements` / `user_achievements` | slug, name, description, icon_key, criterion, reward_key / user_id, achievement_id, unlocked_at |
| `user_cosmetics` | user_id, cosmetic_key, source |
| `game_config` | key, value (jsonb) |

### Endpoints (`/v1`)

| Method and route | What it does |
|---|---|
| `POST /auth/email/start` · `POST /auth/email/confirm` | Request the 6-digit code and trade it for the session (the account is born at the first confirmation). |
| `POST /auth/google` · `POST /auth/apple` | Receive the provider's ID token, create or link the user. |
| `POST /auth/refresh` · `POST /auth/logout` | Rotate the refresh token (reuse revokes the whole family) and end the session. |
| `GET /me` · `PATCH /me` · `DELETE /me` | Profile, statistics, character, active story and onboarding; editing; account deletion. |
| `PUT /me/character` · `GET /me/cosmetics` | Save the character's layers; list the unlocked cosmetics. |
| `GET /stories` · `PUT /me/story` | Catalog; choose or switch the active story. |
| `GET /me/story/timeline` · `POST /me/story/chapters/:id/choice` (backlog) | The chapters' timeline; record a narrative choice. |
| `GET /categories` · `POST` · `PATCH /:id` · `DELETE /:id` | Category CRUD. |
| `GET /items?type=&date=` · `POST /items` · `PATCH /items/:id` · `DELETE /items/:id` | A list that already carries the day's state (done, overdue, streak); create, edit and delete. |
| `POST /items/:id/checks` · `DELETE /items/:id/checks/:checkId` | Check and undo; both return a `CheckResult`. |
| `GET /home` | Counters, the active story and the "Para hoje" items. |
| `GET /achievements` | The catalog with progress and state for the user. |
| `GET /health` | The state of the API and the database. |

### Logs

- **nestjs-pino** as the global logger (`app.useLogger`). In production it writes one-line JSON to stdout; in development it uses pino-pretty.
- Each request gets a `requestId`: the value of `x-request-id` when it comes, or a new UUID. It goes back in the response header and shows up in every log line of that request.
- Fixed fields: `level`, `time`, `requestId`, `userId` (when authenticated), `method`, `route`, `statusCode`, `durationMs`, `context` (module).
- `redact` removes `req.headers.authorization`, `*.password`, `*.token`, `*.refreshToken`, `*.idToken` and `*.email`. **The request body is never logged.**
- Levels: `info` for requests and domain events, `warn` for relevant 4xx errors (invalid sign-in, rate limit), `error` with a stack for 5xx. `LOG_LEVEL` is configurable per environment.
- A global exception filter standardizes the error responses (`{ code, message, requestId }`) and sends the 5xx to Sentry with the `requestId`.

### Folder structure

```
apps/api/
  prisma/            schema.prisma, migrations/, seed.ts
  src/
    main.ts          bootstrap, pino, helmet, CORS, /v1 versioning
    config/          the .env Zod schema
    common/          filters, guards, interceptors, decorators
    modules/
      auth/ users/ characters/ categories/ items/
      progression/ stories/ achievements/ home/
        *.controller.ts  *.service.ts  *.repository.ts
        domain/          pure functions + *.spec.ts
  test/              e2e (supertest)
  CONTRIBUTING.md  Dockerfile  .env.example
```

---

## 7. Project 2 — Banner (apps/web)

The web front end is the pixel art banner: an HTML/CSS/TypeScript page, **with no game engine**, that runs inside `react-native-webview` and only reacts to messages from the app. The recommendation is to package it as **a single HTML file** embedded in the app. That way it works offline, ships versioned together with the app and can be updated through EAS Update without going through the store.

### Stack

| Item | Technology | How it is used |
|---|---|---|
| Build | Vite + TypeScript (no UI framework) | The banner has few elements; without React, the bundle stays small and opening inside the WebView is fast. |
| Packaging | `vite-plugin-singlefile` | Generates an `index.html` with the JS, CSS and sprites embedded, copied to `apps/mobile/assets/banner/` at build. |
| Animation | CSS `@keyframes` + `steps()` on spritesheets | A 9-frame walk, a run, a chapter fade; only `transform` and `opacity`, to run on the GPU. |
| Sprites | 64 × 64 per frame LPC sheets | One layer per part (body, hair, outfit, accessory), stacked with the same animation and `image-rendering: pixelated`. |
| Sceneries | 3 parallax layers + a ground of 16 px tiles | Each layer slides at a different speed while the character walks. |
| Contracts | `packages/contracts` (Zod) | The message types are the same as the app's, validated on input. |
| Tests | Vitest + jsdom | The scene state machine and the message handling. |
| Errors | Sentry Browser SDK | WebView errors sent with the banner version. |

### Scenes

- **HQ (Home, 390 × 220):** the inside of the cabin, the character standing and facing front. The scene varies between morning, afternoon and night through the `timeOfDay` received from the app.
- **Map (tabs, 390 × 180):** a side-view scenery of the current chapter, the character seen from the side walking from right to left. The position on the X axis is the chapter progress, with a 600 ms transition.
- Native art at half the resolution (195 × 90 and 195 × 110), displayed at 2×.

### Message protocol

Every message follows the format `{ v: 1, type, payload }` and is validated with Zod on both sides. An invalid message is discarded and generates an `ERROR` event.

| Direction | Type | Payload | Effect |
|---|---|---|---|
| App → Banner | `INIT` | scene (`qg` or `map`), character layers, `sceneKey`, `progress` (0 to 1), `timeOfDay` | Builds the scene at the saved position, with no entrance animation. |
| App → Banner | `ITEM_CHECKED` | the new `progress` | A 5 s run to the new position, then back to the walk. It is the same event for the 3 item types. |
| App → Banner | `CHAPTER_COMPLETED` | the next `sceneKey` | The character reaches the left edge, a fade to black, the new scene loads and he enters from the right. |
| App → Banner | `SET_CHARACTER` | character layers | Swaps the layers without reloading the scene. |
| App → Banner | `SET_TIME_OF_DAY` | `morning`, `afternoon` or `night` | Changes the HQ lighting. |
| App → Banner | `PAUSE` / `RESUME` | — | Pauses the animations when the tab loses focus or the app goes to the background. |
| Banner → App | `READY` | banner version | The app only sends `INIT` after this. |
| Banner → App | `CHAPTER_TRANSITION_DONE` | — | The app opens the chapter modal. |
| Banner → App | `ERROR` | code and message | The app logs it and shows the static fallback image. |

### Development

- `pnpm --filter banner dev` opens the page in the browser with a debug panel (`/dev.html`) that fires each message, to work without the app.
- The banner **makes no network requests and keeps no state of its own**: everything comes from the app. That makes testing easier and avoids divergence from the back end.
- If the WebView fails or takes more than 2 s to send `READY`, the app shows the static PNG image of the scene.

```
apps/web/
  src/
    main.ts          listens to messages, validates and dispatches
    scene/           qg.ts, map.ts, state-machine.ts (+ *.test.ts)
    character/       composition of the LPC layers
    styles/          animations and parallax
  public/sprites/    LPC sheets and tilesets (with CREDITS.md)
  dev.html           debug panel
  CONTRIBUTING.md  vite.config.ts
```

---

## 8. Project 3 — App (apps/mobile)

The app is built with React Native and Expo, using a **development build** (not Expo Go), because Google sign-in, Apple sign-in, the WebView and Sentry need native code. It implements the design system's screens (see [gaps](#11-screens-missing-from-figma)) and the optimistic check flow.

### Stack

| Item | Technology | How it is used |
|---|---|---|
| Base | The latest stable Expo SDK + React Native (New Architecture) + TypeScript strict | A project created with `create-expo-app`, configured by `app.config.ts`. |
| Navigation | Expo Router | File-based routes, with the groups `(auth)`, `(onboarding)` and `(tabs)`. The root layout redirects according to the session and the onboarding step. |
| Server data | TanStack Query | A cache per screen, an optimistic update on check, a rollback on error and a persisted cache to open fast. |
| Local state | Zustand | Session, the offline queue of checks and the modal queue (level, achievement, chapter). |
| HTTP | axios | An interceptor that injects the access token and renews through the refresh token on a 401, with a single renewal at a time. |
| Forms | react-hook-form + Zod (`packages/contracts`) | The same validation rules as the API. |
| Storage | `expo-secure-store` (tokens) and AsyncStorage (cache and flags) | Nothing sensitive outside SecureStore. |
| Social sign-in | `@react-native-google-signin/google-signin` and `expo-apple-authentication` | The app gets the ID token and sends it to `/auth/google` or `/auth/apple`. |
| Banner | `react-native-webview` | Loads the single HTML of `apps/web` and talks through `postMessage` (see [Project 2](#7-project-2--banner-appsbanner)). |
| Animation and feedback | `react-native-reanimated` + `expo-haptics` | The checkbox pop, the EXP toast, the progress bars and a light vibration on check. |
| Visual | Design system tokens in `src/theme`, `expo-font` with Inter and Press Start 2P, `@tabler/icons-react-native` | No ready-made UI library; the components follow the Components board. |
| Notifications | `expo-notifications` | Only scheduled local reminders in v1 (RF-39). |
| Connectivity | `@react-native-community/netinfo` | Triggers the offline queue sync (RF-40). |
| Language | i18next + `expo-localization` | Texts in `src/i18n/pt-BR.json`. |
| Errors | `@sentry/react-native` | The Expo plugin, with source map upload on EAS Build. |
| Build and distribution | EAS Build, EAS Submit and EAS Update | The `development`, `preview` and `production` profiles; OTA for JS and banner fixes. |
| Tests | Jest (jest-expo) + React Native Testing Library | Detailed in [Common standards](#9-common-standards-contributingmd-lint-tests-and-pre-commit). Maestro for E2E is desirable. |

### Routes and structure

```
app/
  _layout.tsx               providers, fonts, splash, redirection
  (auth)/                   welcome, email, code
  (onboarding)/             tutorial, character, story
  (tabs)/_layout.tsx        bottom nav (5 tabs, a badge on Dailies)
  (tabs)/                   index (Home), dailies, todos, habits, profile
  item/new.tsx              creation bottom sheet
  item/[id].tsx             editing
  story/timeline.tsx        "Minha história"
  achievements.tsx
  settings/                 theme, categories, account, notifications, about
src/
  api/        axios client + TanStack Query hooks per resource
  features/   auth, items, progression, story, achievements (logic + tests)
  components/ Button, Input, Checkbox, TaskCard, HabitCard, ProgressBar,
              FilterPill, Fab, BottomSheet, ExpToast, LevelBadge,
              StoryHeader, AchievementModal, ChapterModal, BottomNav
  banner/     BannerView + a typed bridge
  theme/      color, typography and spacing tokens
  store/      Zustand (session, offline queue, modal queue)
  i18n/
```

### Check flow in the app

1. Tapping the checkbox triggers the vibration and the 180 ms animation, and applies the optimistic update to the cache (only the checked item; the app does not calculate EXP).
2. The app sends `ITEM_CHECKED` to the banner with the predicted progress and calls `POST /v1/items/:id/checks` with the `checkId`.
3. With the response, the cache is reconciled from the `CheckResult` and the EXP toast appears. Level-ups and achievements go into the modal queue, shown one at a time.
4. If `chapterCompleted` comes back true, the app sends `CHAPTER_COMPLETED` and opens the chapter modal when it receives `CHAPTER_TRANSITION_DONE`.
5. On a network error, the check goes into the offline queue and stays checked. On a rule error (4xx), the app undoes the optimism and shows the reason.

---

## 9. Common standards: CONTRIBUTING.md, lint, tests and pre-commit

The three projects share the same quality base, configured once at the monorepo root and extended in each app. No commit gets in without passing lint and formatting, and no push goes out without the typecheck and tests of the affected packages.

| Item | Tool | Configuration |
|---|---|---|
| Lint | ESLint 9 (flat config) + typescript-eslint | A base config in `packages/eslint-config` (type-checked rules, simple-import-sort, eslint-config-prettier). The API extends it with Node rules, the app with `eslint-config-expo` and the banner with browser globals. |
| Formatting | Prettier | A single `.prettierrc` at the root: single quotes, trailing comma, 100 columns. |
| Types | `tsc --noEmit` | A base tsconfig with `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. |
| Tests (API) | Jest + `@nestjs/testing` | Unit tests in `domain/*.spec.ts` (progression, streak, chapter, achievements) and services with a mocked repository. E2E with supertest + Testcontainers (a real Postgres) is desirable. A minimum coverage of 80% in `domain/`. |
| Tests (app) | Jest (jest-expo) + React Native Testing Library | Design system components, the check hooks (optimism and rollback), the offline queue and the banner bridge. A minimum coverage of 70% in `src/features`. |
| Tests (banner) | Vitest + jsdom | The scenes' state machine and message validation. |
| Pre-commit | Husky + lint-staged | `eslint --fix` and `prettier --write` only on the staged files. |
| Commit message | commitlint (Conventional Commits) | The `commit-msg` hook: `feat(api): ...`, `fix(mobile): ...`, `chore(banner): ...`. The subject starts in lowercase. |
| Pre-push | Husky | `turbo run typecheck test --filter=...[origin/main]`, only on the changed packages. |
| CI | GitHub Actions | On every PR: lint, typecheck, tests, build and a security scan; `prisma validate` and a migrations check on the API; `expo-doctor` on the app. |

### Actual pre-commit configuration (Phase 1)

```jsonc
// package.json (root)
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --flag v10_config_lookup_from_file --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{js,json,md,yml}": ["prettier --write"]
  }
}
```

The `v10_config_lookup_from_file` flag makes ESLint 9 look for `eslint.config.js` near each file (the ESLint 10 default); without it, lint-staged, which runs from the root, does not find the packages' configuration.

```sh
# .husky/pre-commit
pnpm exec lint-staged
# .husky/commit-msg
pnpm exec commitlint --edit "$1"
# .husky/pre-push
pnpm exec turbo run typecheck test --filter="...[origin/main]"
```

### CONTRIBUTING.md

There is a `CONTRIBUTING.md` at the root, with the monorepo's rules, and one in each app, with what is specific to it. The current content is in the root [CONTRIBUTING.md](../CONTRIBUTING.md) itself (stack, commands, mandatory rules, the security checklist and the requirement of a review and a secret scan before every PR). The per-app files hold the local commands (for example `npx expo start --dev-client`, `pnpm --filter banner dev`) and the specific rules: modules and logs on the API; banner messages always validated by the contract; in the app, nothing sensitive outside SecureStore.

---

## 10. Step by step: create the app with Expo for iOS and Android

The recommended path is **Continuous Native Generation**: the `ios/` and `android/` folders do not go to Git and are generated from `app.config.ts`. The builds run on EAS, so the iOS build can be generated even without a Mac; the Mac is only needed to run the simulator locally. The versions are not pinned here: `npx expo install` picks the ones compatible with the installed SDK.

### 10.1 Prerequisites

- Node.js 24 LTS and pnpm (`corepack enable`).
- An Expo account (expo.dev) and `eas-cli`: `npm i -g eas-cli && eas login`.
- **iOS:** macOS with Xcode and a simulator (to run locally); a paid Apple Developer Program account (for a physical device and the store).
- **Android:** Android Studio with the SDK, an emulator and JDK 17; a Google Play Console account.

### 10.2 Monorepo

**Already done in Phase 1** (pnpm workspace, Turborepo, shared packages, lint, hooks and CI). The monorepo creation commands do not need to be repeated. The only note from Expo with pnpm: if Metro does not resolve dependencies, add `node-linker=hoisted` to an `.npmrc` at the root. Test without it first; recent Expo versions work with pnpm's default isolation.

### 10.3 Create the Expo project

```bash
cd apps
pnpm create expo-app@latest mobile --template default   # already comes with Expo Router + TypeScript
cd mobile
pnpm run reset-project   # removes the example screens and leaves app/ clean
```

### 10.4 Install the dependencies

```bash
# native: always through expo install, to get the version compatible with the SDK
npx expo install expo-dev-client expo-secure-store expo-font expo-haptics \
  expo-notifications expo-localization expo-apple-authentication expo-asset expo-file-system \
  react-native-webview react-native-reanimated react-native-svg \
  @react-native-async-storage/async-storage @react-native-community/netinfo \
  @react-native-google-signin/google-signin @sentry/react-native

# JavaScript only
pnpm add @tanstack/react-query zustand axios react-hook-form @hookform/resolvers zod \
  i18next react-i18next @tabler/icons-react-native \
  @expo-google-fonts/inter @expo-google-fonts/press-start-2p

# tests
pnpm add -D jest-expo jest @testing-library/react-native @types/jest
```

### 10.5 Configure `app.config.ts`

```ts
import type { ExpoConfig } from 'expo/config';

const IS_PROD = process.env.APP_VARIANT === 'production';

const config: ExpoConfig = {
  name: IS_PROD ? 'Next Journey' : 'Next Journey (dev)',
  slug: 'next-journey',
  scheme: 'nextjourney',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: IS_PROD ? 'br.com.wetechhub.app' : 'br.com.wetechhub.app.dev',
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: IS_PROD ? 'br.com.wetechhub.app' : 'br.com.wetechhub.app.dev',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#1A1A2E' },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-apple-authentication',
    'expo-notifications',
    ['expo-splash-screen', { image: './assets/splash.png', backgroundColor: '#1A1A2E' }],
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: 'com.googleusercontent.apps.YOUR_IOS_CLIENT_ID' },
    ],
    '@sentry/react-native/expo',
  ],
  extra: { eas: { projectId: 'filled in by eas init' } },
};

export default config;
```

The bundle id and the package above are the ones **defined on 2026-10-02**. They become immutable from the first iOS build with Apple credentials. The API URL comes from `EXPO_PUBLIC_API_URL`, defined per environment on EAS (step 10.7).

### 10.6 EAS: project and build profiles

```bash
eas init              # creates the project on Expo and writes the projectId
eas build:configure   # generates eas.json
```

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "ios": { "simulator": true }
    },
    "development-device": { "extends": "development", "ios": { "simulator": false } },
    "preview": { "distribution": "internal", "environment": "preview", "channel": "preview" },
    "production": {
      "environment": "production",
      "channel": "production",
      "autoIncrement": true,
      "env": { "APP_VARIANT": "production" }
    }
  },
  "submit": { "production": {} }
}
```

### 10.7 Variables and secrets

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value https://api-dev.example.com --environment development
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.example.com --environment production
eas env:create --name SENTRY_AUTH_TOKEN --value <token> --environment production --visibility secret
```

> `EXPO_PUBLIC_*` is public (it is embedded in the app). **Never** put a secret in a variable with that prefix. `SENTRY_AUTH_TOKEN` and the other secrets stay as `secret` on EAS and in the password vault, never in the repository.

### 10.8 Social sign-in credentials

1. **Apple:** in the Apple Developer account, enable Sign in with Apple on the App ID. `usesAppleSignIn` and `eas build` take care of the entitlement and the certificates (`eas credentials` manages everything).
2. **Google:** in the Google Cloud Console, create three OAuth Client IDs: **Web** (the back end validates the ID token against it and the app uses it as `webClientId`), **iOS** (bundle id) and **Android** (package + the keystore's SHA-1, which shows up in `eas credentials -p android`).
3. Put the iOS client in the plugin's `iosUrlScheme` and the IDs in `EXPO_PUBLIC_*` variables (client ids are public; secrets are not).

### 10.9 Run in development

```bash
# option A: a cloud build
eas build --profile development --platform ios        # .app for the simulator
eas build --profile development --platform android    # .apk for an emulator or device
eas device:create                                     # registers test iPhones
eas build --profile development-device --platform ios

# option B: a local build (generates temporary ios/ and android/)
npx expo run:ios
npx expo run:android

# once the dev build is installed, the day to day is just:
npx expo start --dev-client
```

`ios/` and `android/` are already in `.gitignore` to keep CNG. A new dev build is only needed when a native dependency comes in or `app.config.ts` changes.

#### Test the production configuration before the store

```bash
eas build --profile preview --platform android    # .apk, internal distribution
eas build --profile preview --platform ios        # needs the test iPhones registered with eas device:create
```

The `preview` profile uses the `production` EAS environment and the production variant, so it starts only with an https API URL and shows the configuration error screen otherwise. It does not increment the build number and is never submitted to a store.

### 10.10 Embed the banner

1. `pnpm --filter banner build` generates the single `index.html`; a Turbo script copies it to `apps/mobile/assets/banner/banner.html`.
2. In `metro.config.js`, add `html` to `resolver.assetExts`.
3. `BannerView` loads the file with `expo-asset`, reads the content with `expo-file-system` and passes it to the WebView as `source={{ html }}`.

### 10.11 Lint, tests and Sentry in the app

```bash
npx expo lint                       # creates eslint.config.js with eslint-config-expo
npx expo-doctor                     # checks the dependencies' compatibility
npx @sentry/wizard@latest -i reactNative
```

In the app's `package.json`: `"jest": { "preset": "jest-expo" }` and the scripts `lint`, `typecheck` (`tsc --noEmit`) and `test`, which Turbo calls from the root.

### 10.12 Publish to the stores

```bash
eas build --profile production --platform all
eas submit --platform ios       # sends to App Store Connect / TestFlight
eas submit --platform android   # sends to the Play Console internal track
eas update --channel production --message "fix X"   # OTA for JS and the banner
```

Before the first submission:

- [ ] Create the app in App Store Connect and the Play Console with the final bundle id and package.
- [ ] Publish the URL of the Privacy Policy and the Terms of Use.
- [ ] Fill in App Privacy (Apple) and Data safety (Google).
- [ ] Confirm that account deletion works inside the app (RF-08).
- [ ] On Android, if the Play Console requires it, do the first `.aab` upload manually.

---

## 11. Screens missing from Figma

From the design record in Figma (not yet checked against the file, which is now called Next Journey):

- Achievements (RF-32).
- The achievement modal (RF-33; it can start from the Level Up Modal).
- "Minha história" (RF-29).
- Categories (RF-23).
- Settings (RF-38: theme color, account, notifications, about).
- Acceptance of the Terms at sign-up (screen 03).
- LPC credits.

**Delete account (RF-08)** will not have a dedicated screen: it will be an "Excluir conta" row in Settings › Account, with a confirmation dialog.

---

## 12. Out of scope and open decisions

### Out of v1

- **Product phase 2:** + and − buttons on habits, a social layer (feed, follow, share), external sharing, a store and equipment, skills, HQ decoration evolving by level, tapping the banner to customize the HQ, celebration and character-retreat animations, remote push.
- **Backlog:** narrative choices and the choice of the next map (RF-31), HP and penalties, an NPC dialogue box, a stumble animation, trading points for real rewards, a light theme, a content admin panel.

### Decisions

| State | Decision |
|---|---|
| ✅ | The name Next Journey; bundle id `br.com.wetechhub.app` (dev: `.app.dev`), decided on 2026-10-02. |
| ✅ | No limit of checks per habit, decided on 2026-10-02. |
| ✅ | Narrative choices (RF-31) out of v1, in the backlog (2026-10-02). In v1 the banner scene only changes as the chapter advances. |
| ✅ | Hosting: our own VPS, in Docker, with its own Postgres (2026-10-02; rules in the plan). Email provider: Resend. |
| ✅ | A single monorepo, decided on 2026-10-02. |
| ⏳ | Validate the `game_config` values: EXP per difficulty, the level curve and checks per chapter. |
| ⏳ | Chapters per story in v1 (5 suggested): that is 25 texts and 25 sceneries in total; biomes can be reused across chapters of the same story. |
| ⏳ | Confirm the proposed [complementary rules](#complementary-rules-proposed-on-2026-10-02-to-be-confirmed). |
| ⏳ | Choose the license of the open project (code and LPC art). |
