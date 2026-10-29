<!--
Title: type(optional scope): lowercase subject in English  (e.g. feat: add the task history to the profile)
Write the content in English, direct: short sentences, present tense, no history of what was tried. The five section headings below are checked by the CI. No mention of AI, a session or a tool.
-->

## What changes

<!-- Short list of the result, by area (API, app, banner, contracts, docs). One line per item. -->

## Why

<!-- The need in one or two sentences. Cite the OpenSpec proposal, the ADR or the plan step. -->

## How it was verified

<!-- What ran and the result. Also say what was NOT verified (e.g. a physical iPhone). -->

- [ ] `pnpm run verify` passed (lint, types, tests, build, API e2e, OpenSpec, duplication, security)
- [ ] `/code-review` run and its findings handled before opening the PR
- [ ] Diff reviewed: new code and comments in English, no comment that repeats the code (AGENTS.md rules 11 and 12)
- [ ] Touched a screen: Maestro flows (`pnpm --filter @nextjourney/mobile test:ui`) and RN-FB (every action shows loading and ends in a toast)

## Risks and pending items

<!-- Migration (name and how to apply), seed, contract change, impact on existing data, known technical debt. "None" if there is nothing. -->

## Security

- [ ] Public repository: no secret, token, IP, host or infrastructure data in code, docs, commits or this description
- [ ] New routes are protected, validated with Zod and return only the needed fields; no access to another user's object (IDOR)
- [ ] Nothing sensitive in logs, errors, URLs or insecure storage; new dependencies have the exact name checked and the lockfile included
- [ ] No attribution to an AI tool in commits or here
