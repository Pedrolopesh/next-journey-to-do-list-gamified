# Runbook: VPS access

The administrator must never be locked out of the VPS. This file contains no IP, real user name or key.

## Access paths, from the most common to the most drastic

1. SSH by key, through the public IP or the tailnet, from an admin machine (user `deploy`; `root` by key only).
2. Another admin machine: generate a new key and add it through path 3.
3. The browser console in the provider panel, with the local root login (password in the password manager). It does not depend on SSH, the firewall or Tailscale.
4. Recovery mode or operating system reinstall in the provider panel (last resort; a reinstall erases the data).

## Before changing SSH, the firewall or the Tailscale ACL

1. Open a second session and keep it open.
2. Run `site.yml`: it schedules the automatic rollback (`nj-rollback.timer`, 10 minutes), which removes the SSH configuration and opens the firewall.
3. Log in from a new session, from every admin machine, through the public IP and the tailnet.
4. Only then run `ansible-playbook confirm-access.yml`, which cancels the rollback.

## I lost access

1. If the automatic rollback has not fired yet, wait 10 minutes and try again.
2. From the provider console, run `/usr/local/sbin/nj-rollback.sh` (reverts SSH and the firewall).
3. Check `sshd -T | grep -E "passwordauthentication|permitrootlogin|allowusers"` and `ufw status`.
4. If Tailscale is gone, check `systemctl status tailscaled`. If the node key expired, re-authenticate with `tailscale up` and disable key expiry in the panel.

## Tailscale panel settings

These are not done by code:

- Disable key expiry for the VPS node, otherwise the node drops off the tailnet after about 180 days.
- Restrict the ACL to the admin machines. Example policy (replace the addresses with the ones from your tailnet):

```json
{
  "hosts": {
    "admin-1": "<tailnet-ip>",
    "admin-2": "<tailnet-ip>",
    "vps": "<tailnet-ip>"
  },
  "grants": [{ "src": ["admin-1", "admin-2"], "dst": ["*"], "ip": ["*"] }],
  "tests": [
    { "src": "<admin-1-ip>", "accept": ["<vps-ip>:22"] },
    { "src": "<vps-ip>", "deny": ["<admin-1-ip>:22"] }
  ]
}
```

Save only with the panel tests passing, and afterwards confirm from every machine that the VPS is still reachable.
