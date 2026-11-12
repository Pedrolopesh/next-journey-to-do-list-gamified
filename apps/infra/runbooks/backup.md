# Runbook: database backup

A daily job dumps each environment listed in `backup_envs` (production by default), encrypts the dump with
`age` (public key only) and copies it to a private object store bucket. The private half of the age key is kept
offline and is never on the host, so a compromised host cannot read old backups.

```
timer nj-backup@<env> (03:15 UTC) -> pg_dump in the database container -> age -> /var/backups/nextjourney/<env> (7 days)
                                                                              -> object store <env>/<year>/<month>/ (8 days)
timer nj-backup@vault (03:15 UTC) -> raft snapshot of the vault (API, AppRole nj-backup) -> age -> same folder layout and bucket (vault/<year>/<month>/)
timer nj-restore-test@<env|vault> (Sun 05:00 UTC) -> newest backup -> decrypt -> throwaway Postgres (or snapshot check) -> pass/fail
timer nj-backup-watch (hourly)    -> critical alert when no upload for 26 h (database or vault snapshot) or no passing restore test for 9 days, one "ok" when it recovers
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

## Automatic restore (no manual steps)

Two keys can open a backup, and every new backup is encrypted for both:

- **Offline key** (`backup_age_recipient`): in the password manager and an offline copy, never on the host. The last resort if the vault and the host are both lost.
- **Automation key** (`backup_restore_recipient`): its private half lives in the vault at `kv/nextjourney/restore/age_identity`, readable only by the `nj-restore` AppRole. It lets the host test and apply restores by itself. Backups made before this key was set open only with the offline key.

### Weekly test (automatic)

`nj-restore-test@prd` and `nj-restore-test@vault` run every Sunday at 05:00 UTC. The first downloads the newest database backup from the bucket, decrypts it in memory and restores it into a throwaway Postgres container with no network, then checks the migration history and the users table. The second checks that the newest vault snapshot decrypts and holds the vault state. A pass writes `/var/lib/nj-backup/restore-test-<name>.last`; a failure sends a warning to Discord, and `nj-backup-watch` raises a critical alert after 9 days without a pass.

Run one by hand: `sudo systemctl start nj-restore-test@prd.service` and `sudo journalctl -u nj-restore-test@prd.service`. The last line must be `restore test ok`.

### Applying a restore of an environment (automatic)

```
sudo nj-restore apply prd --yes                      # newest backup
sudo nj-restore apply prd --yes --object <key>       # a specific one, key as listed in the bucket
```

In order: a safety dump of the current database (`pre-restore-<time>.dump.age` in the backup folder), the API container stops, the database is restored over the current one, accounts whose deletion was already due are purged (`docs/BACKUP.md`), the API starts and its health check must pass, then one "ok" message with the safety dump path. If any step fails the API stays stopped, a critical alert names the safety dump, and nothing is retried by itself. Expect to lose at most the time since the last backup (up to 24 hours).

### When the vault is lost too

The host cannot ask the vault for anything, so hand `nj-restore` the keys directly (the offline age file and the object store keys from the password manager):

```
sudo NJ_RESTORE_IDENTITY_FILE=/path/to/offline-age-file NJ_R2_KEY_ID=... NJ_R2_SECRET=... nj-restore apply prd --yes
```

To rebuild the vault itself first, see the next section.

### Setup of the automation key (once)

1. Generate a second age key pair on a trusted workstation. Put the public half in the inventory as `backup_restore_recipient` and keep the private half in the password manager.
2. With an admin token (`nj-openbao-configure` loads the `nj-restore` policy and role): `nj-openbao-approle restore`, then store the private half: `read -rs V; printf %s "$V" | nj-bao kv put kv/nextjourney/restore/age_identity value=-; unset V`.
3. Apply `app.yml --tags openbao,backup`. Run `sudo systemctl start nj-backup@prd.service` (the first backup for both keys), then `sudo systemctl start nj-restore-test@prd.service` and `nj-restore-test@vault.service`.

## Proving that the vault can be rebuilt from a snapshot

`nj-restore prove vault` does the whole proof on the host, with no second server. Run it from a terminal, as root, after taking a fresh snapshot so nothing changed in between:

```
sudo systemctl start nj-backup@vault.service
sudo nj-restore prove vault
```

What it does by itself:

1. Takes the newest `vault/` snapshot from the object store and decrypts it in memory with the automation key.
2. Starts a throwaway vault from the same image as the real one: no network, data only in memory, a configuration without secrets.
3. Restores the snapshot into it. The restored vault is sealed with the **original** key shares.
4. Asks for key shares (hidden) until it opens: this is the proof that 3 of the 5 shares still open a vault rebuilt from the backup.
5. Asks for the password of the admin user once (hidden) and logs in to both vaults with it: the login survived the backup.
6. Compares every secret under `kv/nextjourney` by hash (the values are never printed), and the lists of policies, AppRole roles and admin users.
7. Removes the throwaway vault, revokes the tokens and writes `vault-restore-proof.last` in the state directory. Any difference fails the proof and names only the paths.

Only after this has passed once is it safe to remove the `.cred` files of the application secrets.

### Restoring the vault for real

1. Download the newest `vault/<year>/<month>/...snap.age` object and decrypt it with an age key that opens it (the automation key, or the offline one if the vault is gone).
2. On a clean host, start an empty vault with the same configuration and initialise it. Then, with a root token of that new vault: `nj-bao operator raft snapshot restore -force <file>`.
3. Unseal with 3 of the 5 shares of the **original** vault (`sudo nj-unseal`): a restored vault opens with the original shares, not with the new ones.
4. Check that the application secrets read back and that the AppRoles log in.

## Manual restore test (workstation, last resort)

The weekly test above does this on the host. This script does it from a workstation with the offline age file only:

```
NJ_R2_KEY_ID=... NJ_R2_SECRET=... NJ_R2_ENDPOINT=... NJ_R2_BUCKET=... \
  scripts/restore-test.sh prd /path/to/age-identity-file
```

It downloads the newest backup, decrypts it, restores it into a throwaway Postgres container and prints table row counts. Run it after the first backup, then at least monthly, and record the date and the time it took.

## Restoring for real by hand (last resort)

Prefer `nj-restore apply`. By hand: 1. Download and decrypt as above (the script shows the steps), stop the API of the environment, restore with `pg_restore --clean --if-exists --no-owner` into the environment database, start the API.
2. After a restore, run the purge of deleted accounts described in `docs/BACKUP.md`, so accounts deleted after the backup do not come back.
