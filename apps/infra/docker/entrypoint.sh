#!/bin/sh
# Reads each non-empty file in /run/secrets/<NAME> and exports it as variable NAME (only inside this process).
# That keeps the secret out of `docker inspect` and out of any .env file.
set -eu
dir=/run/secrets
if [ -d "$dir" ]; then
  for f in "$dir"/*; do
    [ -s "$f" ] || continue
    name=$(basename "$f" | tr 'a-z-' 'A-Z_')
    value=$(cat "$f")
    export "$name=$value"
  done
fi
exec "$@"
