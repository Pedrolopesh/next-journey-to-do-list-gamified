# Runbook: host hardening

The `hardening` role applies the operating-system layer. SSH and the firewall have their own roles (see `access.md`).

## What it applies

| Area | Setting |
| --- | --- |
| Network | no ICMP/IP redirects, no source routing, martian packets logged, SYN cookies, broadcast pings ignored |
| Kernel | restricted kernel pointers and `dmesg`, `sysrq` off, `ptrace` limited to children, BPF JIT hardening, no core dumps |
| Modules | `dccp`, `sctp`, `rds`, `tipc` and `usb-storage` cannot be loaded |
| Audit | `auditd` with watches on identity files, sudoers, SSH keys and configuration, firewall, vault and application configuration, systemd units, kernel modules and clock changes |
| Accounting | process accounting and `sysstat` collection |
| Packages | `telnet` and `ftp` removed, unused dependencies and old kernels purged; `debsums`, `apt-show-versions`, `libpam-tmpdir` and Lynis installed |
| Accounts | ageing and hashing defaults for new accounts in `login.defs` |
| SSH | `fail2ban` jail for `sshd` (aggressive mode); the tailnet and the addresses in `hardening_fail2ban_ignore_ips` are never banned |
| TLS | nginx offers TLS 1.2 and 1.3 only |

Apply with `ansible-playbook site.yml --tags hardening`. It does not touch SSH or the firewall, so it needs no rollback window.

## Checking

- Bans: `sudo fail2ban-client status sshd`. Lift one with `sudo fail2ban-client set sshd unbanip <address>`.
- Audit events: `sudo ausearch -k sshd --start today` (keys: `identity`, `sudoers`, `sshd`, `ssh_keys`, `firewall`, `vault_config`, `app_config`, `systemd_units`, `kernel_modules`, `time_change`).
- Kernel settings: `sudo sysctl --system`.

## Measuring with Lynis

```
sudo lynis audit system --quick
```

The line `Hardening index` is the score. The target is 80 or more. Record each measurement here.

| Date | Score | Change |
| --- | --- | --- |
| 2026-11-12 | 66 | baseline, before the hardening role |

## Left out on purpose

- **Package upgrades** are not forced by Ansible. Security updates install by themselves without rebooting. A full upgrade can restart Docker, which seals the vault, so it is done together with a planned reboot, when the vault can be opened right after.
- **Strict reverse-path filtering** stays loose: the tailnet and Docker both use asymmetric routes.
- **A stricter default `umask`** is not set: build files are shared with containers that run as other users.
- **Session limits** stay at the default: the editor opens several channels per connection.
- **CrowdSec, a file-integrity database, a boot-loader password and separate partitions** are not used: the host is a single-disk virtual server, and `fail2ban` plus the audit watches cover the same ground with less to maintain.
