# ADR-0001: hosting the API and the database on our own VPS, with Docker

- Date: 2026-10-02
- Status: accepted
- Plan phase: Phase 0, step 7

## Context

The API (NestJS) and PostgreSQL need hosting for staging and production. We Tech Hub already runs a VPS that hosts another project and, when measured on 2026-10-02, it had spare CPU, memory and disk for one more project, with low idle load.

## Decision

- Host the Next Journey API and Postgres on the **own VPS**, in **Docker**, with a **dedicated Postgres** (own volume, separate compose project `next-journey`) and memory and CPU limits per container.
- Publish the API and database ports **on loopback only** (`127.0.0.1`). The host's nginx takes 80/443, terminates TLS (certbot) and proxies to the API.
- Staging and production on the same machine, in different compose projects and ports.
- Daily Postgres backup with 7-day retention, an off-machine copy and a restore test.
- Simple external monitoring of `GET /health`.
- Transactional email: Resend.

## Consequences

- Low cost and full control, with no platform lock-in.
- The machine is a **single point of failure** for the projects hosted on it; the 99.5% monthly target depends on external monitoring and a tested backup.
- Docker publishes ports straight into the system firewall and **ignores UFW**: any port declared without `127.0.0.1` ends up open. That is why the loopback rule is mandatory.
- A security audit of the machine is a prerequisite for the first deploy (recorded outside the repository).
- If usage grows, moving one of the projects to another machine is the first step.
