locals {
  docs_bucket_name = lower("${var.project_name}-docs-${var.environment}-${var.gcp_project_id}")
}

resource "google_storage_bucket" "docs" {
  name                        = local.docs_bucket_name
  location                    = var.docs_bucket_location
  force_destroy               = var.docs_bucket_force_destroy
  uniform_bucket_level_access = true
  storage_class               = "STANDARD"
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 20
    }
  }

  labels = merge(
    {
      name = "${var.project_name}-mdx-docs"
    },
    var.labels
  )
}

resource "google_storage_bucket_iam_member" "docs_admin_to_runtime_sa" {
  bucket = google_storage_bucket.docs.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_artifact_registry_repository" "app" {
  provider      = google-beta
  location      = var.region
  repository_id = "${var.project_name}-${var.environment}-${var.artifact_registry_repository_id}"
  description   = "Docker images for ${var.project_name} (${var.environment})"
  format        = var.artifact_registry_format

  labels = var.labels
}
