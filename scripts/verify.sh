#!/usr/bin/env bash
# Verificação completa antes de abrir PR (os mesmos passos da CI, mais a varredura completa de
# segredos). Pare no primeiro erro. Ver docs/PROCESSO-DE-PR.md.
#
#   pnpm run verify                  tudo
#   SKIP_E2E=1 pnpm run verify       sem os e2e da API (sem Postgres local)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "1/8 Mensagens dos commits"
bash scripts/check-commits.sh

step "2/8 Lint, tipos, testes e build (Turborepo)"
pnpm exec turbo run lint typecheck test build

if [ "${SKIP_E2E:-0}" = "1" ]; then
  step "3/8 e2e da API (pulado por SKIP_E2E=1)"
else
  step "3/8 e2e da API (precisa do Postgres de teste: TEST_DATABASE_URL)"
  pnpm --filter @nextjourney/api test:e2e
fi

step "4/8 Propostas do OpenSpec alteradas"
bash scripts/check-openspec.sh

step "5/8 Código duplicado"
pnpm run duplicates

step "6/8 Segredos, IPs, histórico, autoria e dependências (security:full)"
pnpm run security:full

step "7/8 Árvore limpa (nada esquecido fora do commit)"
if [ -n "$(git status --porcelain)" ]; then
  git status --short
  echo "Há mudanças sem commit."; exit 1
fi

step "8/8 Lembretes que a máquina não confere"
cat <<'MSG'
- /code-review rodado e todos os achados tratados (ou registrados como dívida no HANDOFF.md)
- Descrição do PR no padrão do template (.github/PULL_REQUEST_TEMPLATE.md)
- Fluxos do Maestro rodados se mexeu em tela (pnpm --filter @nextjourney/mobile test:ui)
MSG
echo; echo "OK: pronto para abrir o PR."
