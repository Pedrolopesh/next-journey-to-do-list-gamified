#!/usr/bin/env bats

BACKUP="${BATS_TEST_DIRNAME}/../ansible/roles/backup/files/nj-backup"
WATCH="${BATS_TEST_DIRNAME}/../ansible/roles/backup/files/nj-backup-watch"

setup() {
  T="$BATS_TEST_TMPDIR"
  export NJ_BACKUP_CONF="${T}/backup.conf" NJ_BACKUP_DIR="${T}/backups" NJ_BACKUP_STATE="${T}/state" \
    NJ_CONF_DIR="${T}/conf" NJ_NOTIFY="${T}/bin/notify" NJ_BACKUP_DB_WAIT=1 T
  mkdir -p "${T}/bin" "${T}/conf/creds/backup"
  printf "BACKUP_AGE_RECIPIENT='age1test'\nBACKUP_ENDPOINT='https://store.test'\nBACKUP_BUCKET='bucket'\nBACKUP_LOCAL_RETENTION_DAYS='7'\n" >"$NJ_BACKUP_CONF"
  echo role-id >"${T}/conf/creds/backup/openbao_role_id"
  : >"${T}/conf/creds/backup/openbao_secret_id.cred"
  printf '#!/bin/bash\nprintf "secret-id"\n' >"${T}/bin/systemd-creds"
  printf '#!/bin/bash\nprintf "dump-bytes"\n' >"${T}/bin/docker"
  # age: copies the dump to the -o file and records the recipient
  cat >"${T}/bin/age" <<'S'
#!/bin/bash
out=""; while [ $# -gt 0 ]; do case "$1" in -r) echo "$2" >"${T}/recipient"; shift 2;; -o) out="$2"; shift 2;; *) shift;; esac; done
cat >"$out"
S
  # curl: answers the vault calls, records the upload (arguments and stdin config)
  cat >"${T}/bin/curl" <<'S'
#!/bin/bash
args="$*"; cfg=$(cat)
case "$args" in
  *approle/login*) [ -e "${T}/vault-down" ] && exit 22; printf '{"auth":{"client_token":"tok"}}' ;;
  *revoke-self*) touch "${T}/revoked" ;;
  *r2_access_key_id*) [ -e "${T}/key-missing" ] && exit 22; printf '{"data":{"data":{"value":"AKID"}}}' ;;
  *r2_secret_access_key*) printf '{"data":{"data":{"value":"SECRET"}}}' ;;
  *aws-sigv4*) [ -e "${T}/store-down" ] && exit 22
    printf '%s\n' "$args" >>"${T}/upload-args"; printf '%s\n' "$cfg" >"${T}/upload-config" ;;
esac
S
  printf '#!/bin/bash\necho "$*" >>"${T}/notifications"\n' >"${T}/bin/notify"
  chmod +x "${T}"/bin/*
  export PATH="${T}/bin:${PATH}"
}

@test "the dump is encrypted for the public key and uploaded under env/year/month" {
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  [ "$(cat "${T}/recipient")" = "age1test" ]
  file=$(ls "${NJ_BACKUP_DIR}/prd"/nextjourney-prd-*.dump.age)
  [ "$(cat "$file")" = "dump-bytes" ]
  grep -qE 'https://store.test/bucket/prd/[0-9]{4}/[0-9]{2}/nextjourney-prd-.*\.dump\.age' "${T}/upload-args"
  [ -s "${NJ_BACKUP_STATE}/prd.last" ]
}

@test "the object store keys only go through standard input" {
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  grep -q 'user = "AKID:SECRET"' "${T}/upload-config"
  ! grep -q 'SECRET' "${T}/upload-args"
}

@test "a closed vault keeps the local dump, fails and warns" {
  touch "${T}/vault-down"
  run "$BACKUP" prd
  [ "$status" -eq 1 ]
  [ -n "$(ls "${NJ_BACKUP_DIR}/prd"/nextjourney-prd-*.dump.age)" ]
  [ ! -e "${NJ_BACKUP_STATE}/prd.last" ]
  grep -q '^warning Backup of prd failed' "${T}/notifications"
}

@test "the vault token is revoked even when a key cannot be read" {
  touch "${T}/key-missing"
  run "$BACKUP" prd
  [ "$status" -eq 1 ]
  [ -e "${T}/revoked" ]
}

@test "dumps left over from a failed upload go up on the next run, oldest first" {
  touch "${T}/store-down"
  run "$BACKUP" prd
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/prd.last" ]
  rm "${T}/store-down"
  sleep 1
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  [ "$(grep -c 'dump.age' "${T}/upload-args")" -eq 2 ]
  [ "$(ls "${NJ_BACKUP_DIR}/prd/.uploaded" | wc -l)" -eq 2 ]
  names=$(awk '{match($0, /nextjourney-prd-[0-9TZ]+/); print substr($0, RSTART, RLENGTH)}' "${T}/upload-args")
  first=$(printf '%s\n' "$names" | sed -n 1p)
  second=$(printf '%s\n' "$names" | sed -n 2p)
  [[ "$first" < "$second" ]]
}

@test "an uploaded dump is not sent twice" {
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  sleep 1
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  [ "$(grep -c 'dump.age' "${T}/upload-args")" -eq 2 ]
}

@test "an empty dump is refused" {
  printf '#!/bin/bash\nexit 0\n' >"${T}/bin/docker"
  printf '#!/bin/bash\nout=""; while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; *) shift;; esac; done; : >"$out"\n' >"${T}/bin/age"
  run "$BACKUP" prd
  [ "$status" -eq 1 ]
  [ -z "$(ls "${NJ_BACKUP_DIR}/prd" 2>/dev/null)" ]
}

@test "old local backups are removed, recent ones stay" {
  mkdir -p "${NJ_BACKUP_DIR}/prd"
  touch -t 202601010000 "${NJ_BACKUP_DIR}/prd/nextjourney-prd-old.dump.age"
  touch "${NJ_BACKUP_DIR}/prd/nextjourney-prd-recent.dump.age"
  run "$BACKUP" prd
  [ "$status" -eq 0 ]
  [ ! -e "${NJ_BACKUP_DIR}/prd/nextjourney-prd-old.dump.age" ]
  [ -e "${NJ_BACKUP_DIR}/prd/nextjourney-prd-recent.dump.age" ]
}

@test "watch: a missing backup raises a critical alert, repeated only after the interval" {
  run "$WATCH" prd
  [ "$status" -eq 0 ]
  grep -q '^critical No backup of prd has ever been uploaded' "${T}/notifications"
  run "$WATCH" prd
  [ "$(wc -l <"${T}/notifications")" -eq 1 ]
}

@test "watch: a fresh backup is quiet" {
  mkdir -p "$NJ_BACKUP_STATE"
  date +%s >"${NJ_BACKUP_STATE}/prd.last"
  run "$WATCH" prd
  [ "$status" -eq 0 ]
  [ ! -e "${T}/notifications" ]
}

@test "watch: a corrupt state file alerts instead of staying silent" {
  mkdir -p "$NJ_BACKUP_STATE"
  printf 'not a number' >"${NJ_BACKUP_STATE}/prd.last"
  run "$WATCH" prd
  [ "$status" -eq 0 ]
  grep -q '^critical No backup of prd has ever been uploaded' "${T}/notifications"
}

@test "watch: an old backup alerts with the age, and recovery sends one ok" {
  mkdir -p "$NJ_BACKUP_STATE"
  echo $(( $(date +%s) - 30 * 3600 )) >"${NJ_BACKUP_STATE}/prd.last"
  "$WATCH" prd
  grep -q '^critical No backup of prd uploaded for 30 h' "${T}/notifications"
  date +%s >"${NJ_BACKUP_STATE}/prd.last"
  "$WATCH" prd
  grep -q '^ok Backup of prd is back to normal' "${T}/notifications"
  [ ! -e "${NJ_BACKUP_STATE}/prd.alerted" ]
}
