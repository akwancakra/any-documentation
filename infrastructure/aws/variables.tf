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

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "db_name" {
  type    = string
  default = "wiki"
}

variable "db_username" {
  type    = string
  default = "wikiuser"
}

variable "db_password" {
  description = "Password RDS (simpan aman, jangan commit)"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  type      = string
  sensitive = true
}

variable "gemini_api_key" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Boleh kosong jika fitur AI tidak dipakai di prod"
}

variable "alert_email" {
  description = "Email untuk SNS budget & alarm (opsional)"
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "Repo GitHub untuk OIDC, format: owner/nama-repo"
  type        = string
  default     = "OWNER/REPO"
}

variable "rds_allowed_cidr" {
  description = "CIDR yang boleh konek ke Postgres (untuk prisma migrate dari GitHub Actions). Sempitkan di prod nyata."
  type        = string
  default     = "0.0.0.0/0"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}
