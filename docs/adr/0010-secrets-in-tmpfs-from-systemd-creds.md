# ADR-0010: secrets in tmpfs from systemd-creds

- Data: 2026-10-26
- Status: aceita

## Context

The API needs a database URL, a JWT secret and an email provider key. Keeping them in `.env` files, images or container environment variables exposes them to anyone who can read the disk, the repository or `docker inspect`.

## Decision

Each environment secret is encrypted with `systemd-creds` (host key) under `/etc/nextjourney/creds/<env>/`. The `nj-secrets@<env>` unit decrypts it into `/run/nj-<env>/secrets` (tmpfs, per-service owner, mode 0400). Compose mounts each file as a `secret` and the API `entrypoint.sh` exports each non-empty file as a variable only inside the process.

## Consequences

- No secret in a `.env` file, an image, the repository or `docker inspect`.
- The API runs as uid 10001, which does not exist on the host: no host user can read the secrets by ownership (root still can).
- The encrypted files only open on the host itself; losing the host means recreating the secrets.
- `POSTGRES_PASSWORD` only applies when the database is created; changing the password later requires `ALTER ROLE` and a new `database_url`.
