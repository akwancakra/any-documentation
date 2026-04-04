locals {
  service_name = "${var.project_name}-${var.environment}"

  cloud_run_sa_id = substr(
    regexreplace(lower("${local.service_name}-run-sa"), "[^a-z0-9-]", "-"),
    0,
    30
  )

  github_deploy_sa_id = substr(
    regexreplace(lower("${local.service_name}-gha-sa"), "[^a-z0-9-]", "-"),
    0,
    30
  )
}

# Service account used by Cloud Run runtime
resource "google_service_account" "cloud_run_runtime" {
  account_id   = local.cloud_run_sa_id
  display_name = "${var.project_name} ${var.environment} Cloud Run Runtime"
  description  = "Runtime service account for Cloud Run service"
}

# Service account used by GitHub Actions deploy pipeline (via Workload Identity Federation)
resource "google_service_account" "github_deployer" {
  account_id   = local.github_deploy_sa_id
  display_name = "${var.project_name} ${var.environment} GitHub Deployer"
  description  = "Deployment service account for GitHub Actions (WIF)"
}

# ---- Cloud Run runtime permissions ----
resource "google_project_iam_member" "cloud_run_runtime_logs" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_project_iam_member" "cloud_run_runtime_metrics" {
  project = var.gcp_project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_project_iam_member" "cloud_run_runtime_tracing" {
  project = var.gcp_project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_project_iam_member" "cloud_run_runtime_secret_access" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_project_iam_member" "cloud_run_runtime_cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_storage_bucket_iam_member" "cloud_run_runtime_docs_admin" {
  bucket = google_storage_bucket.docs.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

# ---- GitHub deployer permissions ----
resource "google_project_iam_member" "github_deployer_run_admin" {
  project = var.gcp_project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "github_deployer_artifactregistry_writer" {
  project = var.gcp_project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "github_deployer_sa_user" {
  project = var.gcp_project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "github_deployer_secret_admin" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "github_deployer_cloudsql_viewer" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.viewer"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

# Allow GitHub deployer SA to act as Cloud Run runtime SA during deploy
resource "google_service_account_iam_member" "github_deployer_can_impersonate_runtime" {
  service_account_id = google_service_account.cloud_run_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer.email}"
}
