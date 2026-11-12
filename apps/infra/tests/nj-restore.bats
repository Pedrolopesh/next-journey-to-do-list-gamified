#!/usr/bin/env bats

RESTORE="${BATS_TEST_DIRNAME}/../ansible/roles/backup/files/nj-restore"
WATCH="${BATS_TEST_DIRNAME}/../ansible/roles/backup/files/nj-backup-watch"

setup() {
  T="$BATS_TEST_TMPDIR"
  export NJ_BACKUP_CONF="${T}/backup.conf" NJ_BACKUP_DIR="${T}/backups" NJ_BACKUP_STATE="${T}/state" \
    NJ_CONF_DIR="${T}/conf" NJ_NOTIFY="${T}/bin/notify" NJ_TMP_DIR="${T}/tmp" T
  mkdir -p "${T}/bin" "${T}/conf/creds/restore" "${T}/state" "${T}/tmp"
  printf "BACKUP_AGE_RECIPIENT='age1test'\nBACKUP_ENDPOINT='https://store.test'\nBACKUP_BUCKET='bucket'\n" >"$NJ_BACKUP_CONF"
  echo role-id >"${T}/conf/creds/restore/openbao_role_id"
  : >"${T}/conf/creds/restore/openbao_secret_id.cred"
  printf 'NJ_PORT=3101\n' >"${T}/conf/prd.env"
  printf '#!/bin/bash\nprintf "secret-id"\n' >"${T}/bin/systemd-creds"
  printf '#!/bin/bash\n:\n' >"${T}/bin/sleep"
  # age: -d passes the bytes through; encrypting copies the input to the -o file
  cat >"${T}/bin/age" <<'S'
#!/bin/bash
if [ "$1" = "-d" ]; then cat; exit; fi
out=""; while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; *) shift;; esac; done
cat >"$out"
S
  # tar: a snapshot lists its files only when the bytes are the expected ones
  cat >"${T}/bin/tar" <<'S'
#!/bin/bash
body=$(cat)
[ "$body" = "snap-bytes" ] && [ ! -e "${T}/bad-snapshot" ] || exit 2
printf 'meta.json\nstate.bin\n'
S
  # curl: vault answers, object store listing and downloads, the API health check
  cat >"${T}/bin/curl" <<'S'
#!/bin/bash
args="$*"; cfg=$(cat)
echo "$args" >>"${T}/curl-calls"
case "$args" in
  *approle/login*) [ -e "${T}/vault-down" ] && exit 22; printf '{"auth":{"client_token":"tok"}}' ;;
  *revoke-self*) touch "${T}/revoked" ;;
  *backup/r2_access_key_id*) printf '{"data":{"data":{"value":"AKID"}}}' ;;
  *backup/r2_secret_access_key*) printf '{"data":{"data":{"value":"SECRET"}}}' ;;
  *restore/age_identity*) printf '{"data":{"data":{"value":"AGE-SECRET-KEY-TEST"}}}' ;;
  *list-type=2*prefix=vault/*) printf '<Key>vault/2026/11/nextjourney-vault-20261110T031500Z.snap.age</Key>' ;;
  *list-type=2*prefix=prd/*) printf '<Key>prd/2026/11/nextjourney-prd-20261108T031500Z.dump.age</Key><Key>prd/2026/11/nextjourney-prd-20261110T031500Z.dump.age</Key>' ;;
  */health*) if [ -e "${T}/health-down" ]; then exit 22; fi ;;
  *bucket/vault/*) printf 'snap-bytes' ;;
  *bucket/prd/*) printf 'dump-bytes' ;;
esac
S
  cat >"${T}/bin/docker" <<'S'
#!/bin/bash
args="$*"
echo "$args" >>"${T}/docker-calls"
case "$args" in
  "inspect -f"*) echo "sha256:image" ;;
  run*) echo container-id ;;
  *"bao status"*)
    n=$(cat "${T}/unsealed" 2>/dev/null || echo 0)
    if [ "$n" -ge 3 ]; then echo '{"sealed": false}'; else echo '{"sealed": true}'; exit 2; fi ;;
  *"operator init"*) echo '{"unseal_keys_b64":["tmpkey"],"root_token":"tmproot"}' ;;
  *"snapshot restore"*) echo 0 >"${T}/unsealed"; [ -e "${T}/snapshot-bad" ] && exit 1 ;;
  *"sys/unseal"*) cat >/dev/null; n=$(cat "${T}/unsealed" 2>/dev/null || echo 0); echo $((n + 1)) >"${T}/unsealed" ;;
  *"sh -c cat > /tmp/snapshot"*) cat >"${T}/snapshot-in-container" ;;
  *"auth/userpass/login"*)
    cat >/dev/null
    case "$args" in *nj-restore-proof*) [ -e "${T}/restored-login-refused" ] && exit 2 ;; esac
    echo token ;;
  *"token revoke -self"*) echo "$args" >>"${T}/live-revoked" ;;
  *"kv list -format=json kv/nextjourney/app"*) echo '["db"]' ;;
  *"kv list -format=json kv/nextjourney"*) echo '["app/","jwt"]' ;;
  *"kv get -format=json kv/nextjourney/app/db"*) echo '{"data":{"data":{"value":"x"}}}' ;;
  *"kv get -format=json kv/nextjourney/jwt"*)
    case "$args" in *nj-restore-proof*) [ -e "${T}/restored-differs" ] && { echo '{"data":{"data":{"value":"other"}}}'; exit 0; } ;; esac
    echo '{"data":{"data":{"value":"j"}}}' ;;
  *"policy list"*) echo '["default","nj-admin"]' ;;
  *"auth/approle/role"*) echo '["dev"]' ;;
  *"auth/userpass/users"*) echo '["pedro"]' ;;
  *"pg_restore"*) cat >"${T}/restored"; [ -e "${T}/restore-fails" ] && exit 1 ;;
  *"psql"*"_prisma_migrations"*) echo 15 ;;
  *"psql"*"from users"*) echo 8 ;;
  *"psql"*) cat >"${T}/purge-sql" ;;
  *"pg_dump"*) printf 'current-dump' ;;
esac
exit 0
S
  printf '#!/bin/bash\necho "$*" >>"${T}/notifications"\n' >"${T}/bin/notify"
  chmod +x "${T}"/bin/*
  export PATH="${T}/bin:${PATH}"
}

@test "test: the newest dump is restored into a throwaway database with the key from the vault" {
  run "$RESTORE" test prd </dev/null
  [ "$status" -eq 0 ]
  [ "$(cat "${T}/restored")" = "dump-bytes" ]
  grep -q 'prd/2026/11/nextjourney-prd-20261110T031500Z.dump.age' "${T}/curl-calls"
  ! grep -q '20261108' "${T}/curl-calls" || ! grep -q 'bucket/prd/2026/11/nextjourney-prd-20261108' "${T}/curl-calls"
  grep -q -- '--network none' "${T}/docker-calls"
  grep -q '^rm -f nj-restore-test-' "${T}/docker-calls"
  [ -s "${NJ_BACKUP_STATE}/restore-test-prd.last" ]
  [ -e "${T}/revoked" ]
  [ -z "$(ls -A "${T}/tmp")" ]
}

@test "test: a backup that does not restore fails, warns and records nothing" {
  touch "${T}/restore-fails"
  run "$RESTORE" test prd </dev/null
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/restore-test-prd.last" ]
  grep -q '^warning Restore test of prd failed' "${T}/notifications"
  grep -q '^rm -f nj-restore-test-' "${T}/docker-calls"
}

@test "test: a closed vault fails and warns" {
  touch "${T}/vault-down"
  run "$RESTORE" test prd </dev/null
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/restore-test-prd.last" ]
  grep -q '^warning Restore test of prd failed' "${T}/notifications"
}

@test "test: the vault snapshot must decrypt and hold the vault state" {
  run "$RESTORE" test vault </dev/null
  [ "$status" -eq 0 ]
  [ -s "${NJ_BACKUP_STATE}/restore-test-vault.last" ]
  touch "${T}/bad-snapshot"
  rm -f "${NJ_BACKUP_STATE}/restore-test-vault.last"
  run "$RESTORE" test vault </dev/null
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/restore-test-vault.last" ]
}

@test "explicit keys skip the vault (the vault may be the thing that was lost)" {
  printf 'AGE-SECRET-KEY-OFFLINE\n' >"${T}/offline.key"
  NJ_RESTORE_IDENTITY_FILE="${T}/offline.key" NJ_R2_KEY_ID=AKID NJ_R2_SECRET=SECRET run "$RESTORE" test prd </dev/null
  [ "$status" -eq 0 ]
  ! grep -q 'approle/login' "${T}/curl-calls"
}

@test "the object store keys only go through standard input" {
  run "$RESTORE" test prd </dev/null
  [ "$status" -eq 0 ]
  ! grep -q 'SECRET' "${T}/curl-calls"
}

@test "apply: refuses to run without --yes and touches nothing" {
  run "$RESTORE" apply prd </dev/null
  [ "$status" -eq 2 ]
  ! grep -q 'stop' "${T}/docker-calls"
  ! grep -q 'pg_restore' "${T}/docker-calls"
}

@test "apply: safety dump, API stopped, restore, purge, API started, one ok message" {
  run "$RESTORE" apply prd --yes </dev/null
  [ "$status" -eq 0 ]
  [ "$(cat "${T}/restored")" = "dump-bytes" ]
  ls "${NJ_BACKUP_DIR}/prd"/pre-restore-*.dump.age >/dev/null
  # order of the steps
  safety=$(grep -n 'pg_dump' "${T}/docker-calls" | head -1 | cut -d: -f1)
  stop=$(grep -n '^stop next-journey-prd-api-1' "${T}/docker-calls" | cut -d: -f1)
  restore=$(grep -n 'pg_restore' "${T}/docker-calls" | cut -d: -f1)
  start=$(grep -n '^start next-journey-prd-api-1' "${T}/docker-calls" | cut -d: -f1)
  [ "$safety" -lt "$stop" ]
  [ "$stop" -lt "$restore" ]
  [ "$restore" -lt "$start" ]
  grep -q "deleted_at < now() - interval '30 days'" "${T}/purge-sql"
  grep -q '^ok Restore of prd applied' "${T}/notifications"
}

@test "apply: --object restores that exact backup" {
  run "$RESTORE" apply prd --yes --object prd/2026/11/nextjourney-prd-20261108T031500Z.dump.age </dev/null
  [ "$status" -eq 0 ]
  grep -q 'bucket/prd/2026/11/nextjourney-prd-20261108T031500Z.dump.age' "${T}/curl-calls"
}

@test "apply: a failed restore leaves the API stopped and raises a critical alert with the safety dump" {
  touch "${T}/restore-fails"
  run "$RESTORE" apply prd --yes </dev/null
  [ "$status" -eq 1 ]
  ! grep -q '^start next-journey-prd-api-1' "${T}/docker-calls"
  grep -q '^critical Restore apply of prd failed.*pre-restore-' "${T}/notifications"
}

@test "apply: an API that does not come back healthy is reported as critical" {
  touch "${T}/health-down"
  run "$RESTORE" apply prd --yes </dev/null
  [ "$status" -eq 1 ]
  grep -q '^critical Restore apply of prd failed: the API did not become healthy' "${T}/notifications"
}

@test "watch: a restore test has its own, longer limit and its own message" {
  echo $(( $(date +%s) - 8 * 86400 )) >"${NJ_BACKUP_STATE}/restore-test-prd.last"
  run "$WATCH" restore-test-prd
  [ ! -e "${T}/notifications" ]
  echo $(( $(date +%s) - 10 * 86400 )) >"${NJ_BACKUP_STATE}/restore-test-prd.last"
  run "$WATCH" restore-test-prd
  grep -q '^critical The restore test of prd has not passed for 240 h' "${T}/notifications"
}

@test "prove: only the vault can be proven" {
  run "$RESTORE" prove prd </dev/null
  [ "$status" -eq 2 ]
}

@test "prove: the snapshot rebuilds the vault, opens with the shares and every secret matches" {
  run "$RESTORE" prove vault < <(printf 'share1\nshare2\nshare3\nadmin-password\n')
  [ "$status" -eq 0 ]
  [[ "$output" == *"secrets compared: 2"* ]]
  [[ "$output" == *"vault restore proof ok"* ]]
  [ -s "${NJ_BACKUP_STATE}/vault-restore-proof.last" ]
  grep -q '^ok Vault restore proof passed' "${T}/notifications"
  # the throwaway vault has no network, and goes away with the live token revoked
  grep -q -- '--network none' "${T}/docker-calls"
  grep -q '^rm -f nj-restore-proof-' "${T}/docker-calls"
  [ -s "${T}/live-revoked" ]
  [ -z "$(ls -A "${T}/tmp")" ]
}

@test "prove: the key shares and the password never appear in any command line" {
  run "$RESTORE" prove vault < <(printf 'share1\nshare2\nshare3\nadmin-password\n')
  [ "$status" -eq 0 ]
  ! grep -q -e 'share1' -e 'admin-password' -e 'tmpkey' "${T}/docker-calls"
}

@test "prove: a secret that differs fails the proof, shows the path and no value, records nothing" {
  touch "${T}/restored-differs"
  run "$RESTORE" prove vault < <(printf 'share1\nshare2\nshare3\nadmin-password\n')
  [ "$status" -eq 1 ]
  [[ "$output" == *"PROBLEM different value: kv/nextjourney/jwt"* ]]
  [[ "$output" != *"other"* ]]
  [ ! -e "${NJ_BACKUP_STATE}/vault-restore-proof.last" ]
  grep -q '^warning Restore prove of vault failed' "${T}/notifications"
}

@test "prove: a snapshot that does not restore fails" {
  touch "${T}/snapshot-bad"
  run "$RESTORE" prove vault < <(printf 'share1\nshare2\nshare3\nadmin-password\n')
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/vault-restore-proof.last" ]
}

@test "prove: wrong key shares leave the restored vault sealed and fail" {
  run "$RESTORE" prove vault < <(printf 'share1\n')
  [ "$status" -eq 1 ]
  [ ! -e "${NJ_BACKUP_STATE}/vault-restore-proof.last" ]
}

@test "prove: a restored vault that refuses the admin login fails" {
  touch "${T}/restored-login-refused"
  run "$RESTORE" prove vault < <(printf 'share1\nshare2\nshare3\nadmin-password\n')
  [ "$status" -eq 1 ]
  grep -q 'does not accept the admin login' <<<"$output$(cat "${T}/notifications")"
}
