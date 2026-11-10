# The backup job reads only the object store keys. Nothing else.
path "kv/data/nextjourney/backup/*" {
  capabilities = ["read"]
}

path "kv/metadata/nextjourney/backup/*" {
  capabilities = ["read", "list"]
}
