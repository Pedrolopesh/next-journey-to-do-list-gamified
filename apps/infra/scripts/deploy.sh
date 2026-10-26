#!/usr/bin/env bash
# Publishes the API: uploads the versioned code, builds the image on the VPS, migrates the database and updates the stack.
# Usage: deploy.sh <dev|prd> [git-ref] [seed]
#   git-ref  commit, tag or branch to publish (default: main)
#   seed     also runs db:seed (first publish or new achievement in the catalog)
# Requires VPS_HOST (IP or tailnet name) and the "deploy" user with sudo on the VPS.
set -euo pipefail
env="${1:?usage: deploy.sh <dev|prd> [git-ref] [seed]}"
ref="${2:-main}"
seed="${3:-}"
case "$env" in dev|prd) ;; *) echo "environment must be dev or prd"; exit 2 ;; esac
case "$seed" in ""|seed) ;; *) echo "the 3rd argument can only be: seed"; exit 2 ;; esac
: "${VPS_HOST:?set VPS_HOST}"
repo="$(git rev-parse --show-toplevel)"
sha="$(git -C "$repo" rev-parse --short=8 "$ref")"
echo "Publishing ${env}: ${ref} (${sha})"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
git -C "$repo" archive "$ref" | gzip > "$tmp/src.tgz"

remote="$(ssh "deploy@${VPS_HOST}" mktemp /var/tmp/nj-src.XXXXXX)"
scp -q "$tmp/src.tgz" "deploy@${VPS_HOST}:${remote}"
ssh "deploy@${VPS_HOST}" "sudo /usr/local/sbin/nj-deploy-remote '${env}' '${sha}' '${remote}' ${seed}"
