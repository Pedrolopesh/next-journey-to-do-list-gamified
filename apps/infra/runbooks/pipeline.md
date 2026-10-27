# Runbook: delivery pipeline

`.github/workflows/delivery.yml` builds, scans, publishes and signs the API images; `release.yml` (reusable) releases one environment and runs the smoke tests.

```
pull request:  build -> Trivy scan
main:          build and push to GHCR (by digest) -> Trivy scan of the pushed images -> SBOM -> cosign sign
               -> release dev -> smoke -> [manual approval] -> release prd -> smoke
```

## One-time setup

1. **Package visibility.** After the first push, make the `api` and `api-migrate` packages public in the repository's package settings, so the host can pull without credentials. They contain no secrets.
2. **Environments.** Create `dev` and `production` under the repository's environments. On `production`, add yourself as a required reviewer. Environment secrets: `SMOKE_EMAIL` and `SMOKE_PASSWORD` (an existing confirmed test account of that environment).
3. **Variables** (repository): `VPS_HOST` (tailnet address of the host). On each environment, `API_URL` (the public URL of that API).
4. **Secrets** (repository): `CI_SSH_KEY` (private half of the pipeline key), `VPS_SSH_HOST_KEY` (the host's `known_hosts` line, taken over the tailnet), `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_SECRET` (Tailscale OAuth client with the `auth_keys` write scope for `tag:ci`).
5. **Tailnet policy.** Declare `tag:ci` in `tagOwners` and grant it SSH (port 22) to the host only.
6. **Host.** Set `release_ci_ssh_public_key`, `release_image_repo` and `release_signer_repo` in the inventory variables and run `site.yml` (the SSH daemon allows the pipeline user) and then `app.yml`.

## What the host checks

`nj-ci-entry` is the only command the pipeline key can run. It accepts `release <dev|prd> <tag> <api@digest> <migrate@digest> [seed]` and `rollback <dev|prd>`, rejects anything else, and `nj-pull-verified` refuses an image unless `cosign verify` finds a signature from the delivery workflow on `main`.

## Roll back

```bash
ssh <admin>@<host> sudo nj-app-rollback prd
```

It switches the stack back to the previous image and reloads the unit. Images are kept for seven days. Migrations are not undone, so they must be backward compatible for one release (add first, remove later: expand/contract); reverting data is a backup restore.

## Exceptions to the vulnerability scan

`apps/infra/docker/.trivyignore` lists accepted findings. Every entry needs the reason and a review date; there is none today.
