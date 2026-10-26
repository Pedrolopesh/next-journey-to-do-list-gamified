# Infrastructure

How the Next Journey API runs on a VPS: server configuration, containers, TLS, DNS and deploy scripts. The real environment (IPs, inventory, keys, OpenTofu state) never enters the repository.

## Overview

```
internet --443--> nginx (TLS, rate limiting)
                   ├ api-dev --> 127.0.0.1:<dev port>  (Docker Compose: API + Postgres)
                   └ api     --> 127.0.0.1:<prd port>  (Docker Compose: API + Postgres)
```

- Dev and production are separate stacks on the same host, each with its own database, secrets and JWT.
- The API runs as non-root, with a read-only filesystem and no capabilities. The database sits on a network with no outbound internet access.
- Secrets are encrypted on disk (`systemd-creds`) and reach the API as variables only inside the process.
- The firewall (ufw) opens only SSH, HTTP and HTTPS, and the `DOCKER-USER` rule keeps ports published by Docker from bypassing it.

## Tooling notes

- Ansible configures the server (agentless, idempotent); OpenTofu only manages resources that have a stable API, such as DNS.
- Until a pipeline publishes images to a registry, `scripts/deploy.sh` builds the image on the VPS itself, tagged with the commit.

## Layout

| Folder      | Contents                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| `ansible/`  | Server configuration: access, base, SSH, firewall, Tailscale, application and nginx |
| `compose/`  | One environment's stack (Postgres, API and the migrations job)                      |
| `docker/`   | The API Dockerfile and the entrypoint that reads the secrets                        |
| `tofu/`     | DNS records with OpenTofu                                                           |
| `scripts/`  | `deploy.sh`, `smoke.sh` and `verify-ports.sh`                                       |
| `runbooks/` | VPS access and API publishing                                                       |
| `adr/`      | Architecture decisions for the infrastructure                                       |

## Usage

Prerequisites: Ansible, OpenTofu, a domain and an Ubuntu 24.04 VPS with SSH access, Docker Engine with Compose v2 and Tailscale (manual install and login). The playbook installs nginx and certbot.

```bash
cd ansible
cp inventory/example.yml inventory/hosts.yml                    # fill in the VPS IP
mkdir -p inventory/group_vars/all && cp inventory/group_vars/all.example.yml inventory/group_vars/all/local.yml
ansible-galaxy collection install -r requirements.yml -p collections
ansible-playbook site.yml --check --diff                        # secure host baseline
ansible-playbook app.yml                                        # Docker, secrets, nginx and TLS
```

After that, `scripts/deploy.sh` publishes the API and the Playwright tests in `apps/smoke` validate the environment. `app.yml` also fails if anything listens on a public port other than the allowed ones. Details are in `runbooks/`.

Before changing SSH, the firewall or the Tailscale ACL, read `runbooks/access.md`. The infrastructure decisions are ADR-0010 to ADR-0013 in `docs/adr/`.
