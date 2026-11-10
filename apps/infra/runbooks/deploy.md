# Runbook: publishing the API

Dev and production run on the same host, in separate stacks (`next-journey-dev` and `next-journey-prd`), each with its own database, secrets and JWT. The token issuer and audience change per environment: a dev token is not valid in production.

## Publish manually (fallback)

The normal path is the pipeline (`pipeline.md`). This script builds on the host and works without a registry.

```bash
export VPS_HOST=<ip-or-tailnet-name>
apps/infra/scripts/deploy.sh dev main        # or prd; 3rd argument "seed" on the first run or with a new achievement
SMOKE_BASE_URL=https://<api-host> SMOKE_CODE_COMMAND=<executable-that-stores-a-login-code> pnpm --filter @nextjourney/smoke smoke
```

The script builds the image on the VPS (`nj-build-local`), then `nj-release` runs `prisma migrate deploy` before swapping the API and reloads the unit. The previous tag is kept in `NJ_PREV_TAG`, in `/etc/nextjourney/<env>.env`.

## Smoke test

`apps/smoke` runs Playwright in API mode (no browser): health, security headers, validation, protected routes and, when `SMOKE_CODE_COMMAND` is set, the account lifecycle (code request, code sign-in, refresh, `me`, data export and deletion by code), with every response checked against the shared contracts. The executable (run without a shell) receives the test account's email and a 6-digit code as its two arguments and must make that code the valid login code of the account (the stored value is the SHA-256 of `<user id>:<code>` in `email_verifications`), for example with a one-off SQL statement on the environment database. Without it, the account tests are skipped and nothing is created. The release pipeline does not set it, so it runs only the public checks.

With `SMOKE_REAL_EMAIL=1` it also runs the real delivery check (`tests/real-email.spec.ts`): it asks for a sign-in code, reads the email from a throwaway inbox at a temporary mail service (Guerrilla Mail, `sharklasers.com` addresses), signs in and then deletes the account, which needs a second code. The API sends at most one code per address every 60 seconds, so the run takes about 1.5 minutes. It creates a real account in the target environment, depends on a third-party service and is never part of the release pipeline. Use it to confirm that the mail provider is delivering.

## Roll back

`sudo nj-app-rollback <dev|prd>` on the host switches back to the previous image (see `pipeline.md`). Migrations are not undone; reverting a migration is a separate decision (restore a backup).

## Operate

```bash
sudo systemctl status nj@dev nj@prd           # stack status
sudo docker ps                                # containers and health
sudo docker logs -f next-journey-prd-api-1    # API logs
sudo systemctl restart nj@prd                 # restart the stack
sudo nj-secrets-init prd                      # create what is missing; never overwrites
```

## Secrets

They are stored encrypted in `/etc/nextjourney/creds/<env>/` (ADR-0010).

- **Email provider key:** it starts empty. Without it, the sign-in code is not sent by email. To set it, on the VPS:
  ```bash
  read -rs KEY
  sudo rm -f /etc/nextjourney/creds/<env>/resend_api_key.cred
  printf %s "$KEY" | sudo systemd-creds encrypt --name=resend_api_key - /etc/nextjourney/creds/<env>/resend_api_key.cred
  unset KEY
  sudo systemctl restart nj-secrets@<env> nj@<env>
  ```
- **JWT secret rotation:** procedure in `docs/api/operations-and-security.md`.

## VPS reboot

`nj-secrets@<env>` and `nj@<env>` start on their own. Check with the smoke test after a reboot.
