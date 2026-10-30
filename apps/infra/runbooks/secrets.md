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
