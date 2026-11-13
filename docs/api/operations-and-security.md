# API operation and security

Code in `apps/api/src/common`, `config`, `modules/security`, `app.module.ts` and `setup-app.ts`. Per-PR security checklist: [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Global guard (`JwtAuthGuard`)

Every route is born **protected**; `@Public()` marks the exception. The guard validates the access JWT (fixed algorithm HS256) and checks that the account still exists (primary key lookup, no cache), so a deleted account loses access at once, without waiting for the 15 minutes of the token.

- The user id and the session id are UUIDs: anything else never reaches the database.
- With `sid`, the session must still be active: ending a device (or signing out) drops the access token at once, in the same query. An old token without `sid` only checks the account.
- A database error in the guard **does not become 401**: it denies with 5xx, because a temporary failure must not log the app out, which treats 401 as an ended session.

## Errors and validation

- Every error response has the format `{ code, message, requestId }`. A business rule error (`AppError`) has a stable code: the app picks the message by `code`. **5xx never leaks details**; the unexpected error is logged with the stack, without the request body.
- Input is validated with the contract Zod schema; the error never returns the received value.

## Logs

- Pino, one `requestId` per request: it uses the received `x-request-id` if valid, or generates a UUID, and returns it in the header.
- Only **metadata** (id, method, URL without query, status): the request body is never logged.
- Defense in depth: even if something is logged by mistake, `authorization`, `cookie`, `password`, `token`, `refreshToken`, `accessToken` and `idToken` are redacted.
- The email recipient is never logged; the text (with code or link) only goes to the log with `NODE_ENV=development` and without `RESEND_API_KEY`, where no email goes out; in other environments without a key, only the notice that the email was not sent is logged.

## Security events

`SecurityEvents` writes one structured line per event (`security` field), counts per type in a sliding window and alerts when it passes the limit. The events have fixed names and **never** carry email, password, token or request body; the IP is masked (IPv4 loses the last number, IPv6 keeps the first two groups).

| Event                      | Alert when it exceeds | Window |
| -------------------------- | --------------------- | ------ |
| `rate_limited`             | 100                   | 5 min  |
| `refresh_reuse_detected`   | 5                     | 10 min |
| `reauth_failed`            | 10                    | 10 min |

The alert goes to the log at `error` level with `alert: true` (once per window) and, if `SECURITY_ALERT_WEBHOOK_URL` is set, in a POST with a short text (type, count, window), with no personal data. A webhook failure does not affect the API. The count is **per instance**.

## HTTP layer

- Throttler per IP per minute: general (`THROTTLE_LIMIT`, 120) and, only on the authentication routes, a stricter one (`THROTTLE_AUTH_LIMIT`, 10).
- `helmet` on. The Swagger page uses inline scripts, so the CSP only relaxes when it is on.
- CORS with an explicit list (`CORS_ORIGINS`); with no list, no web origin is accepted (the native app does not need it).
- Behind a reverse proxy, `TRUST_PROXY=true` makes the API trust the first hop, so the limit sees the real IP.
- `/v1` versioning; the health endpoint is at the root and is public, with no sensitive data.

## Environment variables

The API **does not start** if a required one is missing or invalid, and the error message lists only the **names**, never the values. Commented template: `apps/api/.env.example`. An optional one left empty (`KEY=`) counts as absent.

| Variable                                                  | Purpose                                                               | Default                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`, `JWT_ACCESS_SECRET` (32+ characters)      | required                                                              | (none)                                         |
| `NODE_ENV`, `HOST`, `PORT`, `LOG_LEVEL`                   | runtime                                                               | `development`, `127.0.0.1`, `3000`, `info`     |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_KEY_ID`                | issuer, audience and `kid` of the current key                         | `nextjourney-api`, `nextjourney-app`, `k1`     |
| `JWT_ACCESS_SECRET_PREVIOUS`, `JWT_PREVIOUS_KEY_ID`       | previous key, valid until the token ends during a secret rotation     | empty                                          |
| `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS`      | token validity                                                        | 900, 365                                       |
| `RESEND_API_KEY`, `MAIL_FROM`                             | transactional email; without a key nothing is sent (development)      | empty                                          |
| `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_ID`                    | public social login ids; empty = feature unavailable                  | empty                                          |
| `CORS_ORIGINS`, `TRUST_PROXY`                             | HTTP layer                                                            | empty, `false`                                 |
| `THROTTLE_LIMIT`, `THROTTLE_AUTH_LIMIT`                   | requests per minute per IP                                            | 120, 10                                        |
| `AUTH_MIN_RESPONSE_MS`                                    | time floor of the anti-enumeration routes (0 only outside production, ceiling of 5000) | 250                          |
| `ACCOUNT_PURGE_DAYS`                                      | days until a deleted account is removed for good                      | 30                                             |
| `SECURITY_ALERT_WEBHOOK_URL`                              | optional notice of an abnormal count (https)                          | empty                                          |
| `SEED_STARTER_ITEMS`                                      | creates the starter items when the account becomes valid              | `true`                                         |
| `LEGAL_CONTACT_EMAIL`                                     | contact for data requests, shown in the legal texts; without it the contact section is omitted | empty                          |
| `REVIEW_ACCOUNT_EMAIL`, `REVIEW_ACCOUNT_CODE`             | store review account: fixed 6-digit sign-in code for that one email, no email sent; both or neither | empty                  |

## JWT secret rotation

The access token carries issuer (`iss`), audience (`aud`) and the key identifier (`kid`). Verification accepts the current key and, during a rotation, the previous one. Access tokens last 15 minutes, so the window is short. Procedure, without values:

1. Generate a new secret (at least 32 characters) and store it in the secrets manager.
2. In the API environment: move the current secret to `JWT_ACCESS_SECRET_PREVIOUS` and the current `JWT_KEY_ID` to `JWT_PREVIOUS_KEY_ID`; put the new secret in `JWT_ACCESS_SECRET` and a new `JWT_KEY_ID` (different from the previous one).
3. Restart the API. Tokens issued with the previous key stay valid until they expire; new ones already come out with the new key.
4. After at least the token lifetime (15 minutes), remove `JWT_ACCESS_SECRET_PREVIOUS` and `JWT_PREVIOUS_KEY_ID` and restart again.
5. If the secret leaked: skip the wait, remove the previous key at once (everyone signs in again through refresh) and revoke the refresh tokens if misuse is suspected.

Changing `JWT_ISSUER` or `JWT_AUDIENCE` invalidates all tokens in circulation; the app renews on its own through the refresh token.
