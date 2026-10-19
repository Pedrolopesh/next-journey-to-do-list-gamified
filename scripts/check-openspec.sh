#!/usr/bin/env bash
# Valida as propostas do OpenSpec que o PR cria ou altera (mudança de comportamento, contrato ou
# regra de jogo precisa de proposta válida). Propostas antigas que o PR não toca ficam de fora.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base $base não encontrada. Pulando a validação do OpenSpec."
  exit 0
fi

# CLI oficial, com a versão fixada (a CI não tem instalação global)
run_openspec() {
  if command -v openspec >/dev/null 2>&1; then openspec "$@"; else pnpm dlx @fission-ai/openspec@1.4.1 "$@"; fi
}

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
