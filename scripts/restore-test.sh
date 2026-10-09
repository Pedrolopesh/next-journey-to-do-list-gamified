#!/usr/bin/env bash
# Prova que um backup restaura: carrega o dump num banco DESCARTÁVEL e confere as tabelas-chave.
# Uso: RESTORE_DATABASE_URL=... scripts/restore-test.sh <arquivo.dump>
# ATENÇÃO: o banco de RESTORE_DATABASE_URL é limpo antes. Nunca aponte para o banco real.
set -euo pipefail

dump="${1:?informe o arquivo .dump}"
: "${RESTORE_DATABASE_URL:?defina RESTORE_DATABASE_URL (banco descartável)}"
url="${RESTORE_DATABASE_URL%%\?*}"

# Avisos de versão (ex.: pg_dump mais novo que o servidor) saem com código 1; a conferência abaixo
# é o que decide se a restauração serviu. Prefira pg_dump/pg_restore da mesma versão do servidor.
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$url" "$dump" ||
  echo "aviso: pg_restore reportou erros; conferindo o resultado" >&2

count() { psql "$url" -At -c "select count(*) from $1"; }
for table in users items item_checks stories chapters _prisma_migrations; do
  echo "$table: $(count "$table") linhas"
done
[ "$(count _prisma_migrations)" -gt 0 ] || { echo "restauração incompleta" >&2; exit 1; }
echo "restauração ok"
