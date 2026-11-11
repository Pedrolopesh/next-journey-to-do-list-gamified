# tofu

- DNS records for the API (`api` and `api-dev`, type A) with the `hostinger/hostinger` provider.
- The private backup bucket (Cloudflare R2): the bucket itself, its lifecycle rules (expire after 8 days, drop unfinished uploads after 1 day) and the 7-day retention lock, with the `cloudflare/cloudflare` provider.

```bash
export HOSTINGER_API_TOKEN=...                   # session only
export CLOUDFLARE_API_TOKEN=...                  # session only; needs R2 admin on the account, keep it off the server
cp terraform.tfvars.example terraform.tfvars     # fill in the values (git-ignored)
tofu init && tofu plan                           # the plan only shows changes; nothing changes without `tofu apply`
```

## Adopting the bucket that already exists

The bucket was created by hand, so it has to be imported before the first plan. Otherwise the plan would try to create it again.

```bash
tofu import cloudflare_r2_bucket.backups "<account-id>/<bucket-name>/default"
tofu import cloudflare_r2_bucket_lifecycle.backups "<account-id>/<bucket-name>"
tofu import cloudflare_r2_bucket_lock.backups "<account-id>/<bucket-name>"
tofu plan                                        # must show no changes
```

If the plan shows a difference, the code is wrong or the bucket was changed by hand: fix the code to match what is wanted, never apply a plan you have not read. The location of a bucket cannot be changed; moving it means a new bucket.

The state (`*.tfstate`) and `terraform.tfvars` stay out of git. The bucket keys used by the backup job are not managed here; they live in the vault.
