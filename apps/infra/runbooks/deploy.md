# Runbook: publishing the API

Dev and production run on the same host, in separate stacks (`next-journey-dev` and `next-journey-prd`), each with its own database, secrets and JWT. The token issuer and audience change per environment: a dev token is not valid in production.

## Publish

```bash
export VPS_HOST=<ip-or-tailnet-name>
apps/infra/scripts/deploy.sh dev main        # or prd; 3rd argument "seed" on the first run or with a new achievement
SMOKE_BASE_URL=https://<api-host> SMOKE_CONFIRM_COMMAND=<command-that-confirms-the-email> pnpm --filter @nextjourney/smoke smoke
```

The deploy builds the image on the VPS, runs `prisma migrate deploy` before swapping the API and reloads the unit. The previous tag is kept in `NJ_PREV_TAG`, in `/etc/nextjourney/<env>.env`.

## Smoke test

`apps/smoke` runs Playwright in API mode (no browser): health, security headers, validation, protected routes and, when `SMOKE_CONFIRM_COMMAND` is set, the account lifecycle (sign-up, login, refresh, `me`, data export and deletion), with every response checked against the shared contracts. The command receives the test account's email and must mark it as confirmed, for example by running an `UPDATE` on the environment database. Without it, the account tests are skipped and nothing is created.

## Roll back

Run the deploy again pointing to the previous commit: `deploy.sh prd <previous-commit>`. Migrations are not undone; reverting a migration is a separate decision (restore a backup).

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

- **Email provider key:** it starts empty. Without it, password sign-up does not send the confirmation code. To set it, on the VPS:
  ```bash
  read -rs KEY
  sudo rm -f /etc/nextjourney/creds/<env>/resend_api_key.cred
  printf %s "$KEY" | sudo systemd-creds encrypt --name=resend_api_key - /etc/nextjourney/creds/<env>/resend_api_key.cred
  unset KEY
  sudo systemctl restart nj-secrets@<env> nj@<env>
  ```
- **JWT secret rotation:** procedure in section 8 of `docs/SEGURANCA.md`.

## VPS reboot

`nj-secrets@<env>` and `nj@<env>` start on their own. Check with the smoke test after a reboot.
