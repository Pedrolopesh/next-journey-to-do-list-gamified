# Postgres backup and restore

## Taking a backup

```bash
DATABASE_URL=<database url> scripts/backup-db.sh /path/to/backups
```

- `pg_dump` custom format, file `nextjourney-<date>.dump` with permission 600.
- Deletes backups older than `BACKUP_RETENTION_DAYS` days (default 14).
- Use a `pg_dump` of the same version (or older) as the server. With a newer client the restore
  warns about `transaction_timeout`, which is harmless, but avoid it.
- Schedule it on the server (daily cron) and **copy the dumps off the machine** (another provider or
  object storage). A backup on the same disk does not protect against losing the disk.
- The dumps contain personal data: they never go to Git (`backups/` and `*.dump` are in `.gitignore`)
  and must be stored with restricted access.

## Testing the restore (mandatory on every routine change)

```bash
# 1. create a throwaway database, NEVER the production one
# 2. restore and check
RESTORE_DATABASE_URL=<throwaway database url> scripts/restore-test.sh file.dump
```

The script restores, prints the count of the key tables and fails if the migration history comes
back empty. Test done on 2026-10-09 with the local test database: 513 users, 375 items, 446 checks,
5 stories, 25 chapters and 3 migrations restored.

## Disaster recovery (summary)

1. Start a new Postgres on the same major version.
2. `pg_restore --no-owner --dbname <url> file.dump`.
3. Point the API `DATABASE_URL` at it and start the API.
4. Accounts deleted more than 30 days ago come back from the old backup: run the purge routine (it
   runs by itself at 03:00) before reopening the service, to honor the requested deletion.
