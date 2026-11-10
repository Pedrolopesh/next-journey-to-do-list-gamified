# Decision records (ADR)

Each technical or product decision that is hard to reverse becomes a file `NNNN-title.md`. An ADR is **never edited after it is accepted**: a new decision replaces it and points to the old one. (Translating a record does not count as editing it.)

## Template

```markdown
# ADR-NNNN: short title

- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded by ADR-XXXX
- Plan phase: (e.g. Phase 1, step 14)

## Context
The problem and the constraints.

## Decision
What was decided.

## Consequences
What gets better, what gets worse and what has to be done later.
```

Infrastructure data (addresses, ports, server names) **never** goes into an ADR: this repository is public (see `CONTRIBUTING.md`).

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-hosting-on-own-vps.md) | Hosting the API and the database on our own VPS, with Docker | Accepted |
| [0002](./0002-monorepo-with-pnpm-and-turborepo.md) | Monorepo with pnpm + Turborepo | Accepted |
| 0003 | WebView for the banner | Reserved (Phase 2, depends on the spike) |
| [0004](./0004-ambiguous-game-rules.md) | Ambiguous game rules and how they were resolved | Proposed (implemented; waiting for confirmation) |
| [0005](./0005-pnpm-typescript-and-eslint-versions.md) | pnpm, TypeScript and ESLint configuration versions | Accepted |
| [0006](./0006-public-repository-and-security-protections.md) | A public repository on purpose, and the security protections | Accepted |
| [0007](./0007-api-on-nestjs-12-esm-and-vitest.md) | API on NestJS 12, ESM and Vitest | Accepted |
| [0008](./0008-authentication-and-session.md) | Authentication, tokens and session | Accepted |
| [0009](./0009-phase-5-decisions.md) | Phase 5 decisions (complete loop) | Accepted |
| [0010](./0010-secrets-in-tmpfs-from-systemd-creds.md) | Secrets in tmpfs from systemd-creds | Accepted |
| [0011](./0011-docker-user-firewall-chain.md) | Firewall with the DOCKER-USER chain | Accepted |
| [0012](./0012-automatic-rollback-for-access-changes.md) | Automatic rollback for access changes | Accepted |
| [0013](./0013-deploy-user-with-passwordless-sudo.md) | `deploy` user with passwordless sudo | Accepted |
| [0014](./0014-signed-images-verified-on-the-host.md) | Signed images, verified on the host before release | Accepted |
| [0015](./0015-openbao-as-the-secrets-store.md) | OpenBao as the secrets store, opened manually | Accepted |
