# tofu

DNS records for the API (`api` and `api-dev`, type A) with OpenTofu and the `hostinger/hostinger` provider.

```bash
export HOSTINGER_API_TOKEN=...                   # API token, session only
cp terraform.tfvars.example terraform.tfvars     # fill in zone and vps_ipv4 (git-ignored)
tofu init && tofu plan                           # the plan only shows changes; nothing changes without `tofu apply`
```

The state (`*.tfstate`) and `terraform.tfvars` stay out of git.
