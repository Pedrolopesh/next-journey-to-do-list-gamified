#!/usr/bin/env bash
# Checks the branch commit messages (against the base) with the commitlint rules:
# lowercase Conventional Commits, no body and no AI attribution. Runs locally and in CI.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base $base not found: run git fetch origin main (in CI the checkout needs fetch-depth: 0)." >&2
  exit 1
fi

echo "==> Commit messages ($base..HEAD)"
pnpm exec commitlint --from "$base" --to HEAD --verbose
