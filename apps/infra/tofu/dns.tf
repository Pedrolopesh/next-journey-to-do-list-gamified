# A records for the APIs. A low TTL (300) makes an IP change quick.
locals {
  api_hosts = {
    api     = "production"
    api-dev = "development"
  }
}

resource "hostinger_dns_record" "api" {
  for_each  = local.api_hosts
  zone      = var.zone
  name      = each.key
  type      = "A"
  value     = var.vps_ipv4
  ttl       = 300
  overwrite = true # adopts the record that already exists in the panel instead of duplicating it
}
