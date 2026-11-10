# ADR-0009: Phase 5 decisions (complete loop)

> Update of 2026-11-09: the password recovery of this record was removed; sign-in is only by email code, Google and Apple (see `openspec/specs/email-code-login` and the change `remover-endpoints-de-senha`). The text below is the history of the original decision.

- Date: 2026-10-09
- Status: accepted
- Plan phase: Phase 5

## Decision

- **Progress per story.** The chapter lives in `story_progress` (per user and story); EXP, level and coins stay in `user_stats`. Switching stories keeps the progress of each one. The check stores the `story_id` it counted in, so the undo moves the step back in the right story even if the active one has changed. With no active story, the check pays EXP and coins but does not count toward a chapter.
- **Achievements in the same transaction as the check.** Each achievement is unlocked only once (primary key) and the result is stored in the check, so repeating the `checkId` returns the same achievements. The "7-day flame" and the other rules are pure functions in the domain.
- **Cosmetics.** An achievement reward can only be used on the character after it is unlocked (`403 COSMETIC_LOCKED`).
- **Onboarding.** The API reports what is missing (`onboarding` in `GET /me`); the app only unlocks the tabs once there is a character and a story (the tutorial can be skipped). The app validates every response with the contract schemas.
- **Social sign-in.** The app sends only the ID token; the API validates it with the provider (Google: `google-auth-library`; Apple: `jose` with the public keys). A matching verified email links to the same account; an unverified email never links nor creates (this prevents account takeover). With no client id configured, the API answers `503`.
- **Password recovery.** Always `202`; a single-use link valid for 30 minutes, only the hash stays in the database; changing the password drops all sessions. Sent through Resend; with no key nothing is sent (development).
- **Todo deadline** by shortcuts (today, tomorrow, in 7 days), end of day in the device's time zone, with no native date picker in this version.
- **Component tests** with jest-expo and Testing Library; the pure logic stays in Vitest.

## Consequences

- More columns and tables; additive migrations and one that replaces the story columns of `user_stats`.
- Email sign-up still reveals whether the email exists (fixed later; see `docs/api/autenticacao-e-sessoes.md`); sign-in, refresh and "forgot password" do not.
- Local notifications and the offline queue are left for Phase 7; the reminder time is already stored.
