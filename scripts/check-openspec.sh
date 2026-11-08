#!/usr/bin/env bash
# Validates the OpenSpec proposals that the PR creates or changes (a change in behavior, contract or
# game rule needs a valid proposal). Old proposals that the PR does not touch are left out.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base $base not found: run git fetch origin main (in CI the checkout needs fetch-depth: 0)." >&2
  exit 1
fi

# Official OpenSpec CLI, version pinned in the lockfile (root devDependency)
run_openspec() { pnpm exec openspec "$@"; }

echo "==> Changed OpenSpec proposals ($base...HEAD)"
changes=$(git diff --name-only "$base"...HEAD -- openspec/changes | grep -v '^openspec/changes/archive/' | cut -d/ -f3 | sort -u || true)
if [ -z "$changes" ]; then echo "none"; exit 0; fi

fail=0
for change in $changes; do
  [ -d "openspec/changes/$change" ] || continue
  echo "-- $change"
  run_openspec validate "$change" || fail=1
done
exit $fail
