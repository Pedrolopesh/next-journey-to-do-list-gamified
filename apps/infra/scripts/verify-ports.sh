#!/usr/bin/env bash
# Checks, from outside the VPS, which TCP ports respond.
# Usage: verify-ports.sh <host> ["<expected open ports>"]   (default: 22 80 443)
set -u
host="${1:?usage: verify-ports.sh <host> [\"22 80 443\"]}"
expected=" ${2:-22 80 443} "
rc=0
for p in 21 22 23 25 80 443 2375 3000 3306 3389 5432 5900 6379 8080 8443 9000 9100 9200; do
  if nc -z -w 3 "$host" "$p" >/dev/null 2>&1; then is_open=1; else is_open=0; fi
  if [[ $is_open -eq 1 && "$expected" != *" $p "* ]]; then echo "ALERT: port $p is open and not expected"; rc=1; fi
  if [[ $is_open -eq 0 && "$expected" == *" $p "* ]]; then echo "ALERT: port $p is expected but closed"; rc=1; fi
done
[[ $rc -eq 0 ]] && echo "OK: only the expected ports are open on $host"
exit $rc
