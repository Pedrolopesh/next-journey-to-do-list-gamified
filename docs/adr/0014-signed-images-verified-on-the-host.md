# ADR-0014: Signed images, verified on the host before release

- Data: 2026-10-26
- Status: aceita

## Context

Until now the host built the image itself from an uploaded source archive. That ties every release to a manual step on an admin machine and leaves no record of what was built or scanned.

## Decision

The pipeline builds the images once, scans them (Trivy, HIGH and CRITICAL with a fix available), publishes them to GHCR by digest, signs them keylessly with cosign and attaches an SBOM. The host releases an image only after `cosign verify` confirms it was signed by this repository's delivery workflow running on `main`.

The pipeline reaches the host through a dedicated SSH key whose only permitted command is a script that accepts two requests (`release` and `rollback`) with strictly validated arguments: environment, 8-character tag and image references pinned by digest under the expected registry path.

## Consequences

A compromised pipeline secret cannot run arbitrary commands, and an image that did not come from `main` is refused even if the registry is tampered with. The cost is one more binary on the host (cosign) and a registry dependency at release time. Manual deploys from an admin machine remain available as a fallback and use the same release script.
