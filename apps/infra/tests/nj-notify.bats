#!/usr/bin/env bats

NOTIFY="${BATS_TEST_DIRNAME}/../ansible/roles/openbao/files/nj-notify"

setup() {
  export NJ_ALERTS_CRED="${BATS_TEST_TMPDIR}/webhook.cred" NJ_TMP_DIR="${BATS_TEST_TMPDIR}"
  STUBS="${BATS_TEST_TMPDIR}/bin"
  mkdir -p "$STUBS"
  printf '#!/bin/bash\nprintf "https://discord.test/api/webhooks/id/token"\n' >"${STUBS}/systemd-creds"
  # Records the curl config received on stdin and the posted body
  cat >"${STUBS}/curl" <<'S'
#!/bin/bash
cfg=$(cat)
printf '%s\n' "$cfg" >"${BATS_TEST_TMPDIR}/curl-config"
file=$(printf '%s\n' "$cfg" | sed -n 's/^data = "@\(.*\)"$/\1/p')
cp "$file" "${BATS_TEST_TMPDIR}/body"
printf '%s' "${FAKE_CODE:-204}"
S
  chmod +x "${STUBS}/systemd-creds" "${STUBS}/curl"
  export PATH="${STUBS}:${PATH}"
  export BATS_TEST_TMPDIR
}

@test "without a webhook it reports failure and sends nothing" {
  run "$NOTIFY" critical "Vault sealed"
  [ "$status" -eq 1 ]
  [ ! -e "${BATS_TEST_TMPDIR}/body" ]
}

@test "the message is posted with its level, and the URL only goes through stdin" {
  : >"$NJ_ALERTS_CRED"
  run "$NOTIFY" critical "Vault sealed"
  [ "$status" -eq 0 ]
  grep -q '\[CRITICAL\] Vault sealed' "${BATS_TEST_TMPDIR}/body"
  grep -q 'url = "https://discord.test/api/webhooks/id/token"' "${BATS_TEST_TMPDIR}/curl-config"
}

@test "the temporary body does not stay behind" {
  : >"$NJ_ALERTS_CRED"
  "$NOTIFY" ok "all good"
  [ -z "$(ls "${BATS_TEST_TMPDIR}" | grep '^nj-notify\.')" ]
}

@test "an unknown level is rejected" {
  run "$NOTIFY" shout "hello"
  [ "$status" -eq 2 ]
}

@test "a rejected webhook is reported as not delivered" {
  : >"$NJ_ALERTS_CRED"
  FAKE_CODE=404 run "$NOTIFY" ok "hello"
  [ "$status" -eq 1 ]
  [[ "$output" == *"NOT delivered (HTTP 404)"* ]]
}

@test "a delivered alert says so" {
  : >"$NJ_ALERTS_CRED"
  run "$NOTIFY" ok "hello"
  [[ "$output" == *"alert delivered"* ]]
}
