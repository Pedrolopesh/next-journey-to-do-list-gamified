# ADR-0012: automatic rollback for access changes

- Data: 2026-10-26
- Status: aceita

## Context

A wrong SSH or firewall change on a remote host can lock the administrator out, and the only way back is the provider console.

## Decision

The playbook that changes SSH or the firewall schedules a timer that reverts the change after 10 minutes. Only `confirm-access.yml` cancels it, after an access test from a new session.

## Consequences

A configuration mistake does not lock the administrator out. The cost is one confirmation step, and the guard always shows as "changed" by design. The rollback favors access over security: it removes the SSH drop-in and opens the firewall until the next run.
