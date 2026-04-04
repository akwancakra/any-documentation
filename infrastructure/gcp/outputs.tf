output "app_url" {
  description = "Public URL aplikasi (Cloud Run)"
  value       = google_cloud_run_v2_service.app.uri
}

output "container_repository" {
  description = "Container repository URL (Artifact Registry)"
  value       = "${var.region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "docs_bucket" {
  description = "Bucket GCS untuk dokumen"
  value       = google_storage_bucket.docs.name
}

output "db_endpoint" {
  description = "Endpoint IP publik Cloud SQL PostgreSQL"
  value       = google_sql_database_instance.postgres.public_ip_address
}

output "database_url_for_ci" {
  description = "Connection string untuk CI/CD migration (sensitive)"
  value       = local.database_url_for_ci
  sensitive   = true
}

output "github_actions_identity" {
  description = "Identity untuk GitHub Actions deployer (service account email)"
  value       = google_service_account.github_deployer.email
}

output "cloud_run_service_name" {
  description = "Nama service Cloud Run"
  value       = google_cloud_run_v2_service.app.name
}

output "cloud_run_runtime_service_account" {
  description = "Service account runtime Cloud Run"
  value       = google_service_account.cloud_run_runtime.email
}

output "artifact_registry_repository_id" {
  description = "Artifact Registry repository ID"
  value       = google_artifact_registry_repository.app.repository_id
}

output "secrets_manager_secret_names" {
  description = "Nama secret yang dipakai aplikasi"
  value = {
    database_url    = google_secret_manager_secret.database_url.secret_id
    nextauth_secret = google_secret_manager_secret.nextauth_secret.secret_id
    gemini_api_key  = google_secret_manager_secret.gemini_api_key.secret_id
  }
}
