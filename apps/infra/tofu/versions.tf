terraform {
  required_version = ">= 1.8"
  required_providers {
    hostinger = {
      source  = "hostinger/hostinger"
      version = "~> 0.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# The token comes from the HOSTINGER_API_TOKEN environment variable (never from a file).
provider "hostinger" {}

# The token comes from the CLOUDFLARE_API_TOKEN environment variable (never from a file).
provider "cloudflare" {}
