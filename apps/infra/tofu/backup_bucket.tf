# Private bucket for the encrypted backups: no public domain, no r2.dev, no CORS rules.
# It already exists, so adopt it first (see README) and only then plan; the plan must show no changes.
resource "cloudflare_r2_bucket" "backups" {
  account_id = var.cloudflare_account_id
  name       = var.backup_bucket
  location   = var.backup_bucket_location
}

# Mirrors the rules the bucket already has, so adopting it changes nothing.
# The default rule is created by Cloudflare on every bucket; the second one expires backups and drops unfinished uploads sooner.
resource "cloudflare_r2_bucket_lifecycle" "backups" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.backups.name
  rules = [
    {
      id      = "Default Multipart Abort Rule"
      enabled = true
      conditions = {
        prefix = "" # the provider requires it; an empty prefix means every object, like the empty condition Cloudflare keeps
      }
      abort_multipart_uploads_transition = {
        condition = {
          type    = "Age"
          max_age = 604800
        }
      }
    },
    {
      id      = "expire-after-8-days"
      enabled = true
      conditions = {
        prefix = ""
      }
      delete_objects_transition = {
        condition = {
          type    = "Age"
          max_age = var.backup_retention_days * 86400
        }
      }
      abort_multipart_uploads_transition = {
        condition = {
          type    = "Age"
          max_age = 86400
        }
      }
    },
  ]
}

# Retention lock: nothing can be deleted or overwritten for the first days, even with a valid key.
resource "cloudflare_r2_bucket_lock" "backups" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.backups.name
  rules = [
    {
      id      = "lock-7-days"
      enabled = true
      prefix  = ""
      condition = {
        type            = "Age"
        max_age_seconds = var.backup_lock_days * 86400
      }
    },
  ]
}
