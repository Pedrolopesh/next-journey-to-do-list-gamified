# ADR-0006: a public repository on purpose, and the security protections

- Date: 2026-10-03
- Status: accepted
- Plan phase: Phase 0, step 5

## Context

Next Journey is an open project: the idea is that anyone can see the code, understand how it was built and replicate it. A public repository exposes everything that is committed, forever (clones, forks, caches). In Phase 1, infrastructure information was committed by mistake and had to be removed by rewriting history.

## Decision

Keep the repository **public** and treat security with an extra level of care:

- Assume the attacker reads all the code; security comes from the design, never from secrecy about how something works.
- **No** secret, `.env`, certificate, IP, host or audit finding in the repository; only `.env.example` with fake values. Real infrastructure and findings stay outside (secrets vault and private notes).
- Automatic protections: secret scanning (`scripts/security-scan.sh`, fast in CI and full before every PR), `pnpm audit`, local hooks, GitHub secret scanning and push protection, Dependabot, private vulnerability reporting (`SECURITY.md`).
- Protected `main`: a PR and a green CI are required; no force-push.
- **Review and full scan before opening any PR** (`CONTRIBUTING.md`).
- Commits and PRs with no attribution to AI tools.

## Consequences

- A little more friction in every PR, in exchange for a much lower risk of leaks.
- Whoever replicates the project generates their own secrets; none of our values is needed.
- The license for the code and for the art still has to be chosen (a pending item recorded outside the repository).
