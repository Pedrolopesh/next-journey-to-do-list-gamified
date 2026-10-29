# The dev application reads only its own secrets. Nothing else, and not the other environment.
path "kv/data/nextjourney/dev/*" {
  capabilities = ["read"]
}

path "kv/metadata/nextjourney/dev/*" {
  capabilities = ["read", "list"]
}
