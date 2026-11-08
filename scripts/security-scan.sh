#!/usr/bin/env bash
# Basic scan for sensitive data in the versioned files. Runs locally (pnpm run security)
# and in CI. Fails (exit 1) if it finds anything. It does not replace human review.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

fail=0
files=$(git ls-files -co --exclude-standard | grep -v -E '^pnpm-lock\.yaml$|^scripts/security-scan\.sh$')

echo "==> Secrets in files"
secret_re='(npm_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY|_authToken=[^$[:space:]]|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|(password|passwd|secret|token|api[_-]?key)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"' ]{8,})'
# Lines with the "scan-allow" marker (obviously fake test data) are ignored
if echo "$files" | xargs grep -n -I -E -i "$secret_re" 2>/dev/null | grep -v "scan-allow"; then fail=1; fi

echo "==> Versioned sensitive files"
if echo "$files" | grep -E '(^|/)\.env($|\.)|\.pem$|\.p12$|\.keystore$|\.jks$|id_rsa|id_ed25519|credentials|service-account' | grep -v -E '\.env\.example$'; then fail=1; fi

echo "==> IP addresses and infrastructure hosts"
if echo "$files" | xargs grep -n -I -E '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' 2>/dev/null | grep -v -E '127\.0\.0\.1|0\.0\.0\.0|localhost|10\.0\.2\.2'; then fail=1; fi

echo "==> Secrets in the history (new commits relative to origin/main)"
base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
range=${base:+$base..HEAD}
if [ "${FULL:-0}" = "1" ]; then range=""; echo "(full mode: whole history, all branches)"; fi
if git log ${range:---all} -p -- . ':(exclude)scripts/security-scan.sh' ':(exclude)pnpm-lock.yaml' 2>/dev/null | grep -E '^\+' | grep -E -i "$secret_re" | grep -v "scan-allow"; then fail=1; fi

echo "==> AI attribution in commits (co-author trailer, \"Generated with\", session id)"
ia_re='co-authored-by:|generated with|claude-session:|claude\.ai/code/session'
for commit in $(git log ${range:---all} --format='%h'); do
  # Dependency update bots sign the commit with Co-authored-by: they are not AI
  if git show -s --format='%an <%ae>%n%B' "$commit" | grep -v -i -E '^co-authored-by:.*(dependabot|github-actions)\[bot\]' | grep -q -i -E "$ia_re"; then
    echo "commit $commit mentions AI attribution: $(git show -s --format='%s' "$commit")"; fail=1
  fi
done

if [ "${FULL:-0}" = "1" ]; then
  echo "==> Git-ignored files that look sensitive (they do not go up, but check)"
  git ls-files -o -i --exclude-standard | grep -E '(^|/)\.env($|\.)|\.pem$|\.p12$|\.keystore$|id_rsa|credentials' | grep -v -E 'node_modules|\.env\.example$' || echo "none"
fi

bash scripts/check-hygiene.sh || fail=1

echo "==> Vulnerabilities in dependencies (pnpm audit)"
pnpm audit --audit-level=high || fail=1

if [ "$fail" -ne 0 ]; then echo "FAILED: review the items above before opening the PR."; exit 1; fi
echo "OK: nothing found."
