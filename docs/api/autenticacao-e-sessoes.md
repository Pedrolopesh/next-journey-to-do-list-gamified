# Authentication and sessions

Code in `apps/api/src/modules/auth`. The decisions and reasons are in [ADR-0008](../adr/0008-autenticacao-e-sessao.md); here is what each part does.

## Email code sign-in

This is how the app signs in. Two steps, with no separate signup and no password:

1. `POST /v1/auth/email/start` (`{ email, timezone?, termsVersion? }`) always answers `202`, with no body, whether the account exists or not. A new email creates a **pending account** (provisional name taken from the part before the `@`); every email receives a 6-digit code, respecting the 60 s interval between sends. Limit: 10 per email and IP per hour and 30 per email per hour (the app lets the user ask again every 60 s). Asking again invalidates the previous code.
2. `POST /v1/auth/email/confirm` (`{ email, code }`) exchanges the code for the session. The first confirmation sets `emailVerifiedAt` and creates the starter items, in the same transaction that consumes the code; later ones only return the session. Every failure (wrong, expired or used code, or an email with no account) answers `400 INVALID_VERIFICATION_CODE`, the same way.

The code has 6 digits, is valid for 15 minutes and is **single use**. Only the hash (`sha256(userId:code)`) is stored in the database. Five wrong attempts invalidate the code. Each attempt is reserved by a conditional `UPDATE`, so parallel requests do not exceed the limit of 5: do not swap it for read-then-write. If anything fails after the code is checked, the account stays pending and the same code stays valid.

There is no password sign-in: the code proves ownership of the email, for new and old accounts alike.

## Social login (Google and Apple)

- The app sends only the ID token; the API validates it **on the server** (issuer, audience, validity). An invalid token never details the reason.
- First access: creates the account and requires accepting the terms. The account is born confirmed and receives the starter items.
- Links to the existing account when the email verified by the provider matches. If the account never confirmed the email (it was created by a code request), whoever asked for the code did not prove they own it: the account is confirmed (and receives the examples), and the open sessions and codes stop working.
- Without an email verified by the provider, it never creates or links.

## Tokens

- **Access:** short JWT (HS256, 900 s by default, `ACCESS_TOKEN_TTL_SECONDS`) with a fixed issuer and audience and the session id (`sid`). The `kid` header only chooses which key to try (the current or the previous one, during a secret rotation); the signature decides. Rotation procedure: `docs/api/operacao-e-seguranca.md`, section "JWT secret rotation".
- **Refresh:** random `<id>.<secret>`, 365 days by default (`REFRESH_TOKEN_TTL_DAYS`), renewed on every rotation: the session only ends with "Sair" (sign out), account deletion, revocation in "Sessões" (sessions) or detected reuse; only the `sha256` of the secret is stored.
- **Atomic rotation:** on every refresh the token is swapped. The conditional `UPDATE` (`revokedAt` null and still valid) lets only **one** of several simultaneous requests with the same token through; the one that loses is treated as **reuse** and revokes the whole family (a sign of a stolen token). A transaction conflict under concurrency denies (fail closed); any other error (database down) goes on as 5xx, so the app does not treat a temporary failure as an ended session.
- **Logout** revokes the family of the given refresh token; it is silent if the token is invalid.

## Sessions (devices)

A session is a **family of refresh tokens**: rotation swaps the token and keeps the family, so the list shows one item per device. The name comes from the `X-Device-Name` header (encoded by the app; the API decodes it, strips control characters, collapses spaces and limits the length; it only becomes text on screen). Everything filters by owner: someone else's id is `404`. Ending a session is safe to repeat. If it is the current one, it is the same as signing out.

## Attempt limits

Besides the Throttler per-IP limit (`THROTTLE_LIMIT` and `THROTTLE_AUTH_LIMIT`), each account route has **two levels**, stored in Postgres (they hold across instances and survive a deploy). The email + IP level makes whoever abuses lock only themselves; the higher per-email ceiling protects against an attack coming from many IPs without letting a stranger easily lock someone else's account. The count depends only on the email typed (whether or not the account exists), so the excess answers the same (`429`). The key is a hash: no email or IP is stored in the database.

| Route          | per email + IP | per email    |
| -------------- | -------------- | ------------ |
| code request   | 10 in 1 h      | 30 in 1 h    |
| confirm code   | 10 in 15 min   | 40 in 15 min |

## Response time and enumeration

The routes that answer the same for an existing and a missing account have a time floor (`AUTH_MIN_RESPONSE_MS`, 250 ms by default; `0` only outside production): the extra work of one case (saving, sending email) disappears inside the floor. In addition, the dummy password hash takes the same time when the email does not exist.

## Daily cleanup

Every day at 03:30, it removes what only grows: refresh tokens and confirmation codes **expired for more than 7 days** (a revoked refresh token still within its validity stays, because it is what reveals the reuse of a stolen token) and the attempt-limit counters older than 1 day. It deletes in batches and is idempotent, so two instances together do not get in each other's way. Only the error class and code go to the log.
