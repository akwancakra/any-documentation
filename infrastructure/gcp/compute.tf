locals {
  service_name = "${var.project_name}-${var.environment}"

  artifact_repository_id = "${var.project_name}-${var.environment}-${var.artifact_registry_repository_id}"
  container_image        = "${var.region}-docker.pkg.dev/${var.gcp_project_id}/${local.artifact_repository_id}/${var.project_name}:${var.container_image_tag}"
}

resource "google_cloud_run_v2_service" "app" {
  name     = local.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_runtime.email
    timeout         = "300s"

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = local.container_image

      ports {
        container_port = var.app_container_port
      }

      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = tostring(var.app_container_port)
      }

      env {
        name  = "HOSTNAME"
        value = "0.0.0.0"
      }

      env {
        name  = "DOCS_STORAGE"
        value = "gcs"
      }

      env {
        name  = "DOCS_S3_BUCKET"
        value = google_storage_bucket.docs.name
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.gcp_project_id
      }

      env {
        name  = "GCP_REGION"
        value = var.region
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.nextauth_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_artifact_registry_repository.app,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.nextauth_secret,
    google_secret_manager_secret_version.gemini_api_key,
    google_storage_bucket.docs,
    google_service_account.cloud_run_runtime
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count    = var.cloud_run_allow_unauthenticated ? 1 : 0
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
