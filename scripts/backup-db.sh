#!/usr/bin/env bash
# Backup do Postgres em formato custom (restaurável com pg_restore).
# Uso: DATABASE_URL=... scripts/backup-db.sh [pasta-de-destino]
# Mantém os últimos BACKUP_RETENTION_DAYS dias (padrão 14). A URL nunca é impressa.
set -euo pipefail

: "${DATABASE_URL:?defina DATABASE_URL}"
dir="${1:-backups}"
retention="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$dir"
chmod 700 "$dir"

file="$dir/nextjourney-$(date -u +%Y%m%dT%H%M%SZ).dump"
# DATABASE_URL pode trazer parâmetros do Prisma (?schema=...) que o pg_dump não entende
pg_dump --format=custom --no-owner --no-privileges --file "$file" "${DATABASE_URL%%\?*}"
chmod 600 "$file"
find "$dir" -name 'nextjourney-*.dump' -type f -mtime "+$retention" -delete

echo "backup ok: $file ($(wc -c <"$file" | tr -d ' ') bytes)"
