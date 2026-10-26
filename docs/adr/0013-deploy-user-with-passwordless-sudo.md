# ADR-0013: `deploy` user with passwordless sudo

- Data: 2026-10-26
- Status: aceita

## Context

Ansible needs to run privileged tasks without an interactive password prompt.

## Decision

The `deploy` user has passwordless sudo. Mitigations: no local password on the account, SSH by key only, restricted `AllowUsers` and a firewall.

## Consequences

Whoever holds the `deploy` key becomes root. Each admin machine therefore has its own key, and port 22 should be closed to the internet once access through the tailnet is validated.
