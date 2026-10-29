# ADR-0015: OpenBao as the secrets store, opened manually

- Data: 2026-10-29
- Status: aceita

## Context

Secrets were encrypted on the host with `systemd-creds` and copied to a tmpfs at boot. That keeps them out of the repository, the images and plain files, but it has no access control per consumer, no audit trail and no way to rotate a value without touching files on the host.

## Decision

Run OpenBao (the open source fork of Vault) on the same host, in a container published only on the loopback interface, with integrated Raft storage and TLS. Each environment gets its own AppRole and a read-only policy on its own path, so `dev` cannot read `prd`. Every request is written to an audit log with secret values hashed. After the first setup the root token is revoked and administration uses a named user with its own policy.

The vault is opened manually, with 3 of 5 key shares, over SSH (`nj-unseal`). Automatic opening with a key kept on the host is a possible later step, with the risk that whoever controls the host can also open the vault.

The existing flow does not change for the application: the secrets unit still writes files to a tmpfs and the compose file still reads them. Only the source of those files changes (`NJ_SECRETS_SOURCE=openbao|creds`), with the local encrypted credentials as a fallback during the transition.

## Consequences

After a host reboot the vault starts sealed, so the environments wait for someone to open it; an alert makes that visible. A secret can be rotated in the vault and applied with a reload, without a rebuild. The bootstrap credential of each AppRole stays encrypted on the host, which is the one secret that remains outside the vault. Losing the key shares means losing the vault data, so the shares are kept in separate places and the application secrets keep an offline copy until the setup is accepted.
