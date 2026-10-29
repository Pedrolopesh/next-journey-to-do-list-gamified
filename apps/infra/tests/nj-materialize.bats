#!/usr/bin/env bats

SCRIPT="${BATS_TEST_DIRNAME}/../ansible/roles/app/files/nj-materialize"
NAMES="postgres_password database_url jwt_access_secret resend_api_key"

setup() {
  export NJ_RUN_DIR="${BATS_TEST_TMPDIR}/run" NJ_CONF_DIR="${BATS_TEST_TMPDIR}/etc" NJ_NO_CHOWN=1
  export CREDENTIALS_DIRECTORY="${BATS_TEST_TMPDIR}/creds"
  export NJ_VAULT_ADDR="https://vault.test" NJ_VAULT_CACERT="/dev/null"
  mkdir -p "$NJ_RUN_DIR" "$CREDENTIALS_DIRECTORY" "${NJ_CONF_DIR}/creds/dev"
  for n in $NAMES; do printf 'local-%s' "$n" >"${CREDENTIALS_DIRECTORY}/${n}"; done
  printf 'role-1' >"${NJ_CONF_DIR}/creds/dev/openbao_role_id"
  : >"${NJ_CONF_DIR}/creds/dev/openbao_secret_id.cred"

  # Stubs first in PATH: no network, no systemd
  STUBS="${BATS_TEST_TMPDIR}/bin"
  mkdir -p "$STUBS"
  cat >"${STUBS}/systemd-creds" <<'S'
#!/bin/bash
printf 'secret-id-1'
S
  cat >"${STUBS}/curl" <<'S'
#!/bin/bash
# Fake vault. FAKE_HEALTH sets the health code; FAKE_FAIL_PATH makes one secret unreadable.
case " $* " in *" -K "* | *" --data "*) cat >/dev/null ;; esac
url="${*: -1}"
case "$url" in
  */v1/sys/health) printf '%s' "${FAKE_HEALTH:-200}"; [ "${FAKE_HEALTH:-200}" = 000 ] && exit 7; exit 0 ;;
  */v1/auth/approle/login) printf '{"auth":{"client_token":"tok"}}' ;;
  */v1/auth/token/revoke-self) ;;
  */v1/kv/data/nextjourney/*)
    name="${url##*/}"
    if [ "${FAKE_FAIL_PATH:-}" = "$name" ]; then exit 22; fi
    printf '{"data":{"data":{"value":"vault-%s"}}}' "$name" ;;
  *) exit 22 ;;
esac
S
  chmod +x "${STUBS}/systemd-creds" "${STUBS}/curl"
  export PATH="${STUBS}:${PATH}"
  OUT="${NJ_RUN_DIR}/nj-dev/secrets"
}

@test "the local credentials are copied when the source is creds" {
  run "$SCRIPT" dev
  [ "$status" -eq 0 ]
  for n in $NAMES; do [ "$(cat "${OUT}/${n}")" = "local-${n}" ]; done
}

@test "the values come from the vault when the source is openbao" {
  NJ_SECRETS_SOURCE=openbao run "$SCRIPT" dev
  [ "$status" -eq 0 ]
  for n in $NAMES; do [ "$(cat "${OUT}/${n}")" = "vault-${n}" ]; done
}

@test "files are readable only by their owner" {
  NJ_SECRETS_SOURCE=openbao run "$SCRIPT" dev
  [ "$status" -eq 0 ]
  for n in $NAMES; do [ "$(stat -f '%Lp' "${OUT}/${n}" 2>/dev/null || stat -c '%a' "${OUT}/${n}")" = 400 ]; done
}

@test "a sealed vault with the fallback on uses the local credentials" {
  FAKE_HEALTH=503 NJ_SECRETS_SOURCE=openbao NJ_SECRETS_FALLBACK=yes run "$SCRIPT" dev
  [ "$status" -eq 0 ]
  [[ "$output" == *"WARNING"* ]]
  [ "$(cat "${OUT}/jwt_access_secret")" = "local-jwt_access_secret" ]
}

@test "a sealed vault without the fallback fails and writes nothing" {
  FAKE_HEALTH=503 NJ_SECRETS_SOURCE=openbao run "$SCRIPT" dev
  [ "$status" -eq 1 ]
  [ -z "$(ls -A "$OUT")" ]
}

@test "one unreadable secret fails the whole read and writes nothing" {
  FAKE_FAIL_PATH=database_url NJ_SECRETS_SOURCE=openbao run "$SCRIPT" dev
  [ "$status" -eq 1 ]
  [ -z "$(ls -A "$OUT")" ]
}

@test "an unknown source is rejected" {
  NJ_SECRETS_SOURCE=vault run "$SCRIPT" dev
  [ "$status" -eq 2 ]
}

@test "the environment is required" {
  run "$SCRIPT"
  [ "$status" -ne 0 ]
}
