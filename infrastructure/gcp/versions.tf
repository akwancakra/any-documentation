terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Optional remote state backend (create bucket manually, then uncomment):
  # backend "gcs" {
  #   bucket = "your-tfstate-bucket-name"
  #   prefix = "any-documentation/terraform"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region

  default_labels = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
    },
    var.labels
  )
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.region

  default_labels = merge(
    {
      project     = var.project_name
      environment = var.environment
      managed_by  = "terraform"
    },
    var.labels
  )
}
