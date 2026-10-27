#!/usr/bin/env bats

ENTRY="${BATS_TEST_DIRNAME}/../ansible/roles/app/files/nj-ci-entry"
DIGEST="sha256:$(printf 'a%.0s' {1..64})"

setup() {
  export NJ_DRY_RUN=1 NJ_BIN_DIR=/sbin-under-test
  export NJ_CI_CONF="${BATS_TEST_TMPDIR}/ci.conf"
  printf "NJ_IMAGE_REPO='ghcr.io/owner/repo'\nNJ_SIGNER_REPO='owner/repo'\n" > "$NJ_CI_CONF"
  API="ghcr.io/owner/repo/api@${DIGEST}"
  MIGRATE="ghcr.io/owner/repo/api-migrate@${DIGEST}"
}

@test "release verifies the images, then releases the environment" {
  run "$ENTRY" "release dev 0123abcd ${API} ${MIGRATE}"
  [ "$status" -eq 0 ]
  [ "${lines[0]}" = "/sbin-under-test/nj-pull-verified 0123abcd ${API} ${MIGRATE}" ]
  [ "${lines[1]}" = "/sbin-under-test/nj-release dev 0123abcd" ]
}

@test "release passes seed through" {
  run "$ENTRY" "release prd 0123abcd ${API} ${MIGRATE} seed"
  [ "$status" -eq 0 ]
  [ "${lines[1]}" = "/sbin-under-test/nj-release prd 0123abcd seed" ]
}

@test "rollback calls the rollback script" {
  run "$ENTRY" "rollback prd"
  [ "$status" -eq 0 ]
  [ "$output" = "/sbin-under-test/nj-app-rollback prd" ]
}

@test "empty request is rejected" {
  run "$ENTRY" ""
  [ "$status" -eq 2 ]
}

@test "unknown verbs are rejected" {
  run "$ENTRY" "bash -c id"
  [ "$status" -eq 2 ]
  run "$ENTRY" "release-all dev"
  [ "$status" -eq 2 ]
}

@test "unknown environments are rejected" {
  run "$ENTRY" "release staging 0123abcd ${API} ${MIGRATE}"
  [ "$status" -eq 2 ]
  run "$ENTRY" "rollback ../prd"
  [ "$status" -eq 2 ]
}

@test "tag must be 8 lowercase hex characters" {
  for tag in 0123ABCD 0123abc 0123abcde "0123abcg"; do
    run "$ENTRY" "release dev ${tag} ${API} ${MIGRATE}"
    [ "$status" -eq 2 ]
  done
}

@test "images from another registry path are rejected" {
  run "$ENTRY" "release dev 0123abcd ghcr.io/evil/repo/api@${DIGEST} ${MIGRATE}"
  [ "$status" -eq 2 ]
  run "$ENTRY" "release dev 0123abcd ${API} ghcr.io/owner/repo/api@${DIGEST}"
  [ "$status" -eq 2 ]
}

@test "images must be pinned by a full digest, not a tag" {
  run "$ENTRY" "release dev 0123abcd ghcr.io/owner/repo/api:latest ${MIGRATE}"
  [ "$status" -eq 2 ]
  run "$ENTRY" "release dev 0123abcd ghcr.io/owner/repo/api@sha256:abc ${MIGRATE}"
  [ "$status" -eq 2 ]
}

@test "the last argument can only be seed" {
  run "$ENTRY" "release dev 0123abcd ${API} ${MIGRATE} drop-database"
  [ "$status" -eq 2 ]
}

@test "extra arguments and shell metacharacters are rejected" {
  run "$ENTRY" "release dev 0123abcd ${API} ${MIGRATE} seed extra"
  [ "$status" -eq 2 ]
  run "$ENTRY" "release dev 0123abcd; id ${API} ${MIGRATE}"
  [ "$status" -eq 2 ]
  run "$ENTRY" $'rollback dev\nrollback prd'
  [ "$status" -eq 2 ]
}
