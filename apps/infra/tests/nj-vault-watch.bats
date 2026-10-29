#!/usr/bin/env bats

WATCH="${BATS_TEST_DIRNAME}/../ansible/roles/openbao/files/nj-vault-watch"

setup() {
  export NJ_STATE_DIR="${BATS_TEST_TMPDIR}/state" NJ_CONF_DIR="${BATS_TEST_TMPDIR}/etc"
  export NJ_VAULT_ADDR="https://vault.test" NJ_VAULT_CACERT="/dev/null"
  export NJ_REMIND_SECONDS=900
  CALLS="${BATS_TEST_TMPDIR}/calls"
  export CALLS
  : >"$CALLS"
  mkdir -p "$NJ_CONF_DIR"
  printf "NJ_PORT=3010\n" >"${NJ_CONF_DIR}/dev.env"
  printf "NJ_PORT=3020\n" >"${NJ_CONF_DIR}/prd.env"

  STUBS="${BATS_TEST_TMPDIR}/bin"
  mkdir -p "$STUBS"
  # Every alert is recorded instead of sent
  export NJ_NOTIFY="${STUBS}/notify"
  printf '#!/bin/bash\necho "notify $1 $2" >>"$CALLS"\n' >"$NJ_NOTIFY"
  # FAKE_HEALTH: vault health code (000 = unreachable); FAKE_DOWN: environments whose /health fails
  cat >"${STUBS}/curl" <<'S'
#!/bin/bash
url="${*: -1}"
case "$url" in
  */v1/sys/health) [ "${FAKE_HEALTH:-200}" = 000 ] && exit 7; printf '%s' "${FAKE_HEALTH:-200}" ;;
  http://127.0.0.1:3010/health) case " ${FAKE_DOWN:-} " in *" dev "*) exit 22 ;; esac ;;
  http://127.0.0.1:3020/health) case " ${FAKE_DOWN:-} " in *" prd "*) exit 22 ;; esac ;;
esac
S
  # FAKE_INACTIVE: environments whose unit is not running; started ones are recorded
  cat >"${STUBS}/systemctl" <<'S'
#!/bin/bash
case "$1" in
  is-enabled) exit 0 ;;
  is-active)
    for env in ${FAKE_INACTIVE:-}; do [[ "$*" == *"nj@${env}.service"* ]] && exit 3; done
    exit 0 ;;
  start) echo "start $2" >>"$CALLS"; exit 0 ;;
esac
S
  printf '#!/bin/bash\nexit 0\n' >"${STUBS}/openssl"
  chmod +x "$NJ_NOTIFY" "${STUBS}/curl" "${STUBS}/systemctl" "${STUBS}/openssl"
  export PATH="${STUBS}:${PATH}"
}

@test "a sealed vault raises one critical alert" {
  FAKE_HEALTH=503 run "$WATCH" watch
  [ "$status" -eq 0 ]
  [ "$(grep -c '^notify critical' "$CALLS")" -eq 1 ]
}

@test "the sealed alert is not repeated before the reminder interval" {
  FAKE_HEALTH=503 "$WATCH" watch
  FAKE_HEALTH=503 "$WATCH" watch
  [ "$(grep -c '^notify critical' "$CALLS")" -eq 1 ]
}

@test "the sealed alert is repeated after the reminder interval" {
  FAKE_HEALTH=503 "$WATCH" watch
  echo 1 >"${NJ_STATE_DIR}/last_alert"
  FAKE_HEALTH=503 "$WATCH" watch
  [ "$(grep -c '^notify critical' "$CALLS")" -eq 2 ]
}

@test "opening the vault starts the environments that were waiting and reports it" {
  FAKE_HEALTH=503 "$WATCH" watch
  : >"$CALLS"
  FAKE_HEALTH=200 FAKE_INACTIVE="dev prd" "$WATCH" watch
  grep -q '^start nj@dev.service' "$CALLS"
  grep -q '^start nj@prd.service' "$CALLS"
  grep -q '^notify ok Vault opened. Environments started: dev prd' "$CALLS"
}

@test "an environment that does not come up is reported as a warning" {
  FAKE_HEALTH=503 "$WATCH" watch
  : >"$CALLS"
  FAKE_HEALTH=200 FAKE_INACTIVE="prd" FAKE_DOWN="prd" "$WATCH" watch
  grep -q '^notify warning .*prd' "$CALLS"
}

@test "an open vault that stays open is silent" {
  FAKE_HEALTH=200 "$WATCH" watch
  FAKE_HEALTH=200 "$WATCH" watch
  [ ! -s "$CALLS" ]
}

@test "an unreachable vault warns once" {
  FAKE_HEALTH=000 "$WATCH" watch
  FAKE_HEALTH=000 "$WATCH" watch
  [ "$(grep -c '^notify warning' "$CALLS")" -eq 1 ]
}

@test "after a reboot a sealed vault is a critical alert" {
  FAKE_HEALTH=503 run "$WATCH" boot
  [ "$status" -eq 0 ]
  [ "$(grep -c '^notify critical' "$CALLS")" -eq 1 ]
}

@test "after a reboot with everything healthy the report is ok" {
  mkdir -p "${BATS_TEST_TMPDIR}/none"
  FAKE_HEALTH=200 run "$WATCH" boot
  [ "$status" -eq 0 ]
  grep -q '^notify ok Reboot finished' "$CALLS" || grep -q '^notify warning' "$CALLS"
}

@test "after a reboot an unhealthy environment is reported" {
  FAKE_HEALTH=200 FAKE_DOWN="dev" run "$WATCH" boot
  grep -q '^notify warning .*dev not healthy' "$CALLS"
}

@test "an unknown mode is rejected" {
  run "$WATCH" nonsense
  [ "$status" -eq 2 ]
}
