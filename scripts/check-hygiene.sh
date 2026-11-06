#!/usr/bin/env bash
# Public-repository hygiene: local-only files, tool or personal mentions and loose TODOs.
# Runs inside scripts/security-scan.sh (pnpm run security, pnpm run verify and the CI).
# Rules and the reason for each: CONTRIBUTING.md, section "Higiene de repositório público".
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

fail=0
files=$(git ls-files -co --exclude-standard)

echo "==> Higiene: arquivos que ficam só na máquina de quem desenvolve"
local_only='^(internal/|HANDOFF|DIARIO|AGENTS\.md$|CLAUDE\.md$|RESUMO-DA-SESSAO|docs/gestao/|\.ai-memory)'
if echo "$files" | grep -E "$local_only"; then
  echo "Esses caminhos são locais (ver .gitignore): tire do commit com 'git rm --cached'."; fail=1
fi

echo "==> Higiene: menção a ferramenta, anotação pessoal ou documento externo"
# Excluded: the files that define the rules themselves and the vendored OpenSpec skills.
mention_re='obsidian|\brtk\b|claude|anthropic|chatgpt|copilot|HANDOFF\.md|DIARIO\.md|AGENTS\.md|session_[0-9A-Za-z]{10,}|lideran[cç]a|leadership|stakeholder'
skip='^(\.claude/|commitlint\.config\.js$|\.github/workflows/ci\.yml$|\.github/PULL_REQUEST_TEMPLATE\.md$|scripts/(security-scan|check-hygiene)\.sh$|CONTRIBUTING\.md$|\.gitignore$|pnpm-lock\.yaml$|openspec/changes/archive/)'
if echo "$files" | grep -v -E "$skip" | grep -v -E '\.(png|jpg|jpeg|webp|gif|ico|ttf|otf|woff2?|json\.gz)$' \
  | xargs grep -n -I -i -E "$mention_re" 2>/dev/null; then
  echo "Tire a menção: o repositório público não referencia ferramenta, anotação pessoal nem documento fora do Git."; fail=1
fi

echo "==> Higiene: pendência solta nas linhas novas (TODO, FIXME)"
base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
if [ -n "$base" ]; then
  if git diff "$base" -U0 -- . ':(exclude)scripts/' ':(exclude)CONTRIBUTING.md' ':(exclude)pnpm-lock.yaml' ':(exclude).claude' \
    | grep -E '^\+[^+]' | grep -E '\b(TODO|FIXME)\b'; then
    echo "Pendência vai para uma issue ou para a seção 'Risks and pending items' do PR, nunca para um comentário."; fail=1
  fi
fi

echo "==> Idioma: comentário novo em português (código em inglês)"
if [ -n "$base" ]; then
  if git diff "$base" -U0 -- 'apps/*.ts' 'apps/*.tsx' 'apps/*.js' 'apps/*.mjs' 'apps/*.sh' 'apps/*.sql' 'apps/*.prisma' \
    'packages/*.ts' 'packages/*.tsx' 'scripts/*.mjs' ':(exclude)apps/infra/ansible/collections' ':(exclude)apps/mobile/android' ':(exclude)apps/mobile/ios' \
    | grep -E '^\+\s*(//|/\*|\*|#|--)' | grep -E '[áéíóúâêôãõç]'; then
    echo "Comentário, nome de teste e identificador novos são em inglês (CONTRIBUTING.md, seção Idioma)."; fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then echo "FALHOU na higiene do repositório público."; exit 1; fi
echo "OK: higiene em dia."
