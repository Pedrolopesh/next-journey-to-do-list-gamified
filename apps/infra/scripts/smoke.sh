#!/usr/bin/env bash
# API smoke test: health, headers, validation, sign-up, login, refresh, data export and cleanup.
# Usage: smoke.sh <base-url> [command-that-confirms-the-email]
#   Sign-up requires an emailed code. To continue without opening an inbox, pass a command that marks
#   the test account's email as confirmed (it receives the email as $1).
#   Without the command, sign-up and the login-dependent steps are skipped: nothing is created.
# The test account uses a throwaway email and is deleted at the end (DELETE /v1/me), even if a step fails.
set -uo pipefail
BASE="${1:?usage: smoke.sh <base-url> [confirm-email-command]}"; BASE="${BASE%/}"
CONFIRM="${2:-}"
fail=0; skipped=0
body_file="$(mktemp)"
ACCESS=""; PASS=""
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }
skip() { printf '  skip  %s\n' "$1"; skipped=1; }
code() { curl -sS -m 15 -o "$body_file" -w '%{http_code}' "$@"; }

cleanup() {
  if [ -n "$ACCESS" ]; then
    c=$(code -X DELETE "$BASE/v1/me" -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
      -d "$(printf '{"password":"%s"}' "$PASS")")
    if [ "$c" = 200 ] || [ "$c" = 204 ]; then ok "cleanup (test account deleted)"; else bad "cleanup ($c)"; fi
  fi
  rm -f "$body_file"
}
trap cleanup EXIT

EMAIL="smoke+$(date +%s)@example.invalid"
PASS="Smoke-$(openssl rand -hex 6)-Aa1!"

echo "Smoke test against $BASE"
if [ "$(code "$BASE/health")" = 200 ] && grep -q '"status":"ok"' "$body_file"; then ok "health (API and database)"; else bad "health"; fi

hdrs=$(curl -sS -m 15 -D - -o /dev/null "$BASE/health")
if echo "$hdrs" | grep -qi '^strict-transport-security'; then ok "HSTS present"; else bad "HSTS missing"; fi
if echo "$hdrs" | grep -qi '^x-content-type-options: nosniff'; then ok "nosniff present"; else bad "nosniff missing"; fi
if echo "$hdrs" | grep -qi '^x-powered-by'; then bad "X-Powered-By exposed"; else ok "no X-Powered-By"; fi

if [ "$(code -X POST "$BASE/v1/auth/login" -H 'content-type: application/json' -d '{}')" = 400 ]; then ok "validation rejects an empty body (400)"; else bad "login validation"; fi
if [ "$(code "$BASE/v1/me")" = 401 ]; then ok "protected route without a token (401)"; else bad "protected route without a token"; fi

if [ -z "$CONFIRM" ]; then
  skip "sign-up, login, refresh, export and cleanup (no email confirmation command)"
else
  body=$(printf '{"name":"Smoke","email":"%s","password":"%s","confirmPassword":"%s","acceptedTerms":true,"termsVersion":"1","timezone":"UTC"}' "$EMAIL" "$PASS" "$PASS")
  c=$(code -X POST "$BASE/v1/auth/register" -H 'content-type: application/json' -d "$body")
  if { [ "$c" = 200 ] || [ "$c" = 201 ] || [ "$c" = 202 ]; } && grep -q verification_sent "$body_file"; then ok "sign-up (code sent)"; else bad "sign-up ($c)"; fi

  $CONFIRM "$EMAIL" >/dev/null 2>&1 || bad "confirmation command"
  c=$(code -X POST "$BASE/v1/auth/login" -H 'content-type: application/json' -d "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASS")")
  if [ "$c" = 200 ] || [ "$c" = 201 ]; then
    ok "login"
    ACCESS=$(jq -r '.accessToken // .tokens.accessToken // empty' "$body_file")
    REFRESH=$(jq -r '.refreshToken // .tokens.refreshToken // empty' "$body_file")
    [ -n "$ACCESS" ] && [ -n "$REFRESH" ] || bad "login returned no tokens"
    if [ "$(code "$BASE/v1/me" -H "authorization: Bearer $ACCESS")" = 200 ]; then ok "GET /v1/me"; else bad "GET /v1/me"; fi
    c=$(code -X POST "$BASE/v1/auth/refresh" -H 'content-type: application/json' -d "$(printf '{"refreshToken":"%s"}' "$REFRESH")")
    if [ "$c" = 200 ] || [ "$c" = 201 ]; then
      ok "refresh"
      ACCESS=$(jq -r '.accessToken // .tokens.accessToken // empty' "$body_file")
    else
      bad "refresh ($c)"
    fi
    if [ "$(code "$BASE/v1/me/export" -H "authorization: Bearer $ACCESS")" = 200 ]; then ok "data export"; else bad "export"; fi
  else
    bad "login ($c)"
  fi
fi

[ $fail = 0 ] || { echo "RESULT: FAILED"; exit 1; }
if [ $skipped = 1 ]; then echo "RESULT: OK (with skipped steps)"; else echo "RESULT: OK"; fi
