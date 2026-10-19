#!/usr/bin/env bash
# Confere as mensagens dos commits da branch (em relação à base) com as regras do commitlint:
# Conventional Commits em minúscula, sem corpo e sem atribuição a IA. Roda local e na CI.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${BASE_REF:-origin/main}"
if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base $base não encontrada (git fetch origin main). Pulando a checagem de commits."
  exit 0
fi

echo "==> Mensagens dos commits ($base..HEAD)"
pnpm exec commitlint --from "$base" --to HEAD --verbose
