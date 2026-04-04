variable "project_name" {
  description = "Prefix nama resource"
  type        = string
  default     = "any-documentation"
}

variable "environment" {
  description = "dev | staging | prod"
  type        = string
  default     = "dev"
}

# Shared contract (same semantic key as AWS side)
variable "region" {
  description = "Region utama deployment (shared contract)"
  type        = string
  default     = "asia-southeast2"
}

# GCP-specific project identifier
variable "gcp_project_id" {
  description = "ID project GCP tempat resource akan dibuat"
  type        = string
}

# Optional zone for zonal resources
variable "gcp_zone" {
  description = "Zone default GCP (opsional)"
  type        = string
  default     = "asia-southeast2-a"
}

variable "github_repository" {
  description = "Repo GitHub untuk OIDC/WIF, format: owner/nama-repo"
  type        = string
  default     = "OWNER/REPO"
}

variable "gcp_billing_account_id" {
  description = "Billing account ID GCP (format: 000000-000000-000000), required for budget resources"
  type        = string
}

# ----------------------------
# Database (shared contract)
# ----------------------------
variable "db_name" {
  description = "Nama database PostgreSQL"
  type        = string
  default     = "wiki"
}

variable "db_username" {
  description = "Username PostgreSQL"
  type        = string
  default     = "wikiuser"
}

variable "db_password" {
  description = "Password PostgreSQL (sensitive)"
  type        = string
  sensitive   = true
}

# Cloud SQL tuning
variable "db_tier" {
  description = "Tier mesin Cloud SQL"
  type        = string
  default     = "db-f1-micro"
}

variable "db_disk_size_gb" {
  description = "Ukuran disk awal Cloud SQL (GB)"
  type        = number
  default     = 20
}

variable "db_disk_type" {
  description = "Jenis disk Cloud SQL: PD_SSD atau PD_HDD"
  type        = string
  default     = "PD_SSD"
}

variable "db_availability_type" {
  description = "Ketersediaan Cloud SQL: ZONAL atau REGIONAL"
  type        = string
  default     = "ZONAL"
}

variable "db_deletion_protection" {
  description = "Proteksi hapus instance Cloud SQL"
  type        = bool
  default     = false
}

variable "db_backup_enabled" {
  description = "Aktifkan backup otomatis Cloud SQL"
  type        = bool
  default     = true
}

variable "db_pitr_enabled" {
  description = "Aktifkan point-in-time recovery (WAL) Cloud SQL"
  type        = bool
  default     = false
}

# Shared contract equivalent to AWS external DB CIDR control
variable "db_allowed_cidr" {
  description = "CIDR yang boleh akses DB dari luar (kosongkan jika tidak dipakai)"
  type        = string
  default     = "0.0.0.0/0"
}

# ----------------------------
# Application secrets (shared contract)
# ----------------------------
variable "nextauth_secret" {
  description = "Secret untuk NextAuth"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "API key Gemini (boleh kosong)"
  type        = string
  sensitive   = true
  default     = ""
}

# ----------------------------
# Runtime (Cloud Run)
# ----------------------------
variable "container_image_tag" {
  description = "Tag image container yang akan dideploy"
  type        = string
  default     = "latest"
}

variable "app_container_port" {
  description = "Port container aplikasi"
  type        = number
  default     = 3000
}

variable "cloud_run_cpu" {
  description = "CPU limit Cloud Run"
  type        = string
  default     = "1"
}

variable "cloud_run_memory" {
  description = "Memory limit Cloud Run"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_min_instances" {
  description = "Minimum instance Cloud Run"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum instance Cloud Run"
  type        = number
  default     = 2
}

variable "cloud_run_allow_unauthenticated" {
  description = "Izinkan akses publik ke Cloud Run"
  type        = bool
  default     = true
}

# ----------------------------
# Storage
# ----------------------------
variable "docs_bucket_location" {
  description = "Lokasi bucket GCS untuk dokumen"
  type        = string
  default     = "ASIA-SOUTHEAST2"
}

variable "docs_bucket_force_destroy" {
  description = "Hapus bucket GCS beserta isinya saat destroy"
  type        = bool
  default     = false
}

variable "artifact_registry_repository_id" {
  description = "Nama repository Artifact Registry"
  type        = string
  default     = "app"
}

variable "artifact_registry_format" {
  description = "Format repository Artifact Registry"
  type        = string
  default     = "DOCKER"
}

# ----------------------------
# Budget / alert (shared contract)
# ----------------------------
variable "alert_email" {
  description = "Email untuk alert budget (opsional)"
  type        = string
  default     = ""
}

# Shared contract canonical key
variable "monthly_budget_usd" {
  description = "Batas budget bulanan (USD)"
  type        = number
  default     = 35
}

# Backward-compat alias (optional override)
variable "monthly_budget_amount" {
  description = "Alias lama untuk monthly_budget_usd"
  type        = number
  default     = null
  nullable    = true
}

# ----------------------------
# Labels
# ----------------------------
variable "labels" {
  description = "Label tambahan untuk resource GCP"
  type        = map(string)
  default     = {}
}
