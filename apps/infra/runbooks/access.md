# Runbook: VPS access

The administrator must never be locked out of the VPS. This file contains no IP, real user name or key.

## Access paths, from the most common to the most drastic

1. SSH by key, through the public IP or the tailnet, from an admin machine, as the `deploy` user (passwords and `root` login are off; use `sudo -i` for a root shell).
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
2. From the provider console, run `/usr/local/sbin/nj-rollback.sh` (reverts SSH and the firewall). It removes our SSH file, so the provider default applies again (passwords allowed) until Ansible runs the `ssh` role.
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

## Editor tunnel (VS Code Remote-SSH)

SSH forwarding is off by default. A remote editor needs a tunnel to the server it starts on the loopback, so the SSH configuration allows `AllowTcpForwarding local` with `PermitOpen` limited to the loopback, only for the deploy user and only from the addresses listed in `ssh_forwarding_addresses` in the inventory. Connect as the deploy user through the tailnet address. An empty list disables the tunnel again.

## Closing port 22 to the internet

SSH is reachable only through the tailnet when `firewall_ssh_tailnet_only` is true (an `ufw` rule on the tailnet interface; ports 80 and 443 stay public). The role refuses to apply it unless the run itself comes in through the tailnet.

Before turning it on, all of these must be true:

1. The key-only SSH configuration has run for 48 hours with no problem, and `fail2ban` and the audit service are running.
2. From every admin machine, on a different network (for example a phone hotspot), `ssh <deploy-user>@<tailnet-name-of-the-host>` works.
3. The provider console login works.
4. The Tailscale node key of the host does not expire, and the ACL lets every admin machine reach port 22.
5. A second SSH session is open, and Ansible is pointed at the tailnet address of the host.

Apply with `ansible-playbook site.yml --tags firewall -e firewall_ssh_tailnet_only=true`, test every admin machine through the tailnet, then run `confirm-access.yml`. After that, reboot once and check that the tailnet comes back by itself, open the vault, and check both environments. A scan from outside (`nmap -Pn -p 22,80,443 <public-address>`) must show port 22 as filtered.

To go back, run the same command with the variable set to false.
