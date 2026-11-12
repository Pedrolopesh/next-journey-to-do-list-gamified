# ADR-0016: SSH by key only, and port 22 reachable only through the tailnet

- Data: 2026-11-12
- Status: aceita

## Context

The host accepted SSH passwords, allowed `root` to log in with a key, and listened for SSH on the public internet. Every accepted login in the logs was already by key, and `root` had not been used for days, so the weaker settings protected nothing and only widened the attack surface. The admin machines and the pipeline already reach the host through the tailnet.

## Decision

- SSH accepts public keys only: no passwords, no keyboard-interactive, no `root` login. Only the deploy user and the pipeline user are allowed. Key exchange, ciphers and MACs are limited to modern algorithms, and the log level records the key used for each login.
- The SSH configuration stays in our own template instead of the `devsec.hardening` role. The template is short, it keeps the restricted editor tunnel block next to the rest, and a generic role would need overrides for exactly the parts that matter here.
- `fail2ban` protects `sshd`. It is lighter than CrowdSec, needs no account or external service, and the tailnet and listed admin addresses are exempt so an admin cannot ban themselves.
- The editor tunnel stays restricted to the deploy user, from the listed admin addresses, to the loopback of the host only.
- Port 22 is closed to the internet by an `ufw` rule that allows it only on the tailnet interface. It is switched on with `firewall_ssh_tailnet_only` after the hardened SSH has run for 48 hours with no problem, access has been tested from every admin machine on another network, the host has been rebooted once, and the provider console has been tested. Ports 80 and 443 stay public.

## Consequences

- Every admin machine must be on the tailnet. If the tailnet fails, the way in is the provider console, which does not depend on SSH, the firewall or Tailscale.
- The automatic rollback of the access guard removes our SSH file, which brings back the provider default (passwords allowed) until Ansible runs again. That is intended for an emergency.
- Once port 22 is closed, Ansible has to reach the host through the tailnet address.
- Old SSH clients that only offer legacy algorithms can no longer connect.

## Alternatives considered

- `devsec.hardening`: rejected for the reason above.
- CrowdSec: shared blocklists are useful on a public port, but the port is going to be closed, so the extra moving parts are not worth it.
- Leaving `root` by key: rejected; the deploy user has `sudo` and the console does not need SSH.
