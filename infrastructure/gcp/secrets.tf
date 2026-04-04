resource "google_secret_manager_secret" "database_url" {
  secret_id = "${var.project_name}-${var.environment}-database-url"

  replication {
    auto {}
  }

  labels = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
      component   = "app-secret"
      key         = "database-url"
    },
    var.labels
  )
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${var.db_username}:${urlencode(var.db_password)}@${google_sql_database_instance.postgres.public_ip_address}:5432/${var.db_name}?schema=public"

  depends_on = [
    google_sql_database.app,
    google_sql_user.app,
  ]
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "${var.project_name}-${var.environment}-nextauth-secret"

  replication {
    auto {}
  }

  labels = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
      component   = "app-secret"
      key         = "nextauth-secret"
    },
    var.labels
  )
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = var.nextauth_secret
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "${var.project_name}-${var.environment}-gemini-api-key"

  replication {
    auto {}
  }

  labels = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
      component   = "app-secret"
      key         = "gemini-api-key"
    },
    var.labels
  )
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}
