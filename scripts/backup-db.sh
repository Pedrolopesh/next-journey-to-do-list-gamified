#!/usr/bin/env bash
# Postgres backup in custom format (restorable with pg_restore).
# Usage: DATABASE_URL=... scripts/backup-db.sh [destination-folder]
# Keeps the last BACKUP_RETENTION_DAYS days (default 14). The URL is never printed.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL}"
dir="${1:-backups}"
retention="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$dir"
chmod 700 "$dir"

file="$dir/nextjourney-$(date -u +%Y%m%dT%H%M%SZ).dump"
# DATABASE_URL may carry Prisma parameters (?schema=...) that pg_dump does not understand
pg_dump --format=custom --no-owner --no-privileges --file "$file" "${DATABASE_URL%%\?*}"
chmod 600 "$file"
find "$dir" -name 'nextjourney-*.dump' -type f -mtime "+$retention" -delete

echo "backup ok: $file ($(wc -c <"$file" | tr -d ' ') bytes)"
