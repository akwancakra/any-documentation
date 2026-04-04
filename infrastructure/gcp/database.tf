locals {
  sql_instance_name = "${var.project_name}-pg-${var.environment}"

  # Shared local so other resources/files can reuse this DSN
  database_url_for_ci = "postgresql://${var.db_username}:${urlencode(var.db_password)}@${google_sql_database_instance.postgres.public_ip_address}:5432/${var.db_name}?schema=public"
}

resource "google_sql_database_instance" "postgres" {
  name             = local.sql_instance_name
  database_version = "POSTGRES_16"
  region           = var.region

  deletion_protection = var.db_deletion_protection

  settings {
    tier            = var.db_tier
    disk_type       = var.db_disk_type
    disk_size       = var.db_disk_size_gb
    disk_autoresize = true

    availability_type = var.db_availability_type

    backup_configuration {
      enabled                        = var.db_backup_enabled
      point_in_time_recovery_enabled = var.db_pitr_enabled
    }

    ip_configuration {
      ipv4_enabled = true

      dynamic "authorized_networks" {
        for_each = var.db_allowed_cidr != "" ? [var.db_allowed_cidr] : []
        content {
          name  = "external-access"
          value = authorized_networks.value
        }
      }
    }
  }
}

resource "google_sql_database" "app" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = var.db_username
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
