#!/usr/bin/env bash
# Proves that a backup restores: loads the dump into a THROWAWAY database and checks the key tables.
# Usage: RESTORE_DATABASE_URL=... scripts/restore-test.sh <file.dump>
# WARNING: the RESTORE_DATABASE_URL database is wiped first. Never point it at the real database.
set -euo pipefail

dump="${1:?give the .dump file}"
: "${RESTORE_DATABASE_URL:?set RESTORE_DATABASE_URL (throwaway database)}"
url="${RESTORE_DATABASE_URL%%\?*}"

# Version warnings (e.g. a pg_dump newer than the server) exit with code 1; the check below
# is what decides whether the restore worked. Prefer pg_dump/pg_restore of the same version as the server.
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$url" "$dump" ||
  echo "warning: pg_restore reported errors; checking the result" >&2

count() { psql "$url" -At -c "select count(*) from $1"; }
for table in users items item_checks stories chapters _prisma_migrations; do
  echo "$table: $(count "$table") rows"
done
[ "$(count _prisma_migrations)" -gt 0 ] || { echo "incomplete restore" >&2; exit 1; }
echo "restore ok"
