# ADR-0011: firewall with the DOCKER-USER chain

- Data: 2026-10-26
- Status: aceita

## Context

Docker publishes container ports through its own iptables rules, which bypass ufw. A container started with `-p 3000:3000` would be reachable from the internet even with ufw denying inbound traffic.

## Decision

A rule in the `DOCKER-USER` chain (in `/etc/ufw/after.rules`) drops new connections from the public interface to containers. The host's nginx is not affected, since its traffic does not go through that chain.

## Consequences

A port published without `127.0.0.1` is not exposed to the internet. Verified by publishing a test container on `0.0.0.0` and checking that it stayed unreachable from outside.
