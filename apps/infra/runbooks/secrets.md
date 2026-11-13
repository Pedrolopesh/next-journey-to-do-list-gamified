# Runbook: secrets store (OpenBao)

The vault runs on the host in a container, listening only on the loopback interface. `nj-bao <args>` runs the client inside the container. Tokens go through the environment (`BAO_TOKEN`), never through arguments.

## Open the vault (after every reboot)

The vault starts sealed. From an admin machine:

```
ssh -t <admin-user>@<host> sudo nj-unseal
```

Paste a key share when asked (nothing is echoed). It stops by itself once the threshold (3 of 5) is reached. Check with `sudo nj-bao status`.

## First setup (once)

1. `nj-bao operator init -key-shares=5 -key-threshold=3`: store each share in a different place. No place may hold three of them.
2. Open the vault with three shares.
3. `nj-openbao-configure`: KV engine, policies, login methods and one AppRole per environment.
4. Create a named administrator with the `nj-admin` policy, check that it can log in and write, then revoke the root token (`nj-bao token revoke -self`).
5. `nj-openbao-import <dev|prd>`: copies the current secrets with the same values and compares hashes.

Steps 3 to 5 need a token. Open a root shell (`sudo -i`), then `read -rs BAO_TOKEN; export BAO_TOKEN` so the token is neither in the history nor in the process list (`sudo` drops variables set on its command line), and leave the shell when done.

The audit log is declared in the server configuration (this version does not enable it through the API) and is rotated daily.

## Rules

- Never print a value. Scripts compare hashes.
- The database password does not change when importing: the database was created with it.
- Losing the key shares means losing the vault data. Keep a Raft snapshot in the backup and the shares offline.

## Where the secrets come from

The vault is the only source. `nj-secrets@<env>` logs in with the AppRole of the environment (`nj-openbao-approle <env>` prepares its login once) and puts the four application secrets in a tmpfs. If the vault is sealed the environment stays down until it is opened: there is no local copy to fall back to.

The local encrypted copies of those four secrets (`postgres_password`, `database_url`, `jwt_access_secret`, `resend_api_key`) were retired after the vault snapshot was proven to rebuild the vault. Ansible moves them to the retired folder (`app_retired_creds_dir`) instead of deleting them; delete that folder when you are sure you will not go back. The vault login files of each environment (`openbao_role_id` and `openbao_secret_id.cred`) stay where they are: they are how the environment opens the vault.

### First install on a host with no vault data

A vault restored from a snapshot already holds the secrets. For a brand-new vault with no snapshot, seed it once: run `nj-secrets-init <env>` (creates local copies), then `nj-openbao-import <env>` (copies them into the vault and compares hashes), then run the `app` role again so the copies are moved aside.

### Going back to the local copies (emergency only)

Copy the four files from the retired folder back to `creds/<env>/`, put the four `LoadCredentialEncrypted=` lines back in `nj-secrets@.service` and restore the `from_creds` branch of `nj-materialize` from Git history. Prefer opening the vault.

## Store review account (optional secrets)

`review_account_email` and `review_account_code` are optional: if the vault has no value they become empty files and the API treats the review account as not configured. Set both together (the API refuses to start with only one). They go in the vault, never in Git. The 6-digit code is for the store reviewers; remove both entries (and restart the environment) once the store has approved the app.

```
printf %s '<email>' | BAO_TOKEN=<admin token> nj-bao kv put kv/nextjourney/prd/review_account_email value=-
printf %s '<6 digits>' | BAO_TOKEN=<admin token> nj-bao kv put kv/nextjourney/prd/review_account_code value=-
sudo systemctl restart nj-secrets@prd nj@prd
```

## Alerts

`nj-vault-watch.timer` runs every 30 seconds and posts to the alerts channel through a webhook that is stored encrypted on the host (it must work while the vault is sealed, so it does not live in the vault):

- vault sealed: a critical alert at once, repeated every 15 minutes while it stays sealed. An alert that could not be delivered is not counted as sent and is tried again on the next run;
- vault opened: a notice, and the environments that were waiting are started, retrying every 30 seconds until they are up (a warning is sent at most every 15 minutes while one does not come up);
- after a reboot (`nj-boot-check.service`): one report with the state of the vault, both environments, nginx, certificates and disk.

Set or replace the webhook with `printf '%s' "<url>" | sudo nj-notify --set-webhook`. Measured on the real host: the sealed alert arrived 19 s after sealing and the reopened notice 29 s after opening, with both APIs answering throughout.

## Loopback certificate

The listener uses a self-signed certificate valid for three years (`openbao_tls_days`). To renew it, delete `/etc/openbao/tls/openbao.crt` and `openbao.key` and run the `openbao` role again; the vault restarts sealed, so open it afterwards.

## Web interface

The vault serves its web interface on the loopback listener only (`openbao_ui`). It is not reachable from outside: SSH port forwarding is disabled on the host by design, so a plain tunnel is refused. To use it, allow a single local forward to the vault port for the administration account (`AllowTcpForwarding local` with `PermitOpen 127.0.0.1:8200` in a `Match User` block of the `ssh` role, applied with the access guard), then:

```
ssh -N -L 8200:127.0.0.1:8200 <admin-user>@<host>
# open https://127.0.0.1:8200/ui/ (the certificate is self-signed) and sign in with the administrator user
```

Until then, administration is done with `nj-bao` over SSH. Turn the interface off with `openbao_ui: false`.

## Measured times (real host)

| Event                                                                                                   | Time                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Switching one environment to the vault (`systemctl restart nj-secrets@<env>`, which restarts its stack) | 15 to 17 s of downtime             |
| Reboot with the vault sealed: SSH back / critical alert delivered                                       | 26 s / 19 s after boot             |
| Vault opened with three shares until `dev` and `prd` answer again                                       | 68 s (the watcher runs every 30 s) |
| Reboot command until both environments are back, including opening the vault                            | about 2 min                        |
| Rotating a secret (write in the vault, restart the environment)                                         | 16 s                               |

The environments stay down after a reboot until the vault is opened. That is the intended state.

## Rotating a secret

```
printf %s '<new value>' | BAO_TOKEN=<admin token> nj-bao kv put kv/nextjourney/<env>/<name> value=-
sudo systemctl restart nj-secrets@<env>
```

Send the value with `printf %s`, never with `echo` or a here-document: a trailing newline becomes part of the secret (and of a password). Rotating the JWT secret invalidates access tokens at once; sessions renew through the refresh token. The previous version stays in the vault history (`kv rollback`).
