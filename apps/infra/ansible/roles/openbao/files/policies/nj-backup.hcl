# The backup job reads the object store keys and takes the vault snapshot. Nothing else.
path "kv/data/nextjourney/backup/*" {
  capabilities = ["read"]
}

path "kv/metadata/nextjourney/backup/*" {
  capabilities = ["read", "list"]
}

# The daily snapshot of the vault itself (encrypted with age before it leaves the host).
path "sys/storage/raft/snapshot" {
  capabilities = ["read"]
}
