# Private bucket for the encrypted backups: no public domain, no r2.dev, no CORS rules.
# It already exists, so adopt it first (see README) and only then plan; the plan must show no changes.
resource "cloudflare_r2_bucket" "backups" {
  account_id = var.cloudflare_account_id
  name       = var.backup_bucket
  location   = var.backup_bucket_location
}

# Old backups expire, and uploads that never finished are dropped after a day.
resource "cloudflare_r2_bucket_lifecycle" "backups" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.backups.name
  rules = [
    {
      id      = "expire-backups"
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
    },
    {
      id      = "abort-incomplete-uploads"
      enabled = true
      conditions = {
        prefix = ""
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
      id      = "lock-backups"
      enabled = true
      prefix  = ""
      condition = {
        type            = "Age"
        max_age_seconds = var.backup_lock_days * 86400
      }
    },
  ]
}
