variable "zone" {
  description = "Domain managed at Hostinger"
  type        = string
}

variable "vps_ipv4" {
  description = "Public IP of the VPS"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the backup bucket"
  type        = string
}

variable "backup_bucket" {
  description = "Name of the private bucket that holds the encrypted backups"
  type        = string
}

variable "backup_bucket_location" {
  description = "Location hint of the bucket (it cannot be changed later; a new bucket is needed to move it)"
  type        = string
  default     = "enam"
}

variable "backup_retention_days" {
  description = "Days before the lifecycle rule deletes a backup object"
  type        = number
  default     = 8
}

variable "backup_lock_days" {
  description = "Days an object cannot be deleted or overwritten (protects old backups from a leaked key)"
  type        = number
  default     = 7
}
