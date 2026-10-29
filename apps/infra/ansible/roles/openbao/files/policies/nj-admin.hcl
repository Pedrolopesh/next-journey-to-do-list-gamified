# Day-to-day administration, so the root token is not needed after the first setup.
path "kv/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}

path "auth/approle/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "auth/userpass/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "sys/policies/acl/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/audit*" {
  capabilities = ["read", "list", "sudo"]
}

path "sys/auth*" {
  capabilities = ["read", "list"]
}

path "sys/mounts*" {
  capabilities = ["read", "list"]
}

path "sys/seal" {
  capabilities = ["update", "sudo"]
}

path "sys/storage/raft/snapshot" {
  capabilities = ["read"]
}
