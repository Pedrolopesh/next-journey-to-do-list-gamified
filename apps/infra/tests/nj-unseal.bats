#!/usr/bin/env bats

UNSEAL="${BATS_TEST_DIRNAME}/../ansible/roles/openbao/files/nj-unseal"

setup() {
  STUBS="${BATS_TEST_TMPDIR}/bin"
  mkdir -p "$STUBS"
  export COUNT="${BATS_TEST_TMPDIR}/shares" BODIES="${BATS_TEST_TMPDIR}/bodies"
  : >"$COUNT"
  : >"$BODIES"
  # Fake vault: opens after three shares. FAKE_MODE: unreachable | uninitialized
  cat >"${STUBS}/curl" <<'S'
#!/bin/bash
url="${*: -1}"
[ "${FAKE_MODE:-}" = unreachable ] && exit 7
case "$url" in
  */sys/seal-status)
    if [ "${FAKE_MODE:-}" = uninitialized ]; then printf '{"initialized":false,"sealed":true}'; exit 0; fi
    if [ "$(wc -l <"$COUNT")" -ge 3 ]; then printf '{"initialized":true,"sealed":false}'; else printf '{"initialized":true,"sealed":true}'; fi ;;
  */sys/unseal)
    cat >>"$BODIES"
    echo x >>"$COUNT" ;;
esac
S
  chmod +x "${STUBS}/curl"
  export PATH="${STUBS}:${PATH}"
}

@test "--stdin posts the share as JSON" {
  run bash -c "printf 'share-one\n' | '$UNSEAL' --stdin"
  [ "$status" -eq 0 ]
  grep -q '"key": "share-one"' "$BODIES"
}

@test "the interactive loop stops once the vault is open" {
  run bash -c "printf 'a\nb\nc\n' | '$UNSEAL'"
  [ "$status" -eq 0 ]
  [[ "$output" == *"vault open"* ]]
  [ "$(wc -l <"$COUNT")" -eq 3 ]
}

@test "an unreachable vault is an error, not an endless prompt" {
  FAKE_MODE=unreachable run bash -c "printf 'a\n' | '$UNSEAL'"
  [ "$status" -eq 1 ]
  [[ "$output" == *"cannot reach the vault"* ]]
}

@test "an uninitialized vault is an error" {
  FAKE_MODE=uninitialized run bash -c "printf 'a\n' | '$UNSEAL'"
  [ "$status" -eq 1 ]
  [[ "$output" == *"not initialized"* ]]
}
