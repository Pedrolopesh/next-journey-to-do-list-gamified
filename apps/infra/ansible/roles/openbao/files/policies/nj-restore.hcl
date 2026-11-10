# The restore job (weekly test and real restores) reads the object store keys and the age key that opens the
# backups. It cannot write anything.
path "kv/data/nextjourney/backup/r2_*" {
  capabilities = ["read"]
}

path "kv/data/nextjourney/restore/*" {
  capabilities = ["read"]
}
