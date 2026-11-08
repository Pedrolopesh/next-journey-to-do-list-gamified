#!/usr/bin/env bash
# Full verification before opening a PR (the same steps as CI, plus the full secret scan).
# Stops at the first error. See docs/PROCESSO-DE-PR.md.
#
#   pnpm run verify                  everything
#   SKIP_E2E=1 pnpm run verify       without the API e2e tests (no local Postgres)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "1/8 Commit messages"
base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Reference $base does not exist here: run 'git fetch origin main' or set BASE_REF."
  exit 1
fi
if [ -z "$(git rev-list "$base"..HEAD)" ]; then
  echo "No new commit relative to $base: nothing to verify (commit before running verify)."
  exit 1
fi
bash scripts/check-commits.sh

step "2/8 Lint, types, tests and build (Turborepo)"
pnpm exec turbo run lint typecheck test build

if [ "${SKIP_E2E:-0}" = "1" ]; then
  step "3/8 API e2e (skipped by SKIP_E2E=1)"
else
  step "3/8 API e2e (needs the test Postgres: TEST_DATABASE_URL)"
  pnpm --filter @nextjourney/api test:e2e
fi

step "4/8 Changed OpenSpec proposals"
bash scripts/check-openspec.sh

step "5/8 Duplicated code"
pnpm run duplicates

step "6/8 Secrets, IPs, history, authorship and dependencies (security:full)"
pnpm run security:full

step "7/8 Clean tree (nothing forgotten outside the commit)"
if [ -n "$(git status --porcelain)" ]; then
  git status --short
  echo "There are uncommitted changes."; exit 1
fi

step "8/8 Reminders the machine does not check"
cat <<'MSG'
- /code-review run and all findings handled (or recorded as an issue)
- PR description following the template (.github/PULL_REQUEST_TEMPLATE.md)
- Commit files checked by name (git status and git diff --cached --stat); README and docs updated if behavior changed
- Maestro flows run if you touched a screen (pnpm --filter @nextjourney/mobile test:ui)
MSG
echo; echo "OK: ready to open the PR."
