# ADR-0008: authentication, tokens and session

> Update of 2026-11-09: the password parts of this record were removed; sign-in is only by email code, Google and Apple (see `openspec/specs/email-code-login` and the change `remover-endpoints-de-senha`). The text below is the history of the original decision.

- Date: 2026-10-09
- Status: accepted
- Plan phase: Phase 4, steps 7 and 10

## Context

The app has to keep the user signed in securely, in a public repository (the design has to hold up against someone who reads all the code).

## Decision

- **Password:** argon2id. A sign-in with a missing email takes the same time and returns the same response as a wrong password (no enumeration).
- **Access token:** HS256 JWT valid for 15 minutes, with the algorithm pinned at verification (`alg: none` and algorithm swaps are refused). A secret of at least 32 characters, coming from the environment and validated at startup.
- **Refresh token:** a random `<id>.<secret>`; only the sha256 of the secret is stored in the database, compared in constant time. Valid for 365 days, renewed on every rotation (the session only ends with "Sair", deletion, revocation or detected reuse; decision of 2026-10-31).
- **Rotation with theft detection:** each refresh invalidates the used token and issues another in the same family. Reusing an already used token **revokes the whole family**.
- **On the device:** only the refresh token is stored, in SecureStore (Keychain/Keystore). The access token stays in memory only. The user is not saved: it comes from the refresh response.
- **HTTP client:** on a 401 it renews **once** and repeats the call; concurrent requests share the same renewal (queue). If the renewal fails, the session ends.
- **Every route is born protected** (global guard); only those marked `@Public()` are open.
- **Validated responses:** the app validates every API response with the contract schemas.

## Consequences

- Stealing the database does not give sessions: only refresh token hashes.
- A refresh token that is stolen and used by the attacker also drops the owner's session (and forces a new sign-in): intentional behavior.
- Password sign-up only gives a session after the person confirms the email with a 6-digit code (the account stays pending until then and is deleted after 7 days). Sign-up and resend answer the same for a new or an already used email; the code is valid for 15 minutes, 5 attempts and a single use, and the confirmation also requires the password.
- The per-IP rate limit and social sign-in (Google/Apple) already exist; the per-email limit did not yet (done later; see `docs/api/autenticacao-e-sessoes.md`).
- Refresh token rotation is atomic: two simultaneous renewals with the same token count as reuse (only one passes and the whole session is revoked). The app serializes the renewal (one at a time), so normal use is not affected.
- The global guard checks on every request that the account still exists (a primary-key lookup, no cache; the cost measured was within the noise): a deleted account loses access at once, without waiting for the 15 minutes of the token. A database error in the guard denies access with a 500, never a 401, so a temporary failure does not sign the app out. There is still no account block (moderation); when it exists, it goes into that same query.
- Deleting the account requires re-authentication: the current password or, for a social-only account, a fresh ID token from the linked identity's provider (`DELETE /v1/me` with a body). A wrong proof is `403 REAUTH_FAILED` and counts toward the attempt limit (5 in 15 min).
- Each sign-in opens a session (a family of refresh tokens) that shows up in the device list; the access token carries the session id (`sid`) and the device name comes in the `X-Device-Name` header (encoded, cleaned and limited by the API). The person can end one session or all of them; the guard checks, in the same query as the account, that the token's session (`sid`) still has an active refresh token, so ending it also drops the access token at once (an old token without `sid` only checks the account).
