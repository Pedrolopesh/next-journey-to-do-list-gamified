#!/usr/bin/env bats

DEPLOY="${BATS_TEST_DIRNAME}/../scripts/deploy.sh"

@test "environment must be dev or prd" {
  run "$DEPLOY" staging
  [ "$status" -eq 2 ]
}

@test "the third argument can only be seed" {
  run "$DEPLOY" dev main wipe
  [ "$status" -eq 2 ]
}

@test "VPS_HOST is required" {
  run env -u VPS_HOST "$DEPLOY" dev main
  [ "$status" -ne 0 ]
  [[ "$output" == *VPS_HOST* ]]
}
