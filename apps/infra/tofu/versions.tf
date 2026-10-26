terraform {
  required_version = ">= 1.8"
  required_providers {
    hostinger = {
      source  = "hostinger/hostinger"
      version = "~> 0.1"
    }
  }
}

# The token comes from the HOSTINGER_API_TOKEN environment variable (never from a file).
provider "hostinger" {}
