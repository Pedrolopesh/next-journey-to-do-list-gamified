# Runbook: database backup

A daily job dumps each environment listed in `backup_envs` (production by default), encrypts the dump with
`age` (public key only) and copies it to a private object store bucket. The private half of the age key is kept
offline and is never on the host, so a compromised host cannot read old backups.

```
timer nj-backup@<env> (03:15 UTC) -> pg_dump in the database container -> age -> /var/backups/nextjourney/<env> (7 days)
                                                                              -> object store <env>/<year>/<month>/ (30 days)
timer nj-backup-watch (hourly)    -> critical alert when no upload for 26 h, one "ok" when it recovers
```

## Setup (once)

1. **Bucket.** Private, no public domain, lifecycle rule that deletes after 30 days and aborts incomplete uploads after 1 day, and a bucket lock of 7 days so objects cannot be deleted or overwritten meanwhile.
2. **Keys.** An access key restricted to that bucket (object read and write). The provider has no write-only role, so the lock above is what protects old objects from a leaked key.
3. **age key pair.** Generate it on a trusted workstation, store the private file in the password manager and in an offline copy, then delete it from the disk. Only the public key (`age1...`) goes into the inventory.
4. **Inventory (local, not in Git).** `backup_age_recipient`, `backup_endpoint`, `backup_bucket`.
5. **Vault.** The policy and AppRole `nj-backup` come with the `openbao` role (`BAO_TOKEN=... nj-openbao-configure`, then `BAO_TOKEN=... nj-openbao-approle backup`). Write the keys:

```
printf %s '<key id>'     | BAO_TOKEN=<admin token> nj-bao kv put kv/nextjourney/backup/r2_access_key_id value=-
printf %s '<key secret>' | BAO_TOKEN=<admin token> nj-bao kv put kv/nextjourney/backup/r2_secret_access_key value=-
```

6. Run `app.yml --tags openbao,backup`, then a first backup by hand: `sudo systemctl start nj-backup@prd.service` and `journalctl -u nj-backup@prd.service`.

## When it fails

- The dump and encryption run before the vault is touched, so a sealed vault only delays the upload: the encrypted dump stays on the host for 7 days and the alert fires after 26 hours. Open the vault (`sudo nj-unseal`) and run the unit again.
- Check the last upload time: `sudo cat /var/lib/nj-backup/prd.last` (epoch seconds).

## Restore test

On a trusted workstation (never on the host), with the offline age file:

```
NJ_R2_KEY_ID=... NJ_R2_SECRET=... NJ_R2_ENDPOINT=... NJ_R2_BUCKET=... \
  scripts/restore-test.sh prd /path/to/age-identity-file
```

It downloads the newest backup, decrypts it, restores it into a throwaway Postgres container and prints table row counts. Run it after the first backup, then at least monthly, and record the date and the time it took.

## Restoring for real

1. Download and decrypt as above (the script shows the steps), stop the API of the environment, restore with `pg_restore --clean --if-exists --no-owner` into the environment database, start the API.
2. After a restore, run the purge of deleted accounts described in `docs/BACKUP.md`, so accounts deleted after the backup do not come back.
