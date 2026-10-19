#!/usr/bin/env bash
# Valida as propostas do OpenSpec que o PR cria ou altera (mudança de comportamento, contrato ou
# regra de jogo precisa de proposta válida). Propostas antigas que o PR não toca ficam de fora.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base $base não encontrada: rode git fetch origin main (na CI o checkout precisa de fetch-depth: 0)." >&2
  exit 1
fi

# CLI oficial do OpenSpec, versão fixada no lockfile (devDependency da raiz)
run_openspec() { pnpm exec openspec "$@"; }

echo "==> Propostas do OpenSpec alteradas ($base...HEAD)"
changes=$(git diff --name-only "$base"...HEAD -- openspec/changes | grep -v '^openspec/changes/archive/' | cut -d/ -f3 | sort -u || true)
if [ -z "$changes" ]; then echo "nenhuma"; exit 0; fi

fail=0
for change in $changes; do
  [ -d "openspec/changes/$change" ] || continue
  echo "-- $change"
  run_openspec validate "$change" || fail=1
done
exit $fail
