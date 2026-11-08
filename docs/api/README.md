# API: internal documentation

How the API (`apps/api`, NestJS + Prisma + PostgreSQL) works inside. These documents hold the **business and operating rules** that used to live in long code comments; the code keeps only short comments, when the reason for a line is not obvious (rules 11 and 12 of `CONTRIBUTING.md`).

| Document                                                       | Subject                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [autenticacao-e-sessoes.md](autenticacao-e-sessoes.md)         | signup, email confirmation, login, password, social login, tokens, sessions, attempt limits     |
| [progressao-e-jogo.md](progressao-e-jogo.md)                   | EXP, levels, coins, chapters, streaks, achievements                                             |
| [itens-e-checks.md](itens-e-checks.md)                         | items, categories, check and uncheck, history                                                   |
| [conta-e-privacidade.md](conta-e-privacidade.md)               | account deletion, purge and data export                                                         |
| [operacao-e-seguranca.md](operacao-e-seguranca.md)             | guard, errors, logs, security events, environment variables                                     |

They complement, without repeating:

- decisions and reasons: `docs/adr/` (mainly [ADR-0008](../adr/0008-autenticacao-e-sessao.md));
- per-PR security checklist: [`CONTRIBUTING.md`](../../CONTRIBUTING.md);
- collected data and retention periods: [`docs/PRIVACIDADE.md`](../PRIVACIDADE.md);
- product requirements: [`docs/REQUISITOS.MD`](../REQUISITOS.MD);
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
| `common`, `config`, `prisma`                                       | guard, filters, pipes, clock, environment, database                                     |
