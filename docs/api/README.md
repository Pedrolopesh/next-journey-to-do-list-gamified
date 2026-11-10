# API: internal documentation

How the API (`apps/api`, NestJS + Prisma + PostgreSQL) works inside. These documents hold the **business and operating rules** that used to live in long code comments; the code keeps only short comments, when the reason for a line is not obvious (rules 11 and 12 of `CONTRIBUTING.md`).

| Document                                                       | Subject                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [authentication-and-sessions.md](authentication-and-sessions.md)         | email code sign-in, social login, tokens, sessions, attempt limits     |
| [progression-and-game.md](progression-and-game.md)                   | EXP, levels, coins, chapters, streaks, achievements                                             |
| [items-and-checks.md](items-and-checks.md)                         | items, categories, check and uncheck, history                                                   |
| [account-and-privacy.md](account-and-privacy.md)               | account deletion, purge and data export                                                         |
| [operations-and-security.md](operations-and-security.md)             | guard, errors, logs, security events, environment variables                                     |

They complement, without repeating:

- decisions and reasons: `docs/adr/` (mainly [ADR-0008](../adr/0008-authentication-and-session.md));
- per-PR security checklist: [`CONTRIBUTING.md`](../../CONTRIBUTING.md);
- collected data and retention periods: [`docs/PRIVACIDADE.md`](../PRIVACIDADE.md);
- product requirements: [`docs/REQUIREMENTS.md`](../REQUIREMENTS.md);
- required behavior, per capability: `openspec/specs/`.

## Module map

| Folder in `apps/api/src`                                           | Responsibility                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `modules/auth`                                                     | signup, login, tokens, sessions, attempt limits, daily cleanup                          |
| `modules/progression/domain`                                       | game rules as pure functions (EXP, level, undo, streak, achievements, dates)            |
| `modules/items`                                                    | items, check and uncheck, history, starter items                                        |
| `modules/achievements`                                             | evaluation and delivery of achievements                                                 |
| `modules/stories`, `modules/me`, `modules/home`, `modules/categories` | stories, profile and character, home screen, categories                              |
| `modules/account`                                                  | deletion, purge and export                                                              |
| `modules/security`                                                 | security events and alerts                                                              |
| `modules/legal`                                                    | Terms of Use and Privacy Policy as text (JSON for the app, HTML for the stores)         |
| `common`, `config`, `prisma`                                       | guard, filters, pipes, clock, environment, database                                     |
