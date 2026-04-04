# Infrastructure

This folder contains **Terraform stacks** split by cloud provider.

## Layout

- `aws/` — Terraform stack for AWS
- `gcp/` — Terraform stack for GCP

## Design goals

Both stacks target an **equivalent architecture** (same concepts, provider-native resources) so that:

- comparing or switching providers is straightforward
- CI/CD patterns stay consistent
- state is isolated per provider

## Shared contract (recommended)

Use aligned variable/output names across stacks where possible.

### Common inputs

- `project_name`
- `environment`
- `region` (or provider equivalent)
- `db_name`
- `db_username`
- `db_password` (sensitive)
- `nextauth_secret` (sensitive)
- `gemini_api_key` (sensitive, optional)
- `alert_email` (optional)
- `github_repository`

### Common outputs

- `app_url`
- `container_repository`
- `docs_bucket`
- `db_endpoint`
- `database_url_for_ci` (sensitive)
- `github_actions_identity`

---

## AWS usage

```bash
cd infrastructure/aws
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars for your environment
terraform init
terraform plan
terraform apply
```

## GCP usage

```bash
cd infrastructure/gcp
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars for your environment
terraform init
terraform plan
terraform apply
```

> **GCP:** ensure `gcp_project_id` and `gcp_billing_account_id` are valid.

---

## State & security

- Use **remote state**:
  - AWS: S3 backend (+ DynamoDB lock table if used)
  - GCP: GCS backend
- Do **not** commit:
  - `terraform.tfvars`
  - `*.tfstate`
  - `.terraform/`
- Secrets belong in a secret manager or provider secret store, not in Git.

---

## Migration from older layout

The root `infrastructure/` folder is only a grouping layer. Active Terraform lives in:

- `infrastructure/aws`
- `infrastructure/gcp`

If older scripts still point at `infrastructure/`, update them to the correct provider subfolder.

---

## Team conventions

- Make provider-specific changes inside each provider folder.
- Avoid blind copy-paste; adapt to each cloud’s native resources.
- When adding a new component, update **both** stacks when you need feature parity.
- Minimum checks:
  - `terraform fmt -check`
  - `terraform validate`
  - `terraform plan`
