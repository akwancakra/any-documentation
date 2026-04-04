# Infrastructure

Folder ini berisi **Terraform stacks** yang dipisah per cloud provider.

## Struktur

- `aws/` → stack Terraform untuk AWS
- `gcp/` → stack Terraform untuk GCP

---

## Tujuan desain

Kedua stack menggunakan **arsitektur ekuivalen** (konsep sama, resource native berbeda), sehingga:

- mudah berpindah/membandingkan provider
- CI/CD bisa konsisten
- isolasi state lebih aman per provider

---

## Shared contract (disarankan)

Agar pipeline/deployment tetap seragam, gunakan nama variabel/output yang sepadan di kedua stack.

### Input umum
- `project_name`
- `environment`
- `region` (atau padanan provider)
- `db_name`
- `db_username`
- `db_password` (sensitive)
- `nextauth_secret` (sensitive)
- `gemini_api_key` (sensitive, optional)
- `alert_email` (optional)
- `github_repository`

### Output umum
- `app_url`
- `container_repository`
- `docs_bucket`
- `db_endpoint`
- `database_url_for_ci` (sensitive)
- `github_actions_identity`

---

## Cara pakai (AWS)

```/dev/null/infrastructure-readme-aws.sh#L1-8
cd infrastructure/aws
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars sesuai environment
terraform init
terraform plan
terraform apply
```

---

## Cara pakai (GCP)

```/dev/null/infrastructure-readme-gcp.sh#L1-8
cd infrastructure/gcp
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars sesuai environment
terraform init
terraform plan
terraform apply
```

> Catatan GCP: pastikan `gcp_project_id` dan `gcp_billing_account_id` valid.

---

## State & keamanan

- Simpan state remote:
  - AWS: backend S3 (+ lock table bila dipakai)
  - GCP: backend GCS
- Jangan commit:
  - `terraform.tfvars`
  - `*.tfstate`
  - `.terraform/`
- Semua secret harus lewat secret manager/provider secret store, bukan hardcoded.

---

## Migrasi dari struktur lama

Root `infrastructure/` sekarang hanya folder pengelompokan.
Terraform aktif ada di:
- `infrastructure/aws`
- `infrastructure/gcp`

Jika ada script lama yang masih mengarah ke `infrastructure/`, update ke subfolder provider yang benar.

---

## Konvensi workflow tim

- Buat perubahan provider-specific di folder masing-masing.
- Hindari copy-paste tanpa penyesuaian resource native provider.
- Saat menambah komponen baru, update kedua stack agar tetap ekuivalen.
- Validasi minimal:
  - `terraform fmt -check`
  - `terraform validate`
  - `terraform plan`
