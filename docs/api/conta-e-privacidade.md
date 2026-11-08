# Account and privacy in the API

Code in `apps/api/src/modules/account`. Collected data, rights and retention periods: [`docs/PRIVACIDADE.md`](../PRIVACIDADE.md). Here is the mechanism.

## Account deletion (`DELETE /v1/me`)

1. **Second proof** before deleting: the current password (account with a password), the 6-digit code received by email (requested at `/auth/email/start`; works for any account) or a fresh provider ID token, from an identity linked to the account (social-only account). The ID token must have been issued at most 5 minutes ago (the owner is present now); without `iat` the token is rejected. Each attempt counts (5 every 15 minutes). Any failure gives the same `403 REAUTH_FAILED`, never `401`, so the app does not treat it as an ended session.
2. **Anonymizes at once:** removes everything that identifies the person and ends the sessions. The original email is freed (the person can sign up again); the rest of the data goes away in the purge.
3. **Daily purge** (03:00): deletes for good, cascading to the child tables, accounts deleted more than `ACCOUNT_PURGE_DAYS` ago (30 by default) and also password signups that never confirmed the email for more than 7 days (the codes go in cascade).

## Onboarding data

Goal, age range, gender, character class and the reminders choice (`remindersOptIn`) live in `users` and `characters`. Age and gender are **optional** (the app has "Pular", skip) and nothing depends on them. Only the user reads them (`GET /v1/me`); they are included in the export and erased when the account is anonymized.

## Data export (`GET /v1/me/export`)

Right of access (LGPD). Each table enters through an **allowlist of fields** (explicit `select`): never the whole model and never a password hash, token, code or provider id. Everything filters by the token `userId`. Limit of 3 exports per hour per account.
