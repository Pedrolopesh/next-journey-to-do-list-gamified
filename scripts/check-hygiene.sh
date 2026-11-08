#!/usr/bin/env bash
# Public-repository hygiene: local-only files, tool or personal mentions and loose TODOs.
# Runs inside scripts/security-scan.sh (pnpm run security, pnpm run verify and the CI).
# Rules and the reason for each: CONTRIBUTING.md, section "Public repository hygiene".
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

fail=0
files=$(git ls-files -co --exclude-standard)

echo "==> Hygiene: files that stay only on the developer machine"
local_only='^(internal/|HANDOFF|DIARIO|AGENTS\.md$|CLAUDE\.md$|RESUMO-DA-SESSAO|docs/gestao/|\.ai-memory)'
if echo "$files" | grep -E "$local_only"; then
  echo "These paths are local-only (see .gitignore): remove them from the commit with 'git rm --cached'."; fail=1
fi

echo "==> Hygiene: mention of a tool, a personal note or an external document"
# Excluded: the files that define the rules themselves and the vendored OpenSpec skills.
mention_re='obsidian|\brtk\b|claude|anthropic|chatgpt|copilot|HANDOFF\.md|DIARIO\.md|AGENTS\.md|session_[0-9A-Za-z]{10,}|lideran[cç]a|leadership|stakeholder'
skip='^(\.claude/|commitlint\.config\.js$|\.github/workflows/ci\.yml$|\.github/PULL_REQUEST_TEMPLATE\.md$|scripts/(security-scan|check-hygiene)\.sh$|CONTRIBUTING\.md$|\.gitignore$|pnpm-lock\.yaml$|openspec/changes/archive/)'
if echo "$files" | grep -v -E "$skip" | grep -v -E '\.(png|jpg|jpeg|webp|gif|ico|ttf|otf|woff2?|json\.gz)$' \
  | xargs grep -n -I -i -E "$mention_re" 2>/dev/null; then
  echo "Remove the mention: the public repository does not reference a tool, a personal note or a document outside Git."; fail=1
fi

echo "==> Hygiene: loose pending item in new lines (TODO, FIXME)"
base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
if [ -n "$base" ]; then
  if git diff "$base" -U0 -- . ':(exclude)scripts/' ':(exclude)CONTRIBUTING.md' ':(exclude)pnpm-lock.yaml' ':(exclude).claude' \
    | grep -E '^\+[^+]' | grep -E '\b(TODO|FIXME)\b'; then
    echo "A pending item goes to an issue or to the PR 'Risks and pending items' section, never to a comment."; fail=1
  fi
fi

echo "==> Language: new comment in Portuguese (code is in English)"
if [ -n "$base" ]; then
  if git diff "$base" -U0 -- 'apps/*.ts' 'apps/*.tsx' 'apps/*.js' 'apps/*.mjs' 'apps/*.sh' 'apps/*.sql' 'apps/*.prisma' \
    'packages/*.ts' 'packages/*.tsx' 'scripts/*.mjs' ':(exclude)apps/infra/ansible/collections' ':(exclude)apps/mobile/android' ':(exclude)apps/mobile/ios' \
    | grep -E '^\+\s*(//|/\*|\*|#|--)' | perl -CSD -ne 'my $l = $_; $l =~ s/"[^"]*"//g; print if $l =~ /[áéíóúâêôãõç]/' | grep .; then
    echo "New comments, test names and identifiers are in English (CONTRIBUTING.md, section Language)."; fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then echo "FAILED the public repository hygiene check."; exit 1; fi
echo "OK: hygiene is clean."
