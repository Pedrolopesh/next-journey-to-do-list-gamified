#!/usr/bin/env bash
# Restore test for the database backup, meant for a trusted workstation (never the host): downloads the
# newest backup of an environment from the object store, decrypts it with the offline age key, restores it
# into a throwaway Postgres container and prints row counts. Nothing is written outside a temp folder.
# Needs: docker, age, curl (>= 7.75), python3.
# Usage: NJ_R2_KEY_ID=... NJ_R2_SECRET=... NJ_R2_ENDPOINT=https://... NJ_R2_BUCKET=... \
#        scripts/restore-test.sh <env> <age identity file>
set -euo pipefail
env="${1:?usage: restore-test.sh <dev|prd> <age identity file>}"
identity="${2:?usage: restore-test.sh <dev|prd> <age identity file>}"
: "${NJ_R2_KEY_ID:?}" "${NJ_R2_SECRET:?}" "${NJ_R2_ENDPOINT:?}" "${NJ_R2_BUCKET:?}"
image="${NJ_RESTORE_PG_IMAGE:-postgres:16-bookworm}"

work=$(mktemp -d)
container="nj-restore-test-$$"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

s3() { # s3 <curl args>: keys go through standard input, never as arguments
  printf 'user = "%s:%s"\n' "$NJ_R2_KEY_ID" "$NJ_R2_SECRET" \
    | curl -fsS -K - --aws-sigv4 'aws:amz:auto:s3' -H 'x-amz-content-sha256: UNSIGNED-PAYLOAD' "$@"
}

# Keys are env/year/month/name, so the last one in order is the newest
key=$(s3 "${NJ_R2_ENDPOINT}/${NJ_R2_BUCKET}?list-type=2&prefix=${env}/" \
  | python3 -c 'import re,sys; k=re.findall(r"<Key>([^<]+)</Key>", sys.stdin.read()); print(sorted(k)[-1] if k else "")')
[ -n "$key" ] || { echo "no backup found for ${env}" >&2; exit 1; }
echo "newest backup: ${key}"

s3 -o "${work}/dump.age" "${NJ_R2_ENDPOINT}/${NJ_R2_BUCKET}/${key}"
age -d -i "$identity" -o "${work}/dump" "${work}/dump.age"

docker run -d --name "$container" -e POSTGRES_PASSWORD=restore-test "$image" >/dev/null
for _ in $(seq 1 30); do docker exec "$container" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
docker exec "$container" createdb -U postgres restored
docker cp "${work}/dump" "${container}:/tmp/dump"
docker exec "$container" pg_restore -U postgres -d restored --no-owner --exit-on-error /tmp/dump
docker exec "$container" psql -U postgres -d restored -At -c \
  "select relname || ': ' || n_live_tup from pg_stat_user_tables order by relname"
echo "restore ok (throwaway container removed)"
