# Security policy

Next Journey is an open project. Security is a priority: if you found a vulnerability, **do not open a public issue**.

## How to report

Use GitHub private reporting: the repository **Security** tab → **Report a vulnerability**. Describe the impact, the steps to reproduce and, if possible, a suggested fix.

You will get a reply within 7 days. Please do not disclose publicly before the fix is available.

## Scope

- Code in this repository (API, app, banner, shared packages).
- Example configuration (`.env.example`, CI workflows).

Out of scope: the production infrastructure (servers, domains) and third-party services.

## If you replicate the project

Generate your own secrets (JWT, database, email, social login keys). Never reuse example values in production.

## For contributors

Before opening a PR, run `pnpm run security` and follow the security checklist in `CONTRIBUTING.md`. Never commit secrets, `.env` files or infrastructure data.
