# The prd application reads only its own secrets. Nothing else, and not the other environment.
path "kv/data/nextjourney/prd/*" {
  capabilities = ["read"]
}

path "kv/metadata/nextjourney/prd/*" {
  capabilities = ["read", "list"]
}
