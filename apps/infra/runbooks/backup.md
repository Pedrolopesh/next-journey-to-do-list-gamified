# Runbook: database backup

A daily job dumps each environment listed in `backup_envs` (production by default), encrypts the dump with
`age` (public key only) and copies it to a private object store bucket. The private half of the age key is kept
offline and is never on the host, so a compromised host cannot read old backups.

```
timer nj-backup@<env> (03:15 UTC) -> pg_dump in the database container -> age -> /var/backups/nextjourney/<env> (7 days)
                                                                              -> object store <env>/<year>/<month>/ (8 days)
timer nj-backup@vault (03:15 UTC) -> raft snapshot of the vault (API, AppRole nj-backup) -> age -> same folder layout and bucket (vault/<year>/<month>/)
timer nj-backup-watch (hourly)    -> critical alert when no upload for 26 h (database or vault snapshot), one "ok" when it recovers
```

The vault snapshot holds every secret of the applications. It is encrypted with `age` before it leaves the host and is still sealed by the vault itself, so reading it back also needs 3 of the 5 unseal key shares. The shares never go into a backup, the bucket or this repository. A snapshot can only be taken while the vault is open: with the vault sealed the run fails, warns, and the unit retries every 15 minutes (the stale alert covers a longer outage).

## Setup (once)

1. **Bucket.** Private, no public domain, lifecycle rule that deletes after 8 days (the privacy policy promises 7 days of backups, and the lock below covers the first 7) and aborts incomplete uploads after 1 day, and a bucket lock of 7 days so objects cannot be deleted or overwritten meanwhile.
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

- The dump and encryption run before the vault is touched, so a sealed vault only delays the upload: the encrypted dump stays on the host for 7 days and the alert fires after 26 hours. Open the vault (`sudo nj-unseal`) and run the unit again: it also uploads every dump still missing from the store, oldest first. A failed run is retried by systemd every 15 minutes (four times).
- Check the last upload time: `sudo cat /var/lib/nj-backup/prd.last` (epoch seconds).

## Restoring the vault from a snapshot

1. Download the newest `vault/<year>/<month>/...snap.age` object and decrypt it on a trusted workstation with the offline age file (the same steps as the database restore).
2. On a clean host, start an empty vault with the same configuration and initialise it. Then, with a root token of that new vault: `nj-bao operator raft snapshot restore -force <file>`.
3. Unseal with 3 of the 5 shares of the **original** vault (`sudo nj-unseal`): a restored vault opens with the original shares, not with the new ones.
4. Check the secrets by hash, without printing them, and check that the AppRoles log in. Only after a snapshot has been restored this way once is it safe to remove the `.cred` files of the application secrets.

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
