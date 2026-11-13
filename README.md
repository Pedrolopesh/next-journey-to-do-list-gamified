# Next Journey

Gamified to-do list for iOS and Android. Dailies, tasks and habits earn EXP and coins and move a pixel art character through a story told in chapters. The server decides all progression; the app only displays it.

## Project status

| Part                                        | Status                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| API (`apps/api`)                            | Live in development and production, with migrations, unit tests and e2e tests                                                           |
| App (`apps/mobile`)                         | In development: email code sign-in, character creation, story, items, achievements and profile work; store builds are not published yet |
| Banner and lab (`apps/web`)                 | Game scenes in a WebView and an art review site (`lab.html`)                                                                            |
| Infrastructure (`apps/infra`, `apps/smoke`) | Provisioning and deploy scripts and smoke tests                                                                                         |

There is no admin application in this repository.

## How the pieces fit together

```
apps/mobile (Expo)  ──REST /v1──▶  apps/api (NestJS + Prisma)  ──▶  PostgreSQL
      │
      └─ postMessage ─▶  apps/web (Vite, inside a WebView)

packages/contracts: Zod schemas used by all three ends
```

Details in [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md).

## How to run

Prerequisites: Node 24 (`.nvmrc`), Docker and Corepack.

```bash
nvm use && corepack enable
pnpm install                         # installs everything and enables the git hooks
cp .env.example .env && cp apps/api/.env.example apps/api/.env   # change the passwords and the JWT secret
docker compose up -d                 # local PostgreSQL, on 127.0.0.1 only
pnpm --filter @nextjourney/api db:deploy && pnpm --filter @nextjourney/api db:seed
pnpm --filter @nextjourney/api start:dev   # API at http://127.0.0.1:3000 (docs at /docs)
```

App on the simulator or a device (development build, not Expo Go):

```bash
cp apps/mobile/.env.example apps/mobile/.env
cd apps/mobile && npx expo run:ios      # or run:android
```

Without `RESEND_API_KEY` set, the local API writes the sign-in code to the log instead of sending an email.

Art and scene lab: `pnpm --filter @nextjourney/banner dev` and open `/lab.html`.

`.env` files never go to Git; only the `.env.example` files do.

## Quality and security

```bash
pnpm run verify          # commits, lint, types, tests, build, API e2e, OpenSpec, duplication and security
pnpm run test            # unit tests of all packages
pnpm --filter @nextjourney/api test:e2e   # business rules against the test database
pnpm run security:full   # secrets, IPs, the whole history and dependencies
```

CI repeats these checks on every PR. The API image is scanned (Trivy) and signed (cosign) before the deploy, and static analysis (CodeQL) runs on GitHub. The security policy is in [SECURITY.md](SECURITY.md) and the security checklist in [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [How the project works](docs/HOW-IT-WORKS.md)
- [How to contribute](CONTRIBUTING.md) and the [PR process](docs/PR-PROCESS.md)
- [MVP specification](docs/REQUIREMENTS.md)
- [Tests and regression](docs/TESTING.md) and [QA](docs/QA.md)
- [Architecture decisions (ADRs)](docs/adr/README.md)
- [API reference](docs/api/README.md)
- [Turborepo](docs/TURBOREPO.md)

## Contributing

Conventional Commits (validated by the `commit-msg` hook), one subject per PR, and a green `pnpm run verify` before opening. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Art based on the Liberated Pixel Cup (LPC) follows the license of each author, listed in [CREDITS.md](CREDITS.md).
